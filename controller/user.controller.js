const { default: mongoose } = require("mongoose");
const { sendTemplateEmail } = require("../helper/mail.function");
const { generatePresignedUrl } = require("../helper/s3.function");
const { Otp } = require("../schema/otp.schema");
const { User } = require("../schema/user.schema");
const bcrypt = require("bcrypt");

const getUserController = async (req, res) => {
    let { page = 1, limit = 10, search = "" } = req.query || {};
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    const query = {};
    if (search) {
        query.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ]
    }

    const isAdmin = req["rootUser"]?.role === "admin";
    const selectFields = isAdmin
        ? "-password -__v" // Admin sees everything except password & __v
        : "-password -__v -email -phone";
    try {
        let findQuery = query;
        if (req["rootId"] && req["rootUser"]?.role === "user") {
            findQuery = { ...findQuery, _id: req["rootId"] }
        }
        const [findData, countData] = await Promise.all([
            User.find(findQuery).select(selectFields).skip(skip).limit(limit).sort({ createdAt: -1 }),
            User.countDocuments(findQuery)
        ]);

        const usersWithImages = await Promise.all(findData.map(async (user) => {
            let presignedProfileURL = null;
            // If user is a Mongoose document, use .toObject() for spreading
            const userData = user.toObject();

            if (userData.image && userData.image.s3Key) {
                try {
                    presignedProfileURL = await generatePresignedUrl(userData.image.s3Key);
                } catch (error) {
                    console.error('Error fetching presigned URL for user:', userData._id, error);
                    presignedProfileURL = 'Error generating image URL.';
                }
            }
            return { ...userData, image: presignedProfileURL };
        }));


        return res.status(200).json(req["rootUser"]?.role === "user" ?

            {
                status: true, message: "success",
                data: usersWithImages[0]
            } :
            {
                status: true, message: "success", total: countData,
                totalPages: Math.ceil(countData / limit),
                data: usersWithImages
            }
        );
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};
const getUsersController = async (req, res) => {
    let { page = 1, limit = 10, search = "" } = req.query || {};
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    const query = {};
    if (search) {
        query.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ]
    }

    const isAdmin = req["rootUser"]?.role === "admin";
    const selectFields = isAdmin
        ? "-password -__v" // Admin sees everything except password & __v
        : "-password -__v";
    try {
        let findQuery = query;
        if (req["rootId"] && req["rootUser"]?.role === "user") {
            findQuery = { ...findQuery }
        }

        const [findData, countData] = await Promise.all([
            User.find(findQuery).select(selectFields).skip(skip).limit(limit).sort({ createdAt: -1 }),
            User.countDocuments(findQuery)
        ]);

        const usersWithImages = await Promise.all(findData.map(async (user) => {
            let presignedProfileURL = null;
            // If user is a Mongoose document, use .toObject() for spreading
            const userData = user.toObject();

            if (userData.image && userData.image.s3Key) {
                try {
                    presignedProfileURL = await generatePresignedUrl(userData.image.s3Key);
                } catch (error) {
                    console.error('Error fetching presigned URL for user:', userData._id, error);
                    presignedProfileURL = 'Error generating image URL.';
                }
            }
            return { ...userData, image: presignedProfileURL };
        }));


        return res.status(200).json({
            status: true, message: "success", total: countData,
            totalPages: Math.ceil(countData / limit),
            data: usersWithImages
        }
        );
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};
const getByIdUserController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ status: false, message: "Invalid user ID format" });
        };


        // if (req["rootId"] && req["rootUser"]?.role === "user") return res.status(401).json({ status: false, message: `failed, unauthorized` });
        const findData = await User.findById(id).select("-password -__v");
        if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });

        let presignedProfileURL = null;
        if (findData.image && findData.image.s3Key) {
            try {
                presignedProfileURL = await generatePresignedUrl(findData.image.s3Key);
            } catch (error) {
                console.error('Error fetching presigned URL for user:', userId, error);
                presignedProfileURL = 'Error generating image URL.';
            }
        }
        return res.status(200).json({ status: true, message: "success", data: { ...findData.toObject(), image: presignedProfileURL } });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};
