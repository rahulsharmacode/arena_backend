const { default: mongoose } = require("mongoose");
const { sendTemplateEmail } = require("../helper/mail.function");
const { generatePresignedUrl } = require("../helper/s3.function");
const { Follow, User } = require("../schema/user.schema");

const getFollowController = async (req, res) => {
    let { page = 1, limit = 10, type = "follower" } = req.query || {};
    const {userId} = req.params;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    let findQuery = type==="follower" ?  {following : userId} :  {follower : userId}

    const selectFields = type==="follower" ?
        "-follower -__v -_id -updatedAt -createdAt" // Admin sees everything except password & __v
        : "-following -__v -_id -updatedAt -createdAt";
    try {
     
        const [findData, countData] = await Promise.all([
           type==="follower" ?  Follow.find(findQuery).populate("following", 'image fullName username').select(selectFields).skip(skip).limit(limit).sort({ createdAt: -1 }) :
            Follow.find(findQuery).populate("follower", 'image fullName username').select(selectFields).skip(skip).limit(limit).sort({ createdAt: -1 }),
           ,
            Follow.countDocuments(findQuery)
        ]);


        const arenaObjects = await Promise.all(findData.map(async (arenaDoc) => {
          const arena = arenaDoc.toObject(); // convert to plain JS object
        
          // Process author
          if (type==="follower" && arena.following?.image?.s3Key) {
            arena.following.image.url = await generatePresignedUrl(arena.following.image.s3Key);
          }
           if (type==="following" && arena.follower?.image?.s3Key) {
            arena.follower.image.url = await generatePresignedUrl(arena.follower.image.s3Key);
          }
        
          return arena;
        }));

                  return res.status(200).json({
      status: true,
      message: "success",
      total: countData,
      totalPages: Math.ceil(countData / limit),
      currentPage:page,
      data: arenaObjects
    });
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};

const postFollowController = async (req, res) => {
    const  { userId } = req.params || {};

    try {
      if(!mongoose.isValidObjectId(userId)) return res.status(404).json({ status: false, message: `failed, Invalid Id` });
    const followerId = req["rootId"];
    const followingId = userId;

    if (followerId.toString() === followingId)
      return res.status(400).json({ status:false, message: "failed, You can't follow yourself" });

    // Check user existence
    const targetUser = await User.findById(followingId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const existingFollow = await Follow.findOne({ follower: followerId, following: followingId });
if (existingFollow) {
      // Already following, so unfollow
      await Follow.findByIdAndDelete(existingFollow._id);
      return res.status(200).json({
        status: true,
        message: "Unfollowed successfully",
        action: "unfollowed",
      });
    } else {
      // Not following, so follow
      const followData = await Follow.create({ follower: followerId, following: followingId });
      return res.status(200).json({
        status: true,
        message: "Followed successfully",
        action: "followed",
        data: followData,
      });
    }


    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};

module.exports = {
    getFollowController,
    postFollowController
};