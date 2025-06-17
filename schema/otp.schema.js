const mongoose = require("mongoose");

const otpchema = new mongoose.Schema({
    otp : {type:Number, unique:true},
    expiresIn : {type:Number},
    type : {type:String, enum : ["forgetpassword","emailverification"]},  
    email : {type:String},
    user : {type:mongoose.Schema.Types.ObjectId , ref : "users"}
},
     {
    timestamps:true
});

const Otp = mongoose.model("otps",otpchema);
module.exports = {
    Otp
};

