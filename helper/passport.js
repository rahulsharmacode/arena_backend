// config/passport.js
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require('passport-twitter-oauth2').Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;





const passport = require('passport');
const { OAuth } = require('../schema/oauth.schema');
const jwt = require("jsonwebtoken");
const { User } = require('../schema/user.schema');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ACCESS,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/api/v1/auth/google/callback",
  passReqToCallback: true,
},
  async (req, accessToken, refreshToken, profile, done) => {
    const { access } = req?.cookies;
    const verifyToken = jwt.decode(access, process.env.SECRET_KEY)

    const existingUser = await OAuth.findOne({ oAuthId: profile.id });
    if (existingUser) return done(null, existingUser);
    console.log("🚀 ~ existingUser:", existingUser)

    const newUser = new OAuth({
      oAuthId: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value,
      user: verifyToken._id
    });
    await User.findByIdAndUpdate(verifyToken._id, {
      $set: {
        isYoutubeVerified: true,
        isGoogleVerified: true
      }
    })

    await newUser.save();
    return done(null, newUser);
  }
));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_CLIENT_ACCESS,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/api/v1/auth/facebook/callback",
  profileFields: ['id', 'displayName', 'photos', 'email'],
  passReqToCallback: true,
},
  async (req, accessToken, refreshToken, profile, done) => {

    const { access } = req?.cookies;
    const verifyToken = jwt.decode(access, process.env.SECRET_KEY)

    const existingUser = await OAuth.findOne({ oAuthId: profile.id });
    if (existingUser) return done(null, existingUser);
    const newUser = new OAuth({
      oAuthId: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value,
      user: verifyToken._id
    });
    await User.findByIdAndUpdate(verifyToken._id, {
      $set: {
        isFacebookVerified: true
      }
    })

    await newUser.save();
    return done(null, newUser);
  }
));


// TWITTER STRATEGY
passport.use(new TwitterStrategy({
  clientID: process.env.TWITTER_CLIENT_ACCESS,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/api/v1/auth/twitter/callback",
  scope: ['tweet.read', 'users.read'],
  state: true,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  const { access } = req?.cookies || {};
  const verifyToken = jwt.decode(access, process.env.SECRET_KEY);

  const existingUser = await OAuth.findOne({ twitterId: profile.id });
  if (existingUser) return done(null, existingUser);

  const newUser = new OAuth({
    twitterId: profile.id,
    name: profile.displayName,
    email: profile.emails?.[0]?.value,
    user: verifyToken._id,
  });
  await User.findByIdAndUpdate(verifyToken._id, {
    $set: { isTwitterVerified: true }
  });
  await newUser.save();
  return done(null, newUser);
}));

// passport.use(new LinkedinStrategy({
//   clientID: "86hgvbqgd80no9",
//   clientSecret: "WPL_AP1.VmzF188cAiiV2Utp.M0ZVHg==",
//   callbackURL: "http://localhost:3000/api/v1/auth/linkedin/callback",
// scope: ["openid",
//         "profile",
//         "email"],
// // scope: ['r_emailaddress', 'r_liteprofile'],
//   state: true,
//   passReqToCallback: true
// }, async (req, accessToken, refreshToken, profile, done) => {
//   console.log("🚀 ~ profile:", profile)
//   const { access } = req?.cookies || {};
//   const verifyToken = jwt.decode(access, process.env.SECRET_KEY);

//   const existingUser = await OAuth.findOne({ twitterId: profile.id });
//   if (existingUser) return done(null, existingUser);

//   const newUser = new OAuth({
//     twitterId: profile.id,
//     name: profile.displayName,
//     email: profile.emails?.[0]?.value,
//     user: verifyToken._id,
//   });
//   await User.findByIdAndUpdate(verifyToken._id, {
//     $set: { isLinkedinVerified: true }
//   });
//   await newUser.save();
//   return done(null, newUser);
// }));

