const { TesseractWorker } = require('tesseract.js');
const { User } = require('../schema/user.schema');
const { normalizeProfileUrl } = require('../helper/index.function');


// const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

// const verifyImage = async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ message: 'No screenshot file uploaded.' });
//     }

//     const { expectedCode } = req.body;
//     if (!expectedCode) {
//         return res.status(400).json({ message: 'Verification code is required.' });
//     }

//     // Retrieve the stored OTP for the given userId
//     const storedOtp = 4329;
   
//     let profileUrl = null;
//     let extractedCode = null;
//     let geminiRawTextResponse = ''; // To store the full text output from Gemini if available

//     try {
//         console.log('Converting image to Base64 and sending to Gemini API for analysis...');
//         // Convert image buffer to Base64
//         const base64ImageData = req.file.buffer.toString('base64');
//         const mimeType = req.file.mimetype; // Get the mime type of the uploaded file

//         const prompt = `From this social media screenshot, identify the user's profile URL (e.g., facebook.com/username, twitter.com/username) and any 3 or 4 digit numerical code that might be displayed for verification purposes. Provide the output in JSON format.`;

//         const payload = {
//             contents: [
//                 {
//                     role: "user",
//                     parts: [
//                         { text: prompt },
//                         {
//                             inlineData: {
//                                 mimeType: mimeType,
//                                 data: base64ImageData
//                             }
//                         }
//                     ]
//                 }
//             ],
//             generationConfig: {
//                 responseMimeType: "application/json",
//                 responseSchema: {
//                     type: "OBJECT",
//                     properties: {
//                         "profileUrl": { "type": "STRING", "description": "The social media profile URL found, or null if none." },
//                         "verificationCode": { "type": "STRING", "description": "A 3 or 4 digit numerical code found, or null if none." }
//                     },
//                     "required": ["profileUrl", "verificationCode"]
//                 }
//             }
//         };

//         const response = await fetch(GEMINI_API_URL, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });

//         if (!response.ok) {
//             const errorText = await response.text();
//             console.error('Gemini API response not OK:', response.status, errorText);
//             throw new Error(`Gemini API request failed: ${response.statusText} - ${errorText}`);
//         }

//         const result = await response.json();
//         console.log('Gemini API raw response:', JSON.stringify(result, null, 2));

//         if (result.candidates && result.candidates.length > 0 &&
//             result.candidates[0].content && result.candidates[0].content.parts &&
//             result.candidates[0].content.parts.length > 0) {
//             const geminiContent = result.candidates[0].content.parts[0];
            
//             if (geminiContent.text) {
//                 // Try to parse as JSON first
//                 try {
//                     const parsedGeminiData = JSON.parse(geminiContent.text);
//                     profileUrl = parsedGeminiData.profileUrl || null;
//                     extractedCode = parsedGeminiData.verificationCode || null;
//                     geminiRawTextResponse = geminiContent.text; // Store the raw JSON string
//                 } catch (jsonParseError) {
//                     // If not valid JSON, it might be plain text from Gemini, capture it.
//                     console.warn('Gemini response was not a valid JSON string. Treating as plain text.');
//                     geminiRawTextResponse = geminiContent.text;
//                     // Attempt to extract from raw text if JSON parsing fails, as a fallback
//                     const urlMatch = geminiRawTextResponse.match(/(https?:\/\/(?:www\.)?(?:facebook|instagram|twitter|linkedin)\.com\/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*)/i);
//                     if (urlMatch) profileUrl = urlMatch[0];
//                     const codeMatch = geminiRawTextResponse.match(/\b(\d{3,4})\b/); // Simple 3-4 digit match
//                     if (codeMatch) extractedCode = codeMatch[1];
//                 }
//             } else {
//                 console.warn('Gemini API response did not contain expected content structure (missing text part).');
//             }

//             console.log('Gemini Extracted Profile URL:', profileUrl);
//             console.log('Gemini Extracted Code:', extractedCode);

//         } else {
//             console.warn('Gemini API response did not contain any candidates or content parts.');
//             return res.status(500).json({ message: 'Gemini API did not provide a valid response for information extraction. Please ensure the OTP and URL are clearly visible in the screenshot.', ocrText: "N/A - Gemini failed to provide text content" });
//         }

