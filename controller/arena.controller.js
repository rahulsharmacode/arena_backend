const { sendTemplateEmail } = require("../helper/mail.function");
const { Arena, Bookmarks, Liked, Comment } = require("../schema/arena.schema");
const { User } = require("../schema/user.schema");
const { Category } = require("../schema/category.schema");
const { generatePresignedUrl } = require("../helper/s3.function");
const { default: mongoose } = require("mongoose");
const { Notification } = require("../schema/notification.schema");

const getArenaController = async (req, res) => {
  let { page = 1, limit = 10, search = "", eventStatus = "open" } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  let query = {};

  const orConditions = [];

  if (search) {
    orConditions.push({ title: { $regex: search, $options: 'i' } });
  }

  if (eventStatus) {
    orConditions.push({ eventStatus: { $regex: eventStatus, $options: 'i' } });
  }

  if (orConditions.length > 0) {
    query.$or = orConditions;
  }

  // if (search) {
  //   query.$or = [
  //    { title: { $regex: search, $options: 'i' } }
  //   ];
  // }

  // if (eventStatus) {
  //   query.$or = [
  //    { eventStatus: { $regex: eventStatus, $options: 'i' } }
  //   ];
  // }

  try {
    let findQuery = query;

    if (req["rootId"] && req["rootUser"]?.role === "user") {
      query.$and = [
        { $or: orConditions.length ? orConditions : [{}] }, // search/status
        {
          $or: [
            { author: req["rootId"] },
            { guest: req["rootId"] }
          ]
        },
        { isNewDiscussion: false }
      ];
    }

    const [findData, countData] = await Promise.all([
      Arena.find(findQuery).skip(skip).limit(limit).sort({ createdAt: -1 })
        .populate("author", "fullName image username")
        .populate("guest", "fullName image username")
        .populate("like", "fullName image username"),
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

const getByIdArenaController = async (req, res) => {
  try {
    const { id } = req.params;
    const findData = await Arena.findById(id).populate("guest", "fullName image email username")
      .populate("author", "fullName image username bio isTiktokVerified isYoutubeVerified isInstagramVerified isFacebookVerified isXVerified isLinkedinVerified")
      .populate("guest", "fullName image username")
      .populate("like", "fullName image username");


    const arenaObjects = await Promise.all([findData].map(async (arenaDoc) => {
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

      return arena;
    }));


    if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
    return res.status(200).json({ status: true, message: "success", data: arenaObjects[0] });
  }
  catch (err) { return res.status(500).json({ status: false, error: err }) };
};

const postArenaController = async (req, res) => {
  let { guestName = "", guest, topics = [] } = req.body || {};

  if (!guestName || topics?.length === 0) {
    return res.status(406).json({
      status: false,
      message: `failed, guest user & topic is required`,
    });
  }

  try {
    const findData = guest && await User.findById(guest);
    if (!findData && guest) {
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

    // Send Notification
    await Notification.insertMany([
      {
        title: `New event created`,
        content: `New event (${topics[req.body.mainTopicIndex]}) invited to ${guestName}`,
        to: req["rootId"],
        event: saveData._id,
        redirect : `http://${req.headers.host}/text/${saveData._id}`
      },
      ...(guest ? [{
        title: `Event Invitation`,
        content: `You have been invited to (${topics[req.body.mainTopicIndex]}) event`,
        to: guest,
        from:req["rootId"],
        event: saveData._id,
        redirect : `http://${req.headers.host}/text/${saveData._id}`
      }] : [])
    ]);
    // Send invitation email
    guest && sendTemplateEmail({
      data: {
        email: findData.email,
        talkTitle: topics[req.body.mainTopicIndex],
        speakerName: req["rootUser"].fullName,
        talkDate: "2025-07-15T14:00:00Z",
        talkTime: "2:00 PM",
        timeZone: "IST",
        topics,
        talkUrl: `http://${req.headers.host}/text/${saveData._id}`,
        arenaUrl: `http://${req.headers.host}/`
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
    if (req["rootId"] && req["rootUser"]?.role === "user" && !findData.author.equals(req["rootId"])) return res.status(401).json({ status: false, message: `failed, unauthorized` });


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
    if (req["rootId"] && req["rootUser"]?.role === "user" && !findData.author.equals(req["rootId"])) return res.status(401).json({ status: false, message: `failed, unauthorized` });
    Object.assign(findData, req.body);
    await findData.save();
    return res.status(200).json({ status: true, message: "success", data: findData });
  }
  catch (err) { return res.status(500).json({ status: false, error: err }) };
};

const patchArenaBookmarksController = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const existing = await Bookmarks.findOne({ user: req["rootId"], post: postId });

    if (existing) {
      // Remove bookmark
      await existing.deleteOne();
      return res.status(200).json({ status: true, message: 'Bookmark removed' });
    } else {
      // Add bookmark
      await Bookmarks.create({ user: req["rootId"], post: postId });
      return res.status(201).json({ status: true, message: 'Post bookmarked' });
    }
  }
  catch (err) { return res.status(500).json({ status: false, error: err }) };
};

const patchArenaLikeController = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { parent } = req.body;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ status: false, message: "Invalid ID" });
    }

    if (parent && !mongoose.Types.ObjectId.isValid(parent)) {
      return res.status(400).json({ status: false, message: "Invalid Parent ID" });
    }
    const existing = await Liked.findOne({ user: req["rootId"], post: postId });

    if (existing) {
      // Remove bookmark
      await existing.deleteOne();
      return res.status(200).json({ status: true, message: 'like removed' });
    } else {
      // Add bookmark
      await Liked.create({ user: req["rootId"], post: postId, parent });
      return res.status(201).json({ status: true, message: 'liked' });
    }
  }
  catch (err) { return res.status(500).json({ status: false, error: err }) };
};

const patchArenaGuestController = async (req, res) => {
  try {
    const { id } = req.params;

    const arena = await Arena.findById(id);
    if (!arena) {
      return res.status(404).json({ status: false, message: "Event not found" });
    }

    // Check if user is trying to set eventStatus to "open"
    const isTryingToAccept = req.body?.eventStatus === "open";

    if (isTryingToAccept) {
      // Fetch guest user's profile
      const user = await User.findById(req["rootId"]);

      // Gather verification checks required by arena
      const requiredVerifications = [];

      if (arena.isXVerified) requiredVerifications.push("isXVerified");
      if (arena.isLinkedinVerified) requiredVerifications.push("isLinkedinVerified");
      if (arena.isFacebookVerified) requiredVerifications.push("isFacebookVerified");
      if (arena.isInstagramVerified) requiredVerifications.push("isInstagramVerified");
      if (arena.isYoutubeVerified) requiredVerifications.push("isYoutubeVerified");
      if (arena.isTiktokVerified) requiredVerifications.push("isTiktokVerified");

      // Check for missing verifications in user's profile
      const missing = requiredVerifications.filter((key) => !user[key]);

      if (missing.length > 0) {
        return res.status(403).json({
          status: false,
          message: `You must verify your social accounts before accepting this event: ${missing.join(", ")}`,
        });
      }
    }

    // Assign guest if not already set
    if (!arena.guest) {
      req.body.guest = req["rootId"];
    }

    // Update arena fields
    Object.assign(arena, req.body);
    await arena.save();

    // Prepare notification
    const topic = arena?.topics[arena?.mainTopicIndex];

    await Notification.insertMany([
      {
        title: `Event status changed`,
        content: `Event status for (${topic}) updated to ${arena.eventStatus}`,
        to: req["rootId"],
        event: id,
        redirect: `http://${req.headers.host}/text/${id}`,
      },
      {
        title: `Event Invitation ${arena.eventStatus === "open" ? "Accepted" : arena.eventStatus}`,
        content: `Event status for (${topic}) updated to ${arena.eventStatus}`,
        to: arena.author,
        from: req["rootId"],
        event: id,
        redirect: `http://${req.headers.host}/text/${id}`,
      },
    ]);

    return res.status(200).json({ status: true, message: "Success", data: arena });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
};


const deleteArenaController = async (req, res) => {
  try {
    const { id } = req.params;
    const findData = await Arena.findById(id);
    if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
    if (req["rootId"] && req["rootUser"]?.role === "user" && !findData.author.equals(req["rootId"])) return res.status(401).json({ status: false, message: `failed, unauthorized` });
    let deleteResponse = await Arena.findByIdAndDelete(id);
    if (!deleteResponse) return res.status(404).json({ status: false, message: `failed, data not found` });
    return res.status(204).json({ status: true, message: "success" });
  }
  catch (err) { return res.status(500).json({ status: false, error: err }) };
};

const postArenaNewConversationController = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(406).json({
        status: false,
        message: `failed, content is required`,
      });
    };
    req.body = {
      content: content,
      isNewDiscussion: true,
      author: req["rootId"]
    }
    const saveData = await Arena.create({ ...req.body });

    // Send invitation email
    // sendTemplateEmail({
    //   data: {
    //     email: findData.email,
    //     talkTitle: title,
    //     speakerName: req["rootUser"].fullName,
    //     talkDate: "2025-07-15T14:00:00Z",
    //     talkTime: "2:00 PM",
    //     timeZone: "IST",
    //     topics,
    //     talkUrl: "https://arena.com/talks/ai-software-development",
    //     arenaUrl: "https://arena.com/arena"
    //   },
    //   subject: "Arena Invitation",
    //   template: "arenainvite"
    // });

    return res.status(201).json({ status: true, message: "success", data: saveData });

  } catch (err) {
    return res.status(500).json({ status: false, error: err.message || err });
  }
};

module.exports = {
  getArenaController,
  getByIdArenaController,
  postArenaController,
  putArenaController,
  patchArenaController,
  deleteArenaController,
  patchArenaGuestController,
  patchArenaBookmarksController,
  patchArenaLikeController,
  postArenaNewConversationController,
};