// passport.use(new LinkedinStrategy({
//     // !! IMPORTANT !! Replace with your actual LinkedIn Application Client ID from LinkedIn Developer Portal
//     clientID: "86hgvbqgd80no9", // Use environment variables!
//     // !! IMPORTANT !! Replace with your actual LinkedIn Application Client Secret from LinkedIn Developer Portal
//     clientSecret: "WPL_AP1.VmzF188cAiiV2Utp.M0ZVHg==", // Use environment variables!
//     callbackURL: "http://localhost:3000/api/v1/auth/linkedin/callback",
//     // These are the correct scopes for LinkedIn basic profile and email
//     scope: ["openid", "profile", "email"],
//     state: true, // Recommended for CSRF protection
//     passReqToCallback: true // Allows access to 'req' object in the callback
// }, async (req, accessToken, refreshToken, profile, done) => {
//     // Log the LinkedIn profile to inspect its structure
//     console.log("🚀 ~ LinkedIn Profile:", JSON.stringify(profile, null, 2));

//     let userIdFromToken = null;
//     try {
//         const { access } = req?.cookies || {};
//         if (access) {
//             const verifyToken = jwt.decode(access, process.env.SECRET_KEY);
//             if (verifyToken && verifyToken._id) {
//                 userIdFromToken = verifyToken._id;
//             } else {
//                 console.warn("JWT decoded but _id not found or token is invalid for LinkedIn linking.");
//             }
//         } else {
//             console.log("No 'access' cookie found. This might be a new LinkedIn login without prior session for linking.");
//         }
//     } catch (jwtError) {
//         console.error("Error decoding JWT from cookie during LinkedIn auth:", jwtError);
//         return done(jwtError); // Or proceed if linking is optional
//     }

//     try {
//         // Find user by LinkedIn ID
//         const existingUser = await OAuth.findOne({ linkedinId: profile.id }); // <--- Changed to linkedinId

//         if (existingUser) {
//             console.log("Existing LinkedIn user found.");
//             // You might want to update existingUser details here if LinkedIn profile changes
//             return done(null, existingUser);
//         }

//         // If no existing LinkedIn user, create a new one or link to an existing user
//         if (userIdFromToken) {
//             const userToLink = await User.findById(userIdFromToken);
//             if (userToLink) {
//                 const newOAuthEntry = new OAuth({
//                     linkedinId: profile.id, // <--- Changed to linkedinId
//                     // LinkedIn's profile typically has profile.displayName or name.givenName/familyName
//                     name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
//                     email: profile.emails?.[0]?.value, // LinkedIn often provides emails in an array
//                     user: userIdFromToken, // Link to the existing user
//                 });
//                 await newOAuthEntry.save();

//                 await User.findByIdAndUpdate(userIdFromToken, {
//                     $set: { isLinkedInVerified: true } // <--- Changed to isLinkedInVerified
//                 });
//                 console.log("LinkedIn account linked to existing user.");
//                 return done(null, newOAuthEntry);
//             } else {
//                 console.warn("JWT identified user not found in database for LinkedIn linking.");
//             }
//         }

//         // If no existing LinkedIn user and no user to link, create a completely new user
//         console.log("Creating new LinkedIn user.");
//         const newUser = new OAuth({
//             linkedinId: profile.id, // <--- Changed to linkedinId
//             name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
//             email: profile.emails?.[0]?.value,
//             // If you create a full User entry, set 'user' field accordingly
//         });
//         await newUser.save();
//         return done(null, newUser);

//     } catch (err) {
//         console.error("Error during LinkedIn authentication:", err);
//         return done(err); // Pass any errors to Passport
//     }
// }));

