const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    to : {type: mongoose.Schema.Types.ObjectId, ref: "users", required: true},
    from : {type: mongoose.Schema.Types.ObjectId, ref: "users", required: false},
    info: {type:String, minLength :5},
    content : {type:String, minLength :5},
    type : {type:String, enum:["podcast","message","invite","verification"]},
},{
    timestamps : true
});

const Notification = mongoose.model("notifications", notificationSchema);
module.exports = {
    Notification
}