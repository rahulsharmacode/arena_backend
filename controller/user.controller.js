const { sendTemplateEmail } = require("../helper/mail.function");
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

    try {
        let findQuery = query;
        if (req["rootId"] && req["rootUser"]?.role === "user") {
            findQuery = { ...findQuery, _id: req["rootId"] }
        }
        const [findData, countData] = await Promise.all([
            User.find(findQuery).select("-password -__v").skip(skip).limit(limit).sort({ createdAt: -1 }),
            User.countDocuments()
        ]);

        return res.status(200).json({
            status: true, message: "success", total: countData,
            totalPages: Math.ceil(countData / limit),
            data: findData
        });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};
const getByIdUserController = async (req, res) => {
    try {
        const { id } = req.params;
        if(req["rootId"]&& req["rootUser"]?.role==="user"&& id!== req["rootId"] ) return res.status(401).json({ status: false, message: `failed, unauthorized` });
        const findData = await User.findById(id).select("-password -__v");
        if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
        return res.status(200).json({ status: true, message: "success", data: findData });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};

const postUserController = async (req, res) => {
    let { username, password, fullName, email } = req.body || {};
    if (!username || !password || !fullName || !email) return res.status(406).json({ status: false, message: `failed, username, fullName, email and password is required` });
    try {
        const findData = await User.findOne({ username });
        if (findData) return res.status(406).json({ status: false, message: `failed, username is already registred` });
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
        if(req["rootId"]&& req["rootUser"]?.role==="user"&& id!== req["rootId"] ) return res.status(401).json({ status: false, message: `failed, unauthorized` });
        const findData = await User.findById(id);
        if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
        if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);
        Object.assign(findData, req.body);
        await findData.save();
        return res.status(200).json({ status: true, message: "success", data: findData });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};
const patchUserController = async (req, res) => {
    try {
        
        const { id } = req.params;
        if(req["rootId"]&& req["rootUser"]?.role==="user"&& id!== req["rootId"] ) return res.status(401).json({ status: false, message: `failed, unauthorized` });
        const findData = await User.findById(id);
        if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
        if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);
        Object.assign(findData, req.body);
        await findData.save();
        return res.status(200).json({ status: true, message: "success", data: findData });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};
const deleteUserController = async (req, res) => {
    try {
        const { id } = req.params;
        if(req["rootId"]&& req["rootUser"]?.role==="user"&& id!== req["rootId"] ) return res.status(401).json({ status: false, message: `failed, unauthorized` });
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
    getByIdUserController,
    postUserController,
    putUserController,
    patchUserController,
    deleteUserController
};