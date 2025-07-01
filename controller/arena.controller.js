const { sendTemplateEmail } = require("../helper/mail.function");
const { Arena } = require("../schema/arena.schema");
const { User } = require("../schema/user.schema");
const { Category } = require("../schema/category.schema");

const getArenaController = async (req, res) => {
  console.log("🚀 ~ getArenaController ~ req:", req)
  let { page = 1, limit = 10, search = "" } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  let query = {};

  if (search) {
    query.$or = [
     { title: { $regex: search, $options: 'i' } }
    ];
  }

  try {
    let findQuery = query;

    if (req["rootId"] && req["rootUser"]?.role === "user") {
      findQuery = { ...query, author: req["rootId"] };
    }

    const [findData, countData] = await Promise.all([
      Arena.find(findQuery).skip(skip).limit(limit).sort({ createdAt: -1 })
      .populate("author","fullName image")
      .populate("guest","fullName image")
      .populate("like","fullName image"),
      Arena.countDocuments(findQuery)
    ]);

    return res.status(200).json({
      status: true,
      message: "success",
      total: countData,
      totalPages: Math.ceil(countData / limit),
      data: findData
    });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
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
  let { title = "", guest, topics = [] } = req.body || {};

  if (!title || !guest || topics.length === 0) {
    return res.status(406).json({
      status: false,
      message: `failed, title, guest user, topic is required`,
    });
  }

  try {
    const findData = await User.findById(guest);
    if (!findData) {
      return res.status(406).json({ status: false, message: `failed, guest not found` });
    }

    // Create arena
    const saveData = await Arena.create({ ...req.body, author: req["rootId"] });

    // Insert unique categories only
    const existing = await Category.find({ name: { $in: topics } }).select("name");
    const existingNames = new Set(existing.map(cat => cat.name));

    const newTopics = topics
      .filter(topic => !existingNames.has(topic))
      .map(topic => ({ name: topic }));

    if (newTopics.length > 0) {
      await Category.insertMany(newTopics, { ordered: false });
    }

    // Send invitation email
    sendTemplateEmail({
      data: {
        email: findData.email,
        talkTitle: title,
        speakerName: req["rootUser"].fullName,
        talkDate: "2025-07-15T14:00:00Z",
        talkTime: "2:00 PM",
        timeZone: "IST",
        topics,
        talkUrl: "https://arena.com/talks/ai-software-development",
        arenaUrl: "https://arena.com/arena"
      },
      subject: "Arena Invitation",
      template: "arenainvite"
    });

    return res.status(201).json({ status: true, message: "success", data: saveData });

  } catch (err) {
    return res.status(500).json({ status: false, error: err.message || err });
  }
};



// const postArenaController = async (req, res) => {
//         let {   
//             title="",
//             guest,
//             topics=[] } = req.body || {};
//         if (!title || !guest || topics.length===0) return res.status(406).json({ status: false, message: `failed, title, geust user, topic is required` });
//         const docs = topics.map(topic => ({ name:topic }));
//     try {
//         const findData = await User.findById(guest);
//         if (!findData) return res.status(406).json({ status: false, message: `failed, guest not found` });
       
//         const saveData = await Arena.create({...req.body,author:req["rootId"]});
//          await Category.insertMany(docs, { ordered: false });
//         if (!saveData) return res.status(500).json({ status: false, message: `failed, someting went wrong!` });
   
//         sendTemplateEmail({
//             data : {
//                 email:findData.email,
//     talkTitle: title,
//     speakerName: req["rootUser"].fullName,
//     talkDate: "2025-07-15T14:00:00Z", // Example date in ISO format
//     talkTime: "2:00 PM",
//     timeZone: "IST",
//     topics,
//     talkUrl: "https://arena.com/talks/ai-software-development",
//     arenaUrl: "https://arena.com/arena"
// },
//             subject:"Arena Invitation",
//             template : "arenainvite"
//         })
//         return res.status(200).json({ status: true, message: "success", data: saveData });
//     }
//     catch (err) { return res.status(500).json({ status: false, error: err }) };
// };
const putArenaController = async (req, res) => {
    try {
        const { id } = req.params;
        const findData = await Arena.findById(id);
        if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
        if(req["rootId"]&& req["rootUser"]?.role==="user"&& !findData.author.equals(req["rootId"])) return res.status(401).json({ status: false, message: `failed, unauthorized` });
      
        
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
        if(req["rootId"]&& req["rootUser"]?.role==="user"&& !findData.author.equals(req["rootId"])) return res.status(401).json({ status: false, message: `failed, unauthorized` });
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
        if(req["rootId"]&& req["rootUser"]?.role==="user"&& !findData.author.equals(req["rootId"])) return res.status(401).json({ status: false, message: `failed, unauthorized` });
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