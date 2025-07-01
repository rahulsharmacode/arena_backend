const { OAuth } = require("../schema/oauth.schema");
const { User } = require("../schema/user.schema");
const jwt  = require("jsonwebtoken")
const crypto = require("crypto")


/* linkdine */
const linkedinPreLog = (req, res) => {
  const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ACCESS;
  const LINKEDIN_REDIRECT_URI = 'http://localhost:3000/api/v1/auth/linkedin/callback'; // Must be URL-encoded later
  const state = generateRandomString(16); // Implement your own random string generator

  // Store the state in the user's session for later verification
  req.session.linkedinState = state; // Requires express-session middleware

  const scope = encodeURIComponent('email profile openid'); // Or 'openid profile email'
  const redirectUriEncoded = encodeURIComponent(LINKEDIN_REDIRECT_URI);

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUriEncoded}&state=${state}&scope=${scope}`;

  res.redirect(authUrl);
}
const linkedinLog = async (req, res) => {
  // Make sure these are securely loaded, e.g., from environment variables
  const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ACCESS;
  const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
  const LINKEDIN_REDIRECT_URI = 'http://localhost:3000/api/v1/auth/linkedin/callback'; // Make sure this matches your LinkedIn app settings exactly

  const { code, state, error, error_description } = req.query;

  // 1. Verify state parameter
  if (!state || state !== req.session.linkedinState) {
    console.error('CSRF attack detected or state mismatch.');
    return res.status(403).send('CSRF attack detected or state mismatch.');
  }
  delete req.session.linkedinState; // Clear state after use

  if (error) {
    console.error('LinkedIn OAuth Error:', error, error_description);
    return res.redirect('/login?error=linkedin_auth_failed');
  }

  try {
    // 2. Exchange code for access token using fetch
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
        redirect_uri: LINKEDIN_REDIRECT_URI,
      }).toString(),
    });

    // Check if the response was successful
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json(); // Attempt to parse error response
      console.error('LinkedIn token exchange failed:', tokenResponse.status, errorData);
      throw new Error(`Failed to exchange code for token: ${tokenResponse.statusText} - ${JSON.stringify(errorData)}`);
    }

    const { access_token, expires_in, scope, id_token } = await tokenResponse.json();
    let userIdFromToken = null;
    let userProfile = null;
    try {
      const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          // 'X-Restli-Protocol-Version': '2.0.0', // Often not needed for /userinfo but can be included for other v2 endpoints
        },
      });
      if (!userInfoResponse.ok) {
        const userInfoErrorData = await userInfoResponse.json();
        console.error('Failed to fetch LinkedIn user profile:', userInfoResponse.status, userInfoErrorData);
        throw new Error(`Failed to fetch user profile: ${userInfoResponse.statusText} - ${JSON.stringify(userInfoErrorData)}`);
      }

      userProfile = await userInfoResponse.json();
      console.log("🚀 ~ linkedinLog ~ userProfile:", userProfile)
      const { access } = req?.cookies || {};
              if (access) {
                  const verifyToken = jwt.decode(access, process.env.SECRET_KEY);
                  if (verifyToken && verifyToken._id) {
                      userIdFromToken = verifyToken._id;


                          if (userIdFromToken) {
                // Link linkdine to an existing user identified by the JWT
                const userToLink = await User.findById(userIdFromToken);
                if (userToLink) {
                    // Ensure `OAuth` schema can handle linking or merge into `User` schema
                    // This assumes `OAuth` is a separate model for linked accounts
                    const newOAuthEntry = new OAuth({
                        oAuthId: userProfile.sub,
                        name: userProfile.name || userProfile?.displayName || "", // linkdine uses 'username' for basic users, 'displayName' for others
                        email: userProfile.email,
                        user: userIdFromToken, // Link to the existing user
                    });
                    await newOAuthEntry.save();
    
                    // Update the main User model to mark linkdine as verified/linked
                    await User.findByIdAndUpdate(userIdFromToken, {
                        $set: { isLinkedinVerified: true } // Assuming 'islinkdineVerified' in your User model
                    });
                    console.log("linkdine account linked to existing user.");
                } else {
                    console.warn("JWT identified user not found in database for linking.");
                    // Fall through to create a new user if linking failed
                }
            }


                  } else {
                      console.warn("JWT decoded but _id not found or token is invalid.");
                  }
              } else {
                  console.log("No 'access' cookie found. This might be a new login without prior session.");
              }


      res.redirect(`http://localhost:4000/profile?modal=update&ms=${Date.now()}`); // frontend redirect
    } catch (profileFetchError) {
      console.error('Error fetching LinkedIn user profile:', profileFetchError.message);
      res.redirect('/login?error=profile_fetch_failed');
    }
  } catch (err) {
    console.error('Error during LinkedIn OAuth flow:', err.message);
    res.redirect('/login?error=token_exchange_failed');
  }
};

