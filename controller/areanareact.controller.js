const { sendTemplateEmail } = require("../helper/mail.function");
const { Arena } = require("../schema/arena.schema");
const { User } = require("../schema/user.schema");
const { Category } = require("../schema/category.schema");

const likeArenaController = async (req, res) => {
  const {id} = req.params||{};

  try {
    const findData = await Arena.findById(id);
    if (!findData) return res.status(404).json({ status: false, message: `failed, data not found` });
    const hasLiked = findData.like.includes(req["rootId"]);
    if(hasLiked){
      await Arena.findByIdAndUpdate(id,{
        $pull : {like : req["rootId"]}
      });
    }else{
       await Arena.findByIdAndUpdate(id,{
        $addToSet : {like : req["rootId"]}
      });
    }


    return res.status(hasLiked ?  204 : 201).json({
      status: true,
      message: "success"
    });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
};


module.exports = {
    likeArenaController
};