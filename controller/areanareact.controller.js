const { sendTemplateEmail } = require("../helper/mail.function");
const { Arena, Liked } = require("../schema/arena.schema");
const { User } = require("../schema/user.schema");
const { Category } = require("../schema/category.schema");
const { generatePresignedUrl } = require("../helper/s3.function");

const likeArenaController = async (req, res) => {
  const {postId} = req.params||{};

   let { page = 1, limit = 10,topic=""} = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;


  try {
    // const findData = await Liked.find({postId}).skip(skip).limit(limit).sort({ createdAt: -1 }).populate("user" , "username fullName image");

      const [findData, countData] = await Promise.all([
        Liked.find({post:postId}).skip(skip).limit(limit).sort({ createdAt: -1 }).populate("user","fullName image username")
        ,
        Liked.countDocuments({post:postId})
      ]);
      
      console.log("🚀 ~ likeArenaController ~ findData:", findData)

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

  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
};


module.exports = {
    likeArenaController
};