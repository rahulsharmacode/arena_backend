const { sendTemplateEmail } = require("../helper/mail.function");
const { User } = require("../schema/user.schema");
const { Category } = require("../schema/category.schema");
const { generatePresignedUrl } = require("../helper/s3.function");
const { default: mongoose } = require("mongoose");
const { Notification } = require("../schema/notification.schema");

const getNotificationController = async (req, res) => {
  let { page = 1, limit = 10, search = "", isRead = null,type=""} = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  let query = {};

  const orConditions = [];

  if (search) {
    orConditions.push({ title: { $regex: search, $options: 'i' } });
  }

  if (isRead) {
    orConditions.push({ isRead});
  }

    if (type) {
    orConditions.push({ type: { $regex: type, $options: 'i' } });
  }

  if (orConditions.length > 0) {
    query.$or = orConditions;
  }

  try {
    let findQuery = query;

    if (req["rootId"] && req["rootUser"]?.role === "user") {
      query.$and = [
        { $or: orConditions.length ? orConditions : [{}] }, // search/isread
        {
          $or: [
            { to: req["rootId"] },
          ]
        },
      ];
    }

    const [findData, countData,unReadData] = await Promise.all([
      Notification.find(findQuery).skip(skip).limit(limit).sort({ createdAt: -1 }).populate("event","eventStatus guestName isNewDiscussion"),
      Notification.countDocuments(findQuery),
    Notification.countDocuments({ isRead: false, to:req["rootId"] })

    ]);

    return res.status(200).json({
      status: true,
      message: "success",
      total: countData,
      totalPages: Math.ceil(countData / limit),
      currentPage:page,
      data: findData,
      unReadData
    });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
};
const patchNotificationController = async (req, res) => {
  try {
    const { id } = req.params;
    if(!mongoose.isValidObjectId(id)) return res.status(404).json({ status: false, message: `failed, Invalid Id` });
    const findData = await Notification.findById(id);
    if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
    if (req["rootId"] && req["rootUser"]?.role === "user" && !findData.to.equals(req["rootId"])) return res.status(401).json({ status: false, message: `failed, unauthorized` });
    Object.assign(findData, req.body);
    await findData.save();
    return res.status(200).json({ status: true, message: "success", data: findData });
  }
  catch (err) { return res.status(500).json({ status: false, error: err }) };
};
const deleteNotificationController = async (req, res) => {
  try {
    const { id } = req.params;
    if(!mongoose.isValidObjectId(id)) return res.status(404).json({ status: false, message: `failed, Invalid Id` });
    const findData = await Notification.findById(id);
    if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
    if (req["rootId"] && req["rootUser"]?.role === "user" && !findData.author.equals(req["rootId"])) return res.status(401).json({ status: false, message: `failed, unauthorized` });
    let deleteResponse = await Notification.findByIdAndDelete(id);
    if (!deleteResponse) return res.status(404).json({ status: false, message: `failed, data not found` });
    return res.status(204).json({ status: true, message: "success" });
  }
  catch (err) { return res.status(500).json({ status: false, error: err }) };
};

const patchNotificationReadAllController = async (req, res) => {
  try {
    const findData = await Notification.updateMany({to:req["rootId"]},
        {
        $set : {isRead:true}
    }
        );
    if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
    return res.status(200).json({ status: true, message: "success", data: findData });
  }
  catch (err) { return res.status(500).json({ status: false, error: err }) };
};


module.exports = {
  getNotificationController,
  patchNotificationController,
  deleteNotificationController,
  patchNotificationReadAllController
};