const getByUsernameUserController = async (req, res) => {
    try {
        const { username } = req.params;

        const findData = await User.findOne({ username }).select("-password -__v");
        if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });

        let presignedProfileURL = null;
        if (findData.image && findData.image.s3Key) {
            try {
                presignedProfileURL = await generatePresignedUrl(findData.image.s3Key);
            } catch (error) {
                console.error('Error fetching presigned URL for user:', userId, error);
                presignedProfileURL = 'Error generating image URL.';
            }
        }
        return res.status(200).json({ status: true, message: "success", data: { ...findData.toObject(), image: presignedProfileURL } });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};

const postUserController = async (req, res) => {
    let { username, password, fullName, email } = req.body || {};
    if (!username || !password || !fullName || !email) return res.status(406).json({ status: false, message: `failed, username, fullName, email and password is required` });
    try {
        const findUsername = await User.findOne({ username });
        if (findUsername) return res.status(403).json({ status: false, message: `failed, username is already registred` });
        const findEmail = await User.findOne({ email });
        if (findEmail) return res.status(403).json({ status: false, message: `failed, email is already registred` });

        req.body.password = await bcrypt.hash(password, 10);
        const saveData = await User.create(req.body);
        if (!saveData) return res.status(500).json({ status: false, message: `failed, someting went wrong!` });
        const otp = Math.floor(1000 + Math.random() * 9000);
        const expiresIn = Date.now() + 5 * 60 * 1000;
        await Otp.create({
            otp: otp,
            expiresIn: expiresIn,
            type: "emailverification",
            email: email,
            user: saveData._id
        });
        sendTemplateEmail({
            data: { fullName, expiryMinutes: Math.ceil((expiresIn - Date.now()) / (1000 * 60)), otp, email },
            subject: "Account Verification",
            template: "otp"
        })
        return res.status(201).json({ status: true, message: "success", data: saveData });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};
const putUserController = async (req, res) => {
    try {
        const { id } = req.params;
        if (req["rootId"] && req["rootUser"]?.role === "user" && id !== req["rootId"]) return res.status(401).json({ status: false, message: `failed, unauthorized` });
        const findData = await User.findById(id);
        if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });

        if (req.file) {
            const { key: s3Key, bucket: s3Bucket, originalname } = req.file;
            req.body.image = {
                s3Key: s3Key,
                s3Bucket: s3Bucket,
                uploadDate: new Date(),
                originalFileName: originalname
            }
        }


        if (req.body?.password) req.body.password = await bcrypt.hash(req.body.password, 10);
        Object.assign(findData, req.body);
        await findData.save();
        return res.status(200).json({ status: true, message: "success", data: findData });
    }
    catch (err) {
        // Handle duplicate key error
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(409).json({
                status: false,
                message: `already exits ${field}`,
                field,
            });
        }

        // Mongoose validation errors
        if (err.name === "ValidationError") {
            const errors = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({
                status: false,
                message: "Validation failed",
                errors,
            });
        }

        // Generic fallback
        return res.status(500).json({
            status: false,
            message: "Server error",
            error: err.message || err,
        });
    };
};
const patchUserController = async (req, res) => {
    try {

        const { id } = req.params;
        if (req["rootId"] && req["rootUser"]?.role === "user" && id !== req["rootId"]) return res.status(401).json({ status: false, message: `failed, unauthorized` });
        const findData = await User.findById(id);
        if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
        if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);
        if (req.file) {
            const { key: s3Key, bucket: s3Bucket, originalname } = req.file;
            req.body.image = {
                s3Key: s3Key,
                s3Bucket: s3Bucket,
                uploadDate: new Date(),
                originalFileName: originalname
            }
        }
        Object.assign(findData, req.body);
        await findData.save();
        return res.status(200).json({ status: true, message: "success", data: findData });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};
const deleteUserController = async (req, res) => {
    try {
        const { id } = req.params;
        if (req["rootId"] && req["rootUser"]?.role === "user" && id !== req["rootId"]) return res.status(401).json({ status: false, message: `failed, unauthorized` });
        const findData = await User.findById(id);
        if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
        let deleteResponse = await User.findByIdAndDelete(id);
        if (!deleteResponse) return res.status(404).json({ status: false, message: `failed, data not found` });
        return res.status(204).json({ status: true, message: "success" });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};

module.exports = {
    getUserController,
    getUsersController,
    getByIdUserController,
    getByUsernameUserController,
    postUserController,
    putUserController,
    patchUserController,
    deleteUserController
};