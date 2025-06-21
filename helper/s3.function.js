const multer = require("multer");
const multerS3 = require("multer-s3");
const {S3Client,GetObjectCommand} = require("@aws-sdk/client-s3");
const {getSignedUrl} = require("@aws-sdk/s3-request-presigner");


const s3Client = new S3Client({
    region : process.env.AWS_S3_REGION,
    credentials : {
        accessKeyId : process.env.AWS_S3_IAM_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY,
    }
});


const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {

      const userId = req.params.id;
      const uniqueSuffix = Date.now();
      const originalname = file.originalname.split('.')[0];
      const extension = file.originalname.split('.').pop();
      // Changed the folder from 'user-profiles' to 'images'
      const s3Key = `images/${userId}/${originalname}-${uniqueSuffix}.${extension}`;
      cb(null, s3Key);
    },
   
  }),
   limits: {
        fileSize: 1024 * 1024 * 5, // 5 MB file size limit
    },
});


// async function generatePresignedUrl(s3Key) {

    
//     const bucketName =  process.env.AWS_S3_BUCKET;
//     const command = new GetObjectCommand({
//         Bucket: bucketName,
//         Key: s3Key,
//     });

//     try {
//         const url = await getSignedUrl(s3Client, command, {
//             expiresIn: parseInt(process.env.AWS_S3_PRESIGNED_URL_EXPIRY_SECONDS || '3600'), // Default 1 hour
//         });
//         return url;
//     } catch (error) {
//         console.error('Error generating pre-signed URL:', error);
//         throw new Error('Could not generate pre-signed URL for the image.');
//     }
// };

const presignedUrlCache = new Map();
const PRESIGNED_URL_EXPIRY_SECONDS = parseInt(process.env.AWS_S3_PRESIGNED_URL_EXPIRY_SECONDS || '3600');
async function generatePresignedUrl(s3Key) {
    const cachedEntry = presignedUrlCache.get(s3Key);
    const now = Date.now();

    // Check if the URL is in cache and has not expired
    if (cachedEntry && cachedEntry.expiry > now) {
        // console.log(`[Cache Hit] Returning cached URL for ${s3Key}`);
        return cachedEntry.url;
    }

    // console.log(`[Cache Miss/Expired] Generating new URL for ${s3Key}`);
    const bucketName = process.env.AWS_S3_BUCKET;
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
    });

    try {
        const url = await getSignedUrl(s3Client, command, {
            expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
        });

        // Calculate expiry time for cache (current time + expiry in milliseconds)
        const expiryMs = now + (PRESIGNED_URL_EXPIRY_SECONDS * 1000);
        presignedUrlCache.set(s3Key, { url, expiry: expiryMs });

        return url;
    } catch (error) {
        console.error('Error generating pre-signed URL:', error);
        throw new Error('Could not generate pre-signed URL for the image.');
    }
}


module.exports = {
    upload,
    generatePresignedUrl,
    s3Client // Export s3Client if needed elsewhere (e.g., for direct S3 operations)
};