// passport.use(new DiscordStrategy({
//   clientID: "1385308095818764409",
//   clientSecret: "pQIw_fdTFqdey2WCmQniMnOgtW4rb1zY",
//   callbackURL: "http://localhost:3000/api/v1/auth/discord/callback",
// scope: ["email","openid"],
// // scope: ['r_emailaddress', 'r_liteprofile'],
//   state: true,
//   passReqToCallback: true
// }, async (req, accessToken, refreshToken, profile, done) => {
//   console.log("🚀 ~ profile:", profile)
//   const { access } = req?.cookies || {};
//   const verifyToken = jwt.decode(access, process.env.SECRET_KEY);

//   const existingUser = await OAuth.findOne({ twitterId: profile.id });
//   if (existingUser) return done(null, existingUser);

//   const newUser = new OAuth({
//     twitterId: profile.id,
//     name: profile.displayName,
//     email: profile.emails?.[0]?.value,
//     user: verifyToken._id,
//   });
//   await User.findByIdAndUpdate(verifyToken._id, {
//     $set: { isTiktokVerified: true }
//   });
//   await newUser.save();
//   return done(null, newUser);
// }));


passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ACCESS,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/v1/auth/linkedin/callback",
      // IMPORTANT: Add 'r_liteprofile' for basic profile info
      scope: ["email", "openid", "profile"],
      passReqToCallback: true // Allows access to 'req' object in the callback
    },
    (
      accessToken,
      refreshToken,
      profile,
      done
    ) => {
      process.nextTick(() => {
        return done(null, profile);
      });
    }
  )
)
passport.use(new DiscordStrategy({
  // !! IMPORTANT !! Replace with your actual Discord Application Client ID
  clientID: process.env.DISCORD_CLIENT_ACCESS,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/api/v1/auth/discord/callback",
  // Use 'identify' to get user ID, username, avatar, etc.
  // Use 'email' to get the user's email address.
  scope: ["identify", "email"],
  state: true,
  passReqToCallback: true // Allows access to 'req' object in the callback
}, async (req, accessToken, refreshToken, profile, done) => {
  console.log("🚀 ~ Discord Profile:", profile); // Log the Discord profile to see what you're getting

  let userIdFromToken = null;
  try {
    const { access } = req?.cookies || {};
    if (access) {
      const verifyToken = jwt.decode(access, process.env.SECRET_KEY);
      if (verifyToken && verifyToken._id) {
        userIdFromToken = verifyToken._id;
      } else {
        console.warn("JWT decoded but _id not found or token is invalid.");
      }
    } else {
      console.log("No 'access' cookie found. This might be a new login without prior session.");
    }
  } catch (jwtError) {
    console.error("Error decoding JWT from cookie:", jwtError);
    // Decide how to handle this: either proceed without linking or return an error
    return done(jwtError); // Or proceed if linking is optional
  }

  try {
    // Find user by Discord ID
    const existingUser = await OAuth.findOne({ oAuthId: profile.id });

    if (existingUser) {
      // If the user exists, update their profile if needed or simply log them in
      // You might want to update access/refresh tokens here or other profile info
      console.log("Existing Discord user found.");
      return done(null, existingUser);
    }

    // If no existing Discord user, create a new one or link to an existing user
    if (userIdFromToken) {
      // Link Discord to an existing user identified by the JWT
      const userToLink = await User.findById(userIdFromToken);
      if (userToLink) {
        // Ensure `OAuth` schema can handle linking or merge into `User` schema
        // This assumes `OAuth` is a separate model for linked accounts
        const newOAuthEntry = new OAuth({
          oAuthId: profile.id,
          name: profile.username || profile.displayName, // Discord uses 'username' for basic users, 'displayName' for others
          email: profile.email,
          user: userIdFromToken, // Link to the existing user
        });
        await newOAuthEntry.save();

        // Update the main User model to mark Discord as verified/linked
        await User.findByIdAndUpdate(userIdFromToken, {
          $set: { isDiscordVerified: true } // Assuming 'isDiscordVerified' in your User model
        });
        console.log("Discord account linked to existing user.");
        return done(null, newOAuthEntry); // Or return the 'userToLink' if your passport session stores the main User
      } else {
        console.warn("JWT identified user not found in database for linking.");
        // Fall through to create a new user if linking failed
      }
    }

    // If no existing Discord user and no user to link, create a completely new user
    // You might want to create a full `User` entry here, not just an `OAuth` entry
    console.log("Creating new Discord user.");
    const newUser = new OAuth({
      oAuthId: profile.id,
      name: profile.username || profile.displayName, // Discord uses 'username' for basic users
      email: profile.email,
      // If you create a full User entry, set 'user' field accordingly
      // For now, assuming OAuth stores basic user info itself if not linked
    });
    await newUser.save();
    return done(null, newUser);

  } catch (err) {
    console.error("Error during Discord authentication:", err);
    return done(err); // Pass any errors to Passport
  }
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ACCESS,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/api/v1/auth/github/callback",
  scope: ['user:email'],
  passReqToCallback: true // Allows access to 'req' object in the callback

},
  async function (req, accessToken, refreshToken, profile, done) {
    console.log("🚀 ~ Discord Profile:", profile); // Log the Discord profile to see what you're getting

    let userIdFromToken = null;
    try {
      const { access } = req?.cookies || {};

      console.log(req, "---access----")
      if (access) {
        const verifyToken = jwt.decode(access, process.env.SECRET_KEY);
        if (verifyToken && verifyToken._id) {
          userIdFromToken = verifyToken._id;
        } else {
          console.warn("JWT decoded but _id not found or token is invalid.");
        }
      } else {
        console.log("No 'access' cookie found. This might be a new login without prior session.");
      }
    } catch (jwtError) {
      console.error("Error decoding JWT from cookie:", jwtError);
      // Decide how to handle this: either proceed without linking or return an error
      return done(jwtError); // Or proceed if linking is optional
    }

    try {
      // Find user by Discord ID
      const existingUser = await OAuth.findOne({ oAuthId: profile.id });

      if (existingUser) {
        // If the user exists, update their profile if needed or simply log them in
        // You might want to update access/refresh tokens here or other profile info
        console.log("Existing Discord user found.");
        return done(null, existingUser);
      }

      // If no existing Discord user, create a new one or link to an existing user
      if (userIdFromToken) {
        // Link Discord to an existing user identified by the JWT
        const userToLink = await User.findById(userIdFromToken);
        if (userToLink) {
          // Ensure `OAuth` schema can handle linking or merge into `User` schema
          // This assumes `OAuth` is a separate model for linked accounts
          const newOAuthEntry = new OAuth({
            discordId: profile.id,
            name: profile.username || profile.displayName, // Discord uses 'username' for basic users, 'displayName' for others
            email: profile.email,
            user: userIdFromToken, // Link to the existing user
          });
          await newOAuthEntry.save();

          // Update the main User model to mark Discord as verified/linked
          await User.findByIdAndUpdate(userIdFromToken, {
            $set: { isGithubVerified: true } // Assuming 'isDiscordVerified' in your User model
          });
          console.log("Discord account linked to existing user.");
          return done(null, newOAuthEntry); // Or return the 'userToLink' if your passport session stores the main User
        } else {
          console.warn("JWT identified user not found in database for linking.");
          // Fall through to create a new user if linking failed
        }
      }

      // If no existing Discord user and no user to link, create a completely new user
      // You might want to create a full `User` entry here, not just an `OAuth` entry
      console.log("Creating new Discord user.");
      const newUser = new OAuth({
        discordId: profile.id,
        name: profile.username || profile.displayName, // Discord uses 'username' for basic users
        email: profile.email,
        // If you create a full User entry, set 'user' field accordingly
        // For now, assuming OAuth stores basic user info itself if not linked
      });
      await newUser.save();
      return done(null, newUser);

    } catch (err) {
      console.error("Error during Discord authentication:", err);
      return done(err); // Pass any errors to Passport
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  OAuth.findById(id).then(user => done(null, user));
});