//     } catch (geminiError) {
//         console.error('Error calling Gemini API or parsing its response:', geminiError);
//         return res.status(500).json({ message: `Error with Gemini API: ${geminiError.message}`, ocrText: "N/A - Gemini API error" });
//     }

//     // --- Step 3: Compare Codes and OTP ---
//     // The comparison now uses the code extracted by Gemini
//     if (extractedCode === expectedCode) {
       
//         res.json({
//             success: true,
//             message: 'Verification successful! Profile URL and code matched with OTP.',
//             profileUrl,
//             extractedCode,
//             geminiRawTextResponse // Include full Gemini response text for debugging/inspection
//         });
//     } else {
//         res.status(400).json({
//             success: false,
//             message: `Verification failed. Extracted Code (by Gemini): "${extractedCode}", Expected Code (User Input): "${expectedCode}"`,
//             profileUrl,
//             extractedCode,
//             geminiRawTextResponse
//         });
//     }
// }



// const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
// const verifyImage = async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ message: 'No screenshot file uploaded.' });
//     }

//     // Now expecting platformName in the request body as well
//     const { expectedCode, platformName: userProvidedPlatform } = req.body; 
    
//     if (!expectedCode) {
//         return res.status(400).json({ message: 'Verification code is required.' });
//     }
//     if (!userProvidedPlatform) {
//         return res.status(400).json({ message: 'Platform name is required in the payload.' });
//     }
    
//     let profileUrl = null;
//     let extractedCode = null;
//     let geminiRawTextResponse = '';
//     let detectedPlatform = null;

//     try {
//         console.log('Converting image to Base64 and sending to Gemini API for analysis...');
//         const base64ImageData = req.file.buffer.toString('base64');
//         const mimeType = req.file.mimetype; 

//         const prompt = `From this social media screenshot, identify the user's profile URL (e.g., facebook.com/username, twitter.com/username) and any 3 or 4 digit numerical code that might be displayed for verification purposes. Provide the output in JSON format.`;

//         const payload = {
//             contents: [
//                 {
//                     role: "user",
//                     parts: [
//                         { text: prompt },
//                         {
//                             inlineData: {
//                                 mimeType: mimeType,
//                                 data: base64ImageData
//                             }
//                         }
//                     ]
//                 }
//             ],
//             generationConfig: {
//                 responseMimeType: "application/json",
//                 responseSchema: {
//                     type: "OBJECT",
//                     properties: {
//                         "profileUrl": { "type": "STRING", "description": "The social media profile URL found, or null if none." },
//                         "verificationCode": { "type": "STRING", "description": "A 3 or 4 digit numerical code found, or null if none." }
//                     },
//                     "required": ["profileUrl", "verificationCode"]
//                 }
//             }
//         };

//         const response = await fetch(GEMINI_API_URL, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });

//         if (!response.ok) {
//             const errorText = await response.text();
//             console.error('Gemini API response not OK:', response.status, errorText);
//             throw new Error(`Gemini API request failed: ${response.statusText} - ${errorText}`);
//         }

//         const result = await response.json();
//         console.log('Gemini API raw response:', JSON.stringify(result, null, 2));

//         if (result.candidates && result.candidates.length > 0 &&
//             result.candidates[0].content && result.candidates[0].content.parts &&
//             result.candidates[0].content.parts.length > 0) {
//             const geminiContent = result.candidates[0].content.parts[0];
            
//             if (geminiContent.text) {
//                 try {
//                     const parsedGeminiData = JSON.parse(geminiContent.text);
//                     profileUrl = parsedGeminiData.profileUrl || null;
//                     extractedCode = parsedGeminiData.verificationCode || null;
//                     geminiRawTextResponse = geminiContent.text; 
//                 } catch (jsonParseError) {
//                     console.warn('Gemini response was not a valid JSON string. Attempting to extract from plain text.');
//                     geminiRawTextResponse = geminiContent.text;
//                     const urlMatch = geminiRawTextResponse.match(/(https?:\/\/(?:www\.)?(?:facebook|instagram|twitter|linkedin)\.com\/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*)/i);
//                     if (urlMatch) profileUrl = urlMatch[0];
//                     const codeMatch = geminiRawTextResponse.match(/\b(\d{3,4})\b/); 
//                     if (codeMatch) extractedCode = codeMatch[1];
//                 }
//             } else {
//                 console.warn('Gemini API response did not contain expected content structure (missing text part).');
//                 return res.status(500).json({ message: 'Gemini API did not provide a valid response for information extraction. Please ensure the OTP and URL are clearly visible in the screenshot.', ocrText: "N/A - Gemini failed to provide text content" });
//             }

