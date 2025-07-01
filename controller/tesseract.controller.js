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



const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
const verifyImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No screenshot file uploaded.' });
    }

    // Now expecting platformName in the request body as well
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

    try {
        console.log('Converting image to Base64 and sending to Gemini API for analysis...');
        const base64ImageData = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype; 

        const prompt = `From this social media screenshot, identify the user's profile URL (e.g., facebook.com/username, twitter.com/username) and any 3 or 4 digit numerical code that might be displayed for verification purposes. Provide the output in JSON format.`;

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
                        "verificationCode": { "type": "STRING", "description": "A 3 or 4 digit numerical code found, or null if none." }
                    },
                    "required": ["profileUrl", "verificationCode"]
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
            
            if (geminiContent.text) {
                try {
                    const parsedGeminiData = JSON.parse(geminiContent.text);
                    profileUrl = parsedGeminiData.profileUrl || null;
                    extractedCode = parsedGeminiData.verificationCode || null;
                    geminiRawTextResponse = geminiContent.text; 
                } catch (jsonParseError) {
                    console.warn('Gemini response was not a valid JSON string. Attempting to extract from plain text.');
                    geminiRawTextResponse = geminiContent.text;
                    const urlMatch = geminiRawTextResponse.match(/(https?:\/\/(?:www\.)?(?:facebook|instagram|twitter|linkedin)\.com\/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*)/i);
                    if (urlMatch) profileUrl = urlMatch[0];
                    const codeMatch = geminiRawTextResponse.match(/\b(\d{3,4})\b/); 
                    if (codeMatch) extractedCode = codeMatch[1];
                }
            } else {
                console.warn('Gemini API response did not contain expected content structure (missing text part).');
                return res.status(500).json({ message: 'Gemini API did not provide a valid response for information extraction. Please ensure the OTP and URL are clearly visible in the screenshot.', ocrText: "N/A - Gemini failed to provide text content" });
            }

            console.log('Gemini Extracted Profile URL:', profileUrl);
            console.log('Gemini Extracted Code:', extractedCode);

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
                }
                 else if (profileUrl.includes('tiktok.com')) {
                    detectedPlatform = 'TikTok';
                }
                         else if (profileUrl.includes('youtube.com')) {
                    detectedPlatform = 'YouTube';
                }
                else if (profileUrl.includes('x.com')) {
                    detectedPlatform = 'X';
                }
                else {
                    detectedPlatform = 'Other/Unknown';
                }
                console.log('Detected Platform from URL:', detectedPlatform);
            }

        } else {
            console.warn('Gemini API response did not contain any candidates or content parts.');
            return res.status(500).json({ message: 'Gemini API did not provide a valid response for information extraction. Please ensure the OTP and URL are clearly visible in the screenshot.', ocrText: "N/A - Gemini failed to provide text content" });
        }

    } catch (geminiError) {
        console.error('Error calling Gemini API or parsing its response:', geminiError);
        return res.status(500).json({ message: `Error with Gemini API: ${geminiError.message}`, ocrText: "N/A - Gemini API error" });
    }

    // --- Step 3: Compare Codes and Platform Names ---
    const isCodeMatch = (extractedCode === expectedCode);
    // Convert both to lowercase for case-insensitive comparison
    const isPlatformMatch = (detectedPlatform && userProvidedPlatform && 
                             detectedPlatform.toLowerCase() === userProvidedPlatform.toLowerCase());

    if (isCodeMatch && isPlatformMatch) {

            let updateFields = {}; // Object to hold the fields to update

        // Determine which verification field to set based on the detected platform
        switch (detectedPlatform.toLowerCase()) {
            case 'facebook':
                updateFields.isFacebookVerified = normalizeProfileUrl(profileUrl);
                break;
            case 'x': // For X (formerly Twitter)
                updateFields.isXVerified = normalizeProfileUrl(profileUrl);
                break;
            case 'instagram':
                updateFields.isInstagramVerified = normalizeProfileUrl(profileUrl);
                break;
            case 'youtube':
                updateFields.isYoutubeVerified = normalizeProfileUrl(profileUrl);

            case 'linkedin':
                updateFields.isLinkedinVerified = normalizeProfileUrl(profileUrl);
                break;
            case 'tiktok':
                updateFields.isTiktokVerified = normalizeProfileUrl(profileUrl);
                break;
            default:
                console.warn(`No specific verification field for detected platform: ${detectedPlatform}`);
                // You might choose to handle "Other/Unknown" platforms differently,
                // e.g., set a generic 'isSocialMediaVerified' flag, or do nothing.
                break;
        }


           // Only attempt to update if there are fields to set
        if (Object.keys(updateFields).length > 0) {
            try {
                await User.findByIdAndUpdate(req["rootId"], {
                    $set: updateFields // Use the dynamically determined updateFields
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
            message: 'Verification successful! Profile URL, code, and platform matched.',
            profileUrl,
            detectedPlatform, // The platform detected by the backend
            userProvidedPlatform, // The platform provided by the user
            extractedCode,
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

        res.status(400).json({
            success: false,
            message: message.trim(),
            profileUrl,
            detectedPlatform,
            userProvidedPlatform,
            extractedCode,
            geminiRawTextResponse
        });
    }
}

module.exports ={
    verifyImage
}