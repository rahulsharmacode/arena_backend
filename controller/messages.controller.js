const { generatePresignedUrl } = require("../helper/s3.function");
const { Liked } = require("../schema/arena.schema");
const { Message } = require("../schema/messages.schema");



const getArenaMessagesController = async (req, res) => {
  let { page = 1, limit = 10,topic=""} = req.query;
  const {roomId} = req.params;
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  const query = {
    room: roomId // base condition
  };

  if (topic) {
    query.topic = { $regex: topic, $options: 'i' }; // case-insensitive search
  }

  try {
    let findQuery = query;

    const [findData, countData] = await Promise.all([
      Message.find(findQuery).skip(skip).limit(limit).sort({ createdAt: -1 })
     ,
      Message.countDocuments(findQuery)
    ]);

    const arenaObjects = await Promise.all(findData.map(async (arenaDoc) => {
      const arena = arenaDoc.toObject(); // convert to plain JS object
    
      // Process author
      if (arena.file?.s3Key) {
        arena.file.url = await generatePresignedUrl(arena.file.s3Key);
      }
    
          const isLiked = await Liked.findOne({user:req["rootId"],post:arena._id});
          arena.liked = isLiked ? true:false;
      
          const totalLiked = await Liked.countDocuments({post:arena._id});
          arena.like = totalLiked;

      return arena;
    }));

    return res.status(200).json({
      status: true,
      message: "success",
      total: countData,
      totalPages: Math.ceil(countData / limit),
      data: arenaObjects
    });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
};


module.exports = {
    getArenaMessagesController
}