//             console.log('Gemini Extracted Profile URL:', profileUrl);
//             console.log('Gemini Extracted Code:', extractedCode);

//             // --- Extract Platform Name from profileUrl for internal comparison ---
//             if (profileUrl) {
//                 if (profileUrl.includes('facebook.com')) {
//                     detectedPlatform = 'Facebook';
//                 } else if (profileUrl.includes('twitter.com')) {
//                     detectedPlatform = 'Twitter';
//                 } else if (profileUrl.includes('instagram.com')) {
//                     detectedPlatform = 'Instagram';
//                 } else if (profileUrl.includes('linkedin.com')) {
//                     detectedPlatform = 'LinkedIn';
//                 }
//                  else if (profileUrl.includes('tiktok.com')) {
//                     detectedPlatform = 'TikTok';
//                 }
//                          else if (profileUrl.includes('youtube.com')) {
//                     detectedPlatform = 'YouTube';
//                 }
//                 else if (profileUrl.includes('x.com')) {
//                     detectedPlatform = 'X';
//                 }
//                 else {
//                     detectedPlatform = 'Other/Unknown';
//                 }
//                 console.log('Detected Platform from URL:', detectedPlatform);
//             }

//         } else {
//             console.warn('Gemini API response did not contain any candidates or content parts.');
//             return res.status(500).json({ message: 'Gemini API did not provide a valid response for information extraction. Please ensure the OTP and URL are clearly visible in the screenshot.', ocrText: "N/A - Gemini failed to provide text content" });
//         }

//     } catch (geminiError) {
//         console.error('Error calling Gemini API or parsing its response:', geminiError);
//         return res.status(500).json({ message: `Error with Gemini API: ${geminiError.message}`, ocrText: "N/A - Gemini API error" });
//     }

//     // --- Step 3: Compare Codes and Platform Names ---
//     const isCodeMatch = (extractedCode === expectedCode);
//     // Convert both to lowercase for case-insensitive comparison
//     const isPlatformMatch = (detectedPlatform && userProvidedPlatform && 
//                              detectedPlatform.toLowerCase() === userProvidedPlatform.toLowerCase());

//     if (isCodeMatch && isPlatformMatch) {

//             let updateFields = {}; // Object to hold the fields to update

//         // Determine which verification field to set based on the detected platform
//         switch (detectedPlatform.toLowerCase()) {
//             case 'facebook':
//                 updateFields.isFacebookVerified = normalizeProfileUrl(profileUrl);
//                 break;
//             case 'x': // For X (formerly Twitter)
//                 updateFields.isXVerified = normalizeProfileUrl(profileUrl);
//                 break;
//             case 'instagram':
//                 updateFields.isInstagramVerified = normalizeProfileUrl(profileUrl);
//                 break;
//             case 'youtube':
//                 updateFields.isYoutubeVerified = normalizeProfileUrl(profileUrl);

//             case 'linkedin':
//                 updateFields.isLinkedinVerified = normalizeProfileUrl(profileUrl);
//                 break;
//             case 'tiktok':
//                 updateFields.isTiktokVerified = normalizeProfileUrl(profileUrl);
//                 break;
//             default:
//                 console.warn(`No specific verification field for detected platform: ${detectedPlatform}`);
//                 // You might choose to handle "Other/Unknown" platforms differently,
//                 // e.g., set a generic 'isSocialMediaVerified' flag, or do nothing.
//                 break;
//         }


//            // Only attempt to update if there are fields to set
//         if (Object.keys(updateFields).length > 0) {
//             try {
//                 await User.findByIdAndUpdate(req["rootId"], {
//                     $set: updateFields // Use the dynamically determined updateFields
//                 });
//                 console.log(`User ${req["rootId"]} updated with ${JSON.stringify(updateFields)}`);
//             } catch (dbError) {
//                 console.error('Error updating user verification status:', dbError);
//                 return res.status(500).json({ message: 'Failed to update user verification status.', error: dbError.message });
//             }
//         } else {
//             console.log('No specific verification field to update for this platform.');
//         };

