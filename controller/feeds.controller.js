const { generatePresignedUrl } = require("../helper/s3.function");
const { Arena, Bookmarks, Liked, Comment } = require("../schema/arena.schema");

const getFeedController = async (req, res) => {
  let { page = 1, limit = 10, search = ""} = req.query;
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
    const [findData, countData] = await Promise.all([
      Arena.find(findQuery).skip(skip).limit(limit).sort({ createdAt: -1 })
      .populate("author","fullName image username bio")
      .populate("guest","fullName image username bio")
      .populate("like","fullName image username"),
      Arena.countDocuments(findQuery)
    ]);
const arenaObjects = await Promise.all(findData.map(async (arenaDoc) => {
  const arena = arenaDoc.toObject(); // convert to plain JS object

  // Process author
  if (arena.author?.image?.s3Key) {
    arena.author.image.url = await generatePresignedUrl(arena.author.image.s3Key);
  }

  // Process guest
  if (arena.guest?.image?.s3Key) {
    arena.guest.image.url = await generatePresignedUrl(arena.guest.image.s3Key);
  }




  // Process likes array
  if (Array.isArray(arena.like)) {
    await Promise.all(arena.like.map(async (liker) => {
      if (liker?.image?.s3Key) {
        liker.image.url = await generatePresignedUrl(liker.image.s3Key);
      }
    }));
  }
    const isBookmarked = await Bookmarks.findOne({user:req["rootId"],post:arena._id});
    arena.bookmark = isBookmarked ? true:false;

    const isLiked = await Liked.findOne({user:req["rootId"],post:arena._id});
    arena.liked = isLiked ? true:false;

const totalLiked = await Liked.countDocuments({ parent: arena._id });
  arena.like =totalLiked;

          const totalComment = await Comment.countDocuments({parent:arena._id});
    arena.comments = totalComment;

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
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
};
const getFeedUserController = async (req, res) => {
  let { page = 1, limit = 10,bookmark=null} = req.query;
  const{ id} = req.params;
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  try {
   let arenaIds = [];
    if (bookmark === "true") {
      const bookmarked = await Bookmarks.find({ user: req["rootId"] }).select("post");
      arenaIds = bookmarked.map(b => b.post.toString());
    }

    let findQuery = { author: id };
    if (bookmark === "true") {
      findQuery = { _id: { $in: arenaIds }, author: id };
    }
  
    const [findData, countData] = await Promise.all([
      Arena.find(findQuery).skip(skip).limit(limit).sort({ createdAt: -1 })
      .populate("author","fullName image username bio")
      .populate("guest","fullName image username bio")
      .populate("like","fullName image username"),
      Arena.countDocuments(findQuery)
    ]);
const arenaObjects = await Promise.all(findData.map(async (arenaDoc) => {
  const arena = arenaDoc.toObject(); // convert to plain JS object

  // Process author
  if (arena.author?.image?.s3Key) {
    arena.author.image.url = await generatePresignedUrl(arena.author.image.s3Key);
  }

  // Process guest
  if (arena.guest?.image?.s3Key) {
    arena.guest.image.url = await generatePresignedUrl(arena.guest.image.s3Key);
  }




  // Process likes array
  if (Array.isArray(arena.like)) {
    await Promise.all(arena.like.map(async (liker) => {
      if (liker?.image?.s3Key) {
        liker.image.url = await generatePresignedUrl(liker.image.s3Key);
      }
    }));
  }
    const isBookmarked = await Bookmarks.findOne({user:req["rootId"],post:arena._id});
    arena.bookmark = isBookmarked ? true:false;

    const isLiked = await Liked.findOne({user:req["rootId"],post:arena._id});
    arena.liked = isLiked ? true:false;

const totalLiked = await Liked.countDocuments({ parent: arena._id });
  arena.like =totalLiked;

        const totalComment = await Comment.countDocuments({parent:arena._id});
    arena.comments = totalComment;

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
    getFeedController,
    getFeedUserController
}