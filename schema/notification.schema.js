const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    to : {type: mongoose.Schema.Types.ObjectId, ref: "users", required: true},
    from : {type: mongoose.Schema.Types.ObjectId, ref: "users", required: false,default:null},
    title: {type:String, minLength :5},
    content : {type:String, minLength :5},
    type : {type:String, enum:["podcast","message","invite","verification"],default:"invite"},
    isRead:{type:Boolean,default:false},
    redirect : {type:String,default:null},
    event : {type: mongoose.Schema.Types.ObjectId, ref: "arenas", required: false,default:null}
},{
    timestamps : true
});

const Notification = mongoose.model("notifications", notificationSchema);
module.exports = {
    Notification
}