//         res.json({
//             success: true,
//             message: 'Verification successful! Profile URL, code, and platform matched.',
//             profileUrl,
//             detectedPlatform, // The platform detected by the backend
//             userProvidedPlatform, // The platform provided by the user
//             extractedCode,
//             geminiRawTextResponse 
//         });
//     } else {
//         let message = 'Verification failed.';
//         if (!isCodeMatch) {
//             message += ` Extracted Code (by Gemini): "${extractedCode}", Expected Code (User Input): "${expectedCode}".`;
//         }
//         if (!isPlatformMatch) {
//             message += ` Platform mismatch: Detected ("${detectedPlatform}") vs. User Provided ("${userProvidedPlatform}").`;
//         }

//         res.status(400).json({
//             success: false,
//             message: message.trim(),
//             profileUrl,
//             detectedPlatform,
//             userProvidedPlatform,
//             extractedCode,
//             geminiRawTextResponse
//         });
//     }
// }


const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

// Dummy User model and normalizeProfileUrl for demonstration.
// You should replace these with your actual Mongoose User model and utility function.

const verifyImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No screenshot file uploaded.' });
    }

    const { expectedCode, platformName: userProvidedPlatform } = req.body; 
    
    if (!expectedCode) {
        return res.status(400).json({ message: 'Verification code is required.' });
    }
    if (!userProvidedPlatform) {
        return res.status(400).json({ message: 'Platform name is required in the payload.' });
    }
    
    let profileUrl = null;
    let extractedCode = null;
    let geminiRawTextResponse = '';
    let detectedPlatform = null;
    let isOwnerSpecificElementPresent = false;
    let isProhibitedMessageButtonPresent = false;
    let isSubscribeButtonPresent = null; // **FIX: Initialized here**

    try {
        console.log('Converting image to Base64 and sending to Gemini API for analysis...');
        const base64ImageData = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype; 

        // --- Dynamic Prompt Construction ---
        let specificPromptInstructions = "";
        let specificMessageButtonInstruction = "";
        let specificNonOwnerIndicatorInstruction = ""; // Instruction for elements indicating non-owner view

        // Common instruction for the message button (default)
        specificMessageButtonInstruction = "Specifically, determine if there is a 'Message' button intended for sending a new message to the profile owner (which typically appears when viewing someone else's profile, not your own). Do NOT confuse this with a 'Messages' tab, 'Chats' section, or message history for the profile owner's own messages.";


        switch (userProvidedPlatform.toLowerCase()) {
            case 'facebook':
                specificPromptInstructions = "For Facebook, 'isOwnerSpecificElementPresent' should be true if 'Professional dashboard', 'Edit Profile', or 'Add to Story' are clearly visible on the profile. Otherwise, it should be false.";
                break;
            case 'x':
                specificPromptInstructions = "For X (formerly Twitter), 'isOwnerSpecificElementPresent' should be true *only if* the prominent 'Edit Profile' button (usually next to the profile name/handle, indicating ownership) is clearly visible. It *must* be false if 'Edit Profile' is absent, or if buttons like 'Follow', 'Message' (for sending a new message to this profile), or other non-ownership indicators are visible instead.";
                specificMessageButtonInstruction = "For X, 'isProhibitedMessageButtonPresent' should be true if a 'Message' button for sending a direct message to *this specific profile* is visible. It should be false if only a 'Messages' link in the sidebar (for viewing one's own message history) is present, as that does not indicate viewing another's profile.";
                break;
            case 'youtube':
                specificPromptInstructions = "For YouTube, 'isOwnerSpecificElementPresent' should be true *only if* both 'Customize channel' and 'Manage videos' buttons are clearly visible on the main channel page, as these are exclusive to the channel owner's view. It *must* be false if one or both of these specific owner-management buttons are not present.";
                specificNonOwnerIndicatorInstruction = "Also, identify if a 'Subscribe' button is present on the channel page. This button typically appears on *other people's* channels, not your own.";
                break;
            case 'tiktok':
                specificPromptInstructions = "For TikTok, 'isOwnerSpecificElementPresent' should be true if 'Edit profile' or 'Promote Post' are clearly visible on the profile. Otherwise, it should be false.";
                specificMessageButtonInstruction = "For TikTok, 'isProhibitedMessageButtonPresent' should be true if a 'Message' button (for sending a new message to this profile) is visible. It should be false if no such button is present or if it's a message history link.";
                break;
            case 'instagram':
                specificPromptInstructions = "For Instagram, 'isOwnerSpecificElementPresent' should be true if 'Edit profile' or 'View archive' are clearly visible on the profile. Otherwise, it should be false.";
                specificMessageButtonInstruction = "For Instagram, 'isProhibitedMessageButtonPresent' should be true if a 'Message' button (for sending a new message to this profile) is visible. It should be false if no such button is present or if it's a message history link.";
                break;
            case 'linkedin':
                specificPromptInstructions = "For LinkedIn, 'isOwnerSpecificElementPresent' should be true if a 'Pen icon' for editing, 'Add profile section' text, or 'Add custom button' is clearly visible on the profile. Otherwise, it should be false.";
                break;
            default:
                specificPromptInstructions = "Look for general administrative or editing options (e.g., 'Edit Profile', 'Manage', 'Settings') to determine if this is the profile owner's view. 'isOwnerSpecificElementPresent' should be true if such elements are visible, false otherwise.";
                break;
        }

        const prompt = `From this social media screenshot of a user's profile, identify the user's profile URL. 
        Also, find any 3 or 4 digit numerical code that might be displayed for verification purposes.
        ${specificPromptInstructions}
        ${specificMessageButtonInstruction}
        ${specificNonOwnerIndicatorInstruction}
        Provide the output in JSON format with fields: "profileUrl", "verificationCode", "isOwnerSpecificElementPresent" (boolean), "isProhibitedMessageButtonPresent" (boolean), and for YouTube only: "isSubscribeButtonPresent" (boolean). If a field is not applicable or found, use null or false accordingly.`;

        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64ImageData
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "profileUrl": { "type": "STRING", "description": "The social media profile URL found, or null if none." },
                        "verificationCode": { "type": "STRING", "description": "A 3 or 4 digit numerical code found, or null if none." },
                        "isOwnerSpecificElementPresent": { "type": "BOOLEAN", "description": "True if elements indicating the profile owner's view are visible (based on platform-specific criteria), false otherwise." },
                        "isProhibitedMessageButtonPresent": { "type": "BOOLEAN", "description": "True if a 'Message' button (for sending a new message to this profile, indicating not owner's view) is visible, false otherwise." },
                        "isSubscribeButtonPresent": { "type": "BOOLEAN", "description": "For YouTube, true if a 'Subscribe' button is present, false otherwise. Null for other platforms." }
                    },
                    "required": ["profileUrl", "verificationCode", "isOwnerSpecificElementPresent", "isProhibitedMessageButtonPresent"] // isSubscribeButtonPresent is optional
                }
            }
        };

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API response not OK:', response.status, errorText);
            throw new Error(`Gemini API request failed: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Gemini API raw response:', JSON.stringify(result, null, 2)); 

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const geminiContent = result.candidates[0].content.parts[0];
            
            // --- CRITICAL LOGGING FOR DIAGNOSIS ---
            console.log('Gemini raw text content part (for debugging):', geminiContent.text);

            if (geminiContent.text) {
                try {
                    const parsedGeminiData = JSON.parse(geminiContent.text); // parsedGeminiData defined here
                    profileUrl = parsedGeminiData.profileUrl || null;
                    extractedCode = parsedGeminiData.verificationCode || null;
                    isOwnerSpecificElementPresent = parsedGeminiData.isOwnerSpecificElementPresent || false;
                    isProhibitedMessageButtonPresent = parsedGeminiData.isProhibitedMessageButtonPresent || false;
                    isSubscribeButtonPresent = parsedGeminiData.isSubscribeButtonPresent !== undefined ? parsedGeminiData.isSubscribeButtonPresent : null; // **FIX: Assign here**
                    geminiRawTextResponse = geminiContent.text; 

                    // --- POST-PROCESSING OVERRIDE FOR YOUTUBE AND X ---
                    // This is a safety net to strictly enforce specific text presence if Gemini's boolean is off.
                    const lowerCaseGeminiText = geminiRawTextResponse.toLowerCase();
                    console.log('Lowercase Gemini Text for Post-Processing:', lowerCaseGeminiText);

                    if (detectedPlatform && detectedPlatform.toLowerCase() === 'youtube') {
                        const hasCustomizeChannel = lowerCaseGeminiText.includes('customize channel');
                        const hasManageVideos = lowerCaseGeminiText.includes('manage videos');
                        
                        // Override Gemini's boolean: isOwnerSpecificElementPresent for YouTube REQUIRES both texts
                        if (isOwnerSpecificElementPresent && (!hasCustomizeChannel || !hasManageVideos)) {
                            console.warn("YouTube owner-specific elements (Customize channel, Manage videos) NOT BOTH found in raw text despite Gemini's boolean. Overriding to false.");
                            isOwnerSpecificElementPresent = false;
                        } else if (!isOwnerSpecificElementPresent && (hasCustomizeChannel && hasManageVideos)) {
                             console.warn("YouTube owner-specific elements (Customize channel, Manage videos) BOTH found in raw text despite Gemini's boolean being false. Overriding to true.");
                             isOwnerSpecificElementPresent = true;
                        }
                        // If 'Subscribe' button is present, it's NOT the owner's view
                        if (isSubscribeButtonPresent === true) { 
                            console.warn("YouTube 'Subscribe' button detected. Overriding isOwnerSpecificElementPresent to false.");
                            isOwnerSpecificElementPresent = false; // Force fail if subscribe button is there
                        }

                    }
                    
                    if (detectedPlatform && detectedPlatform.toLowerCase() === 'x') {
                        const hasEditProfileButton = lowerCaseGeminiText.includes('edit profile'); 
                        
                        // If Gemini said true, but we don't find "Edit Profile", override to false.
                        if (isOwnerSpecificElementPresent && !hasEditProfileButton) {
                            console.warn("X owner-specific element (Edit Profile) not found in raw text despite Gemini's boolean. Overriding to false.");
                            isOwnerSpecificElementPresent = false;
                        } else if (!isOwnerSpecificElementPresent && hasEditProfileButton) {
                            console.warn("X owner-specific element (Edit Profile) found in raw text despite Gemini's boolean being false. Overriding to true.");
                            isOwnerSpecificElementPresent = true;
                        }
                    }

                } catch (jsonParseError) {
                    console.warn('Gemini response was not a valid JSON string. Attempting to extract from plain text. This is less reliable.');
                    geminiRawTextResponse = geminiContent.text;
                    const urlMatch = geminiRawTextResponse.match(/(https?:\/\/(?:www\.)?(?:facebook|instagram|twitter|linkedin|tiktok|x|youtube)\.com\/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*)/i);
                    if (urlMatch) profileUrl = urlMatch[0];
                    const codeMatch = geminiRawTextResponse.match(/\b(\d{3,4})\b/); 
                    if (codeMatch) extractedCode = codeMatch[1];
                    
                    // Fallback inference for booleans (less reliable without structured JSON)
                    // Then apply explicit text check overrides
                    const lowerText = geminiRawTextResponse.toLowerCase();
                    
                    if (detectedPlatform && detectedPlatform.toLowerCase() === 'youtube') {
                        isOwnerSpecificElementPresent = lowerText.includes('customize channel') && lowerText.includes('manage videos');
                        isSubscribeButtonPresent = lowerText.includes('subscribe'); // **FIX: Assign here in fallback**
                        if (isSubscribeButtonPresent) { 
                            isOwnerSpecificElementPresent = false; // Force fail if subscribe button is there in fallback
                        }
                    } else if (detectedPlatform && detectedPlatform.toLowerCase() === 'x') {
                        isOwnerSpecificElementPresent = lowerText.includes('edit profile');
                    } else {
                        isOwnerSpecificElementPresent = /edit profile|manage profile|professional dashboard|customize channel|manage videos|promote post|pen icon|add profile section|add custom button|view archive/i.test(lowerText);
                    }
                    isProhibitedMessageButtonPresent = /\bmessage\b(?!.*(history|inbox|chats|notifications))/i.test(lowerText); 
                }
            } else {
                console.warn('Gemini API response did not contain expected content structure (missing text part).');
                return res.status(500).json({ message: 'Gemini API did not provide a valid response for information extraction. Please ensure the OTP and URL are clearly visible in the screenshot.', ocrText: "N/A - Gemini failed to provide text content" });
            }

            console.log('Gemini Extracted Profile URL:', profileUrl);
            console.log('Gemini Extracted Code:', extractedCode);
            console.log('Gemini Detected Owner-Specific Element Presence (after post-process):', isOwnerSpecificElementPresent);
            console.log('Gemini Detected Prohibited Message Button Presence:', isProhibitedMessageButtonPresent);
            console.log('Gemini Detected Subscribe Button Presence:', isSubscribeButtonPresent); // **FIX: Use variable directly**


            // --- Extract Platform Name from profileUrl for internal comparison ---
            if (profileUrl) {
                if (profileUrl.includes('facebook.com')) {
                    detectedPlatform = 'Facebook';
                } else if (profileUrl.includes('twitter.com')) {
                    detectedPlatform = 'Twitter';
                } else if (profileUrl.includes('instagram.com')) {
                    detectedPlatform = 'Instagram';
                } else if (profileUrl.includes('linkedin.com')) {
                    detectedPlatform = 'LinkedIn';
                } else if (profileUrl.includes('tiktok.com')) {
                    detectedPlatform = 'TikTok';
                } else if (profileUrl.includes('youtube.com')) { // General YouTube URL check
                    detectedPlatform = 'YouTube';
                } else if (profileUrl.includes('x.com')) {
                    detectedPlatform = 'X';
                } else {
                    detectedPlatform = 'Other/Unknown';
                }
                console.log('Detected Platform from URL:', detectedPlatform);
            }

        } else {
            console.warn('Gemini API response did not contain any candidates or content parts.');
            return res.status(500).json({ message: 'Gemini API did not provide a valid response for information extraction. Please ensure the OTP and URL are clearly visible in the screenshot.', ocrText: "N/A - Gemini API error" });
        }

    } catch (geminiError) {
        console.error('Error calling Gemini API or parsing its response:', geminiError);
        return res.status(500).json({ message: `Error with Gemini API: ${geminiError.message}`, ocrText: "N/A - Gemini API error" });
    }

    // --- Step 3: Compare Codes, Platform Names, and Platform-Specific UI Elements ---
    const isCodeMatch = (extractedCode === expectedCode);
    const isPlatformMatch = (detectedPlatform && userProvidedPlatform && 
                             detectedPlatform.toLowerCase() === userProvidedPlatform.toLowerCase());

    let isProfileOwnerView = false;
    let profileOwnershipFailureReason = '';

    // Apply platform-specific ownership rules
    switch (detectedPlatform.toLowerCase()) {
        case 'facebook':
            isProfileOwnerView = isOwnerSpecificElementPresent && !isProhibitedMessageButtonPresent;
            if (!isOwnerSpecificElementPresent) profileOwnershipFailureReason += 'Facebook owner-specific element (Professional dashboard, Edit, Add to Story) not found. ';
            if (isProhibitedMessageButtonPresent) profileOwnershipFailureReason += 'Prohibited Message button found on Facebook profile. ';
            break;
        case 'x':
            // X requires 'Edit Profile' AND no 'Message' button (for sending to others)
            isProfileOwnerView = isOwnerSpecificElementPresent && !isProhibitedMessageButtonPresent;
            if (!isOwnerSpecificElementPresent) profileOwnershipFailureReason += 'X owner-specific element (Edit Profile) NOT found. ';
            if (isProhibitedMessageButtonPresent) profileOwnershipFailureReason += 'Prohibited Message button (for sending to another profile) FOUND on X profile. ';
            break;
        case 'youtube':
            // YouTube requires 'Customize channel' AND 'Manage videos' AND no 'Message' button (for sending to others)
            // And now also, ABSENCE of 'Subscribe' button is a strong indicator
            isProfileOwnerView = isOwnerSpecificElementPresent && !isProhibitedMessageButtonPresent;
            if (!isOwnerSpecificElementPresent) profileOwnershipFailureReason += 'YouTube owner-specific elements (Customize channel, Manage videos) NOT found. ';
            if (isProhibitedMessageButtonPresent) profileOwnershipFailureReason += 'Prohibited Message button found on YouTube profile. ';
            // **FIX: Use the consistently defined isSubscribeButtonPresent variable directly**
            if (isSubscribeButtonPresent === true) { 
                profileOwnershipFailureReason += " 'Subscribe' button found, indicating it's not the owner's profile. ";
                isProfileOwnerView = false; // Force fail if subscribe button is there
            }
            break;
        case 'tiktok':
            isProfileOwnerView = isOwnerSpecificElementPresent && !isProhibitedMessageButtonPresent;
            if (!isOwnerSpecificElementPresent) profileOwnershipFailureReason += 'TikTok owner-specific element (Edit profile, Promote Post) NOT found. ';
            if (isProhibitedMessageButtonPresent) profileOwnershipFailureReason += 'Prohibited Message button found on TikTok profile. ';
            break;
        case 'instagram':
            isProfileOwnerView = isOwnerSpecificElementPresent && !isProhibitedMessageButtonPresent;
            if (!isOwnerSpecificElementPresent) profileOwnershipFailureReason += 'Instagram owner-specific element (Edit profile, View archive) NOT found. ';
            if (isProhibitedMessageButtonPresent) profileOwnershipFailureReason += 'Prohibited Message button found on Instagram profile. ';
            break;
        case 'linkedin':
            isProfileOwnerView = isOwnerSpecificElementPresent && !isProhibitedMessageButtonPresent;
            if (!isOwnerSpecificElementPresent) profileOwnershipFailureReason += 'LinkedIn owner-specific element (Pen icon, Add profile section, Add custom button) NOT found. ';
            if (isProhibitedMessageButtonPresent) profileOwnershipFailureReason += 'Prohibited Message button found on LinkedIn profile. ';
            break;
        default:
            // For unhandled platforms, use the general check
            isProfileOwnerView = isOwnerSpecificElementPresent && !isProhibitedMessageButtonPresent;
            if (!isOwnerSpecificElementPresent) profileOwnershipFailureReason += 'General owner-specific element NOT found for this platform. ';
            if (isProhibitedMessageButtonPresent) profileOwnershipFailureReason += 'Prohibited Message button found on profile. ';
            console.warn(`No specific verification rules for detected platform: ${detectedPlatform}. Using general checks.`);
            break;
    }

    if (isCodeMatch && isPlatformMatch && isProfileOwnerView) {
        let updateFields = {};

        switch (detectedPlatform.toLowerCase()) {
            case 'facebook':
                updateFields.isFacebookVerified = normalizeProfileUrl(profileUrl);
                break;
            case 'x':
                updateFields.isXVerified = normalizeProfileUrl(profileUrl);
                break;
            case 'instagram':
                updateFields.isInstagramVerified = normalizeProfileUrl(profileUrl);
                break;
            case 'youtube':
                updateFields.isYoutubeVerified = normalizeProfileUrl(profileUrl);
                break;
            case 'linkedin':
                updateFields.isLinkedinVerified = normalizeProfileUrl(profileUrl);
                break;
            case 'tiktok':
                updateFields.isTiktokVerified = normalizeProfileUrl(profileUrl);
                break;
            default:
                console.warn(`No specific verification field for detected platform: ${detectedPlatform}`);
                break;
        }

        if (Object.keys(updateFields).length > 0) {
            try {
                await User.findByIdAndUpdate(req["rootId"], {
                    $set: updateFields
                });
                console.log(`User ${req["rootId"]} updated with ${JSON.stringify(updateFields)}`);
            } catch (dbError) {
                console.error('Error updating user verification status:', dbError);
                return res.status(500).json({ message: 'Failed to update user verification status.', error: dbError.message });
            }
        } else {
            console.log('No specific verification field to update for this platform.');
        };

        res.json({
            success: true,
            message: 'Verification successful! Profile URL, code, platform matched, and user appears to be the owner.',
            profileUrl,
            detectedPlatform,
            userProvidedPlatform,
            extractedCode,
            isOwnerSpecificElementPresent,
            isProhibitedMessageButtonPresent,
            isSubscribeButtonPresent: isSubscribeButtonPresent, // **FIX: Use variable directly**
            geminiRawTextResponse 
        });
    } else {
        let message = 'Verification failed.';
        if (!isCodeMatch) {
            message += ` Extracted Code (by Gemini): "${extractedCode}", Expected Code (User Input): "${expectedCode}".`;
        }
        if (!isPlatformMatch) {
            message += ` Platform mismatch: Detected ("${detectedPlatform}") vs. User Provided ("${userProvidedPlatform}").`;
        }
        if (!isProfileOwnerView) {
            message += ` Profile ownership not confirmed based on screenshot analysis: ${profileOwnershipFailureReason.trim()}.`;
        }

        res.status(400).json({
            success: false,
            message: message.trim(),
            profileUrl,
            detectedPlatform,
            userProvidedPlatform,
            extractedCode,
            isOwnerSpecificElementPresent,
            isProhibitedMessageButtonPresent,
            isSubscribeButtonPresent: isSubscribeButtonPresent, // **FIX: Use variable directly**
            geminiRawTextResponse
        });
    }
}

module.exports ={
    verifyImage
}