/* twitter */
const twitterPreLog = (req, res) => {
  const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ACCESS;
  const TWITTER_REDIRECT_URI = 'http://localhost:3000/api/v1/auth/twitter/callback'; // Must be URL-encoded later

  const state = crypto.randomBytes(16).toString('hex'); // Generate random state
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Store state and code_verifier in session for verification later
  req.session.twitterState = state;
  req.session.twitterCodeVerifier = codeVerifier;

  const scope = encodeURIComponent('users.read offline.access'); // 'offline.access' for refresh tokens
  const redirectUriEncoded = encodeURIComponent(TWITTER_REDIRECT_URI);

  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_CLIENT_ID}&redirect_uri=${redirectUriEncoded}&scope=${scope}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  res.redirect(authUrl);
}
const twitterLog = async (req, res) => {
  // IMPORTANT: Use environment variables for client ID and secret in production
  const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ACCESS;
  const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
  const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/twitter/callback';

  const { code, state, error, error_description } = req.query;

  // 1. Verify state and code_verifier
  if (!state || state !== req.session.twitterState) {
    console.error('CSRF attack detected or state mismatch.');
    return res.status(403).send('CSRF attack detected or state mismatch.');
  }
  const codeVerifier = req.session.twitterCodeVerifier;
  if (!codeVerifier) {
      console.error('PKCE code_verifier missing from session. This might indicate a stale session or an attack.');
      return res.status(400).send('PKCE code_verifier missing.');
  }
  delete req.session.twitterState; // Clear state after use
  delete req.session.twitterCodeVerifier; // Clear verifier after use

  if (error) {
    console.error('Twitter OAuth Error:', error, error_description);
    return res.redirect('/login?error=twitter_auth_failed');
  }

  try {
    // Construct Basic Authorization header for client_id and client_secret
    const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');

    // 2. Exchange code for access token using fetch
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`, // IMPORTANT: Basic Auth header
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: TWITTER_CLIENT_ID, // Required again for PKCE flow
        redirect_uri: TWITTER_REDIRECT_URI,
        code_verifier: codeVerifier, // PKCE verifier
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Twitter token exchange failed:', tokenResponse.status, errorData);
      throw new Error(`Failed to exchange code for token: ${tokenResponse.statusText} - ${JSON.stringify(errorData)}`);
    }

    const { access_token, refresh_token, expires_in, scope, token_type } = await tokenResponse.json();
    console.log(access_token, refresh_token, expires_in, scope, token_type , "0000 twitter ----");
    // --- Existing Linking/Login Logic (adapted for Twitter) ---
    let userIdFromToken = null;
    let userProfile = {}
    const { access } = req?.cookies || {};

    if (access) {
      try {
        const verifyToken = jwt.decode(access, process.env.SECRET_KEY); // Assuming SECRET_KEY is set
        if (verifyToken && verifyToken._id) {
          userIdFromToken = verifyToken._id;

          
                          if (userIdFromToken) {
                // Link linkdine to an existing user identified by the JWT
                const userToLink = await User.findById(userIdFromToken);
                if (userToLink) {
                


                    
                    const newOAuthEntry = new OAuth({
                        oAuthId: userProfile.sub||"",
                        name: userProfile.username || userProfile?.displayName || "", // linkdine uses 'username' for basic users, 'displayName' for others
                        email: userProfile.email | "",
                        user: userIdFromToken, 
                    });
                    await newOAuthEntry.save();
    
                    // Update the main User model to mark linkdine as verified/linked
                    await User.findByIdAndUpdate(userIdFromToken, {
                        $set: { isXVerified: true } // Assuming 'islinkdineVerified' in your User model
                    });
                    console.log("linkdine account linked to existing user.");
                } else {
                    console.warn("JWT identified user not found in database for linking.");
                    // Fall through to create a new user if linking failed
                }
            }


        } else {
          console.warn("JWT decoded but _id not found or token is invalid.");
        }
      } catch (jwtError) {
        console.error("Error decoding JWT from cookie:", jwtError.message);
      }
    } else {
      console.log("No 'access' cookie found. This might be a new login without prior session.");
    }

    res.redirect(`http://localhost:4000/profile?modal=update&ms=${Date.now()}`); // frontend redirect

  } catch (err) {
    console.error('Error during Twitter OAuth flow:', err.message);
    res.redirect(`/login?error=${encodeURIComponent(err.message || 'twitter_oauth_failed')}`);
  }
};












/* helper functions */

function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};


// Helper function to generate PKCE code_verifier
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to generate PKCE code_challenge (S256)
function generateCodeChallenge(verifier) {
  const sha256 = crypto.createHash('sha256').update(verifier).digest();
  return sha256.toString('base64url'); // Base64url encoding
}


module.exports ={
    linkedinPreLog,
    linkedinLog,
    twitterPreLog,
    twitterLog
}