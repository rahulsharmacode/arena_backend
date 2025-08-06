const { default: mongoose } = require("mongoose");
const { View, Arena } = require("../schema/arena.schema");
const { Message } = require("../schema/messages.schema");


const postArenaViewController = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { type = "post", parent = null } = req.body;
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ status: false, message: "Invalid ID" });
        };

        if (parent && !mongoose.Types.ObjectId.isValid(parent)) {
            return res.status(400).json({ status: false, message: "Invalid Parent ID" });
        };

        const existPost = type === "post" ? await Arena.findById(postId) : await Message.findById(postId);
        if (!existPost) return res.status(404).json({ status: false, message: "failed, post not found." });

        let postData = await View.create({ user: req["rootId"], post: postId, parent });
        return res.status(201).json({ status: true, message: 'success', data: postData });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};

module.exports = {
    postArenaViewController,
}