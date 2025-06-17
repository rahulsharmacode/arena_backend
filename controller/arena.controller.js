const { sendTemplateEmail } = require("../helper/mail.function");
const { Otp } = require("../schema/otp.schema");
const { Arena } = require("../schema/arena.schema");
const bcrypt = require("bcrypt");
const { User } = require("../schema/user.schema");
const { Category } = require("../schema/category.schema");

const getArenaController = async (req, res) => {
    try {
        const findData = await Arena.find();
        const countData = await Arena.countDocuments();
        return res.status(200).json({ status: true, message: "success", total: countData, data: findData });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};
const getByIdArenaController = async (req, res) => {
    try {
        const { id } = req.params;
        const findData = await Arena.findById(id);
        if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
        return res.status(200).json({ status: true, message: "success", data: findData });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};

const postArenaController = async (req, res) => {
        let {   
            title="",
            guest,
            topics=[] } = req.body || {};
        if (!title || !guest || topics.length===0) return res.status(406).json({ status: false, message: `failed, title, geust user, topic is required` });
        const docs = topics.map(topic => ({ name:topic }));
    try {
        const findData = await User.findById(guest);
        if (!findData) return res.status(406).json({ status: false, message: `failed, guest not found` });
       
        const saveData = await Arena.create({...req.body,aurthor:req["rootId"]});
         await Category.insertMany(docs, { ordered: false });
        if (!saveData) return res.status(500).json({ status: false, message: `failed, someting went wrong!` });
   
        sendTemplateEmail({
            data : {
                email:findData.email,
    talkTitle: title,
    speakerName: req["rootUser"].fullName,
    talkDate: "2025-07-15T14:00:00Z", // Example date in ISO format
    talkTime: "2:00 PM",
    timeZone: "IST",
    topics,
    talkUrl: "https://arena.com/talks/ai-software-development",
    arenaUrl: "https://arena.com/arena"
},
            subject:"Arena Invitation",
            template : "arenainvite"
        })
        return res.status(200).json({ status: true, message: "success", data: saveData });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};
const putArenaController = async (req, res) => {
    try {
        const { id } = req.params;
        const findData = await Arena.findById(id);
        if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
        Object.assign(findData, req.body);
        await findData.save();
        return res.status(200).json({ status: true, message: "success", data: findData });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};
const patchArenaController = async (req, res) => {
    try {
        const { id } = req.params;
        const findData = await Arena.findById(id);
        if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
        Object.assign(findData, req.body);
        await findData.save();
        return res.status(200).json({ status: true, message: "success", data: findData });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};
const deleteArenaController = async (req, res) => {
    try {
        const { id } = req.params;
        const findData = await Arena.findById(id);
        if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
        let deleteResponse = await Arena.findByIdAndDelete(id);
        if (!deleteResponse) return res.status(404).json({ status: false, message: `failed, data not found` });
        return res.status(204).json({ status: true, message: "success" });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};


module.exports = {
    getArenaController,
    getByIdArenaController,
    postArenaController,
    putArenaController,
    patchArenaController,
    deleteArenaController
};