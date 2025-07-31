const { default: mongoose } = require("mongoose");
const { Comment, Arena } = require("../schema/arena.schema");
const { Message } = require("../schema/messages.schema");


const getArenaCommentController = async (req, res) => {
  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;
  const {id} = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ status: false, message: "Invalid ID" });
        }

    try {
      let findQuery = { post: id };

// if (req["rootId"] && req["rootUser"]?.role === "user") {
//   query.$and = [
//     { post: postId } 
//   ];
// }
    const [findData, countData] = await Promise.all([
      Comment.find(findQuery).skip(skip).limit(limit).sort({ createdAt: -1 })
      .populate("user","fullName image username"),
      Comment.countDocuments(findQuery)
    ]);
const arenaObjects = await Promise.all(findData.map(async (arenaDoc) => {
  const arena = arenaDoc.toObject(); // convert to plain JS object
  // Process author
  if (arena.user?.image?.s3Key) {
    arena.user.image.url = await generatePresignedUrl(arena.user.image.s3Key);
  }
  return arena;
}));

    return res.status(200).json({
      status: true,
      message: "success",
      total: countData,
      totalPages: Math.ceil(countData / limit),
      data: arenaObjects
    });
  }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};

const postArenaCommentController = async (req, res) => {
    try {
        const { id: postId } = req.params;
         const { content,type="post" } = req.body;
         if (!mongoose.Types.ObjectId.isValid(postId)) {
             return res.status(400).json({ status: false, message: "Invalid ID" });
            }
        const existPost = type==="post" ?  await Arena.findById(postId) : await Message.findById(postId);
        if(!existPost) return res.status(404).json({ status: false, message: "failed, post not found." });
       
        if (!content) return res.status(406).json({ status: false, message: "comment content is required" });
        let postData = await Comment.create({ user: req["rootId"], post: postId, content });
        return res.status(201).json({ status: true, message: 'success, comment posted!',data:postData });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};

const patchArenaCommentController = async (req, res) => {
    try {
        const { id } = req.params;
        let query = {};
        const { content } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ status: false, message: "Invalid ID" });
        }
        if (!content) return res.status(406).json({ status: false, message: "comment content is required" });
        if (req["rootId"] && req["rootUser"]?.role === "admin") { query = { _id: id, user: req["rootId"] } }else{ query = { _id: id}};
        let findData = await Comment.findOneAndUpdate
            (query, {
                $set: req.body
            });
        if (findData) return res.status(201).json({ status: true, message: 'success, comment updated!' });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};

const deleteArenaCommentController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ status: false, message: "Invalid ID" });
        };
        let query = {};
        if (req["rootId"] && req["rootUser"]?.role === "admin") { query = { _id: id, user: req["rootId"] } }else{ query = { _id: id}};
        let findData = await Comment.findOneAndDelete(query);
        if (findData) return res.status(204).json({ status: true, message: 'success, deleted!' });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};




module.exports = {
    getArenaCommentController,
    postArenaCommentController,
    patchArenaCommentController,
    deleteArenaCommentController
}