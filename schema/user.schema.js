const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username : {type:String, unique:true,   
    minlength: 5,
    maxlength: 20,
    lowercase: true,
    match: [/^[a-z0-9._-]+$/, 'Username can only contain lowercase letters, numbers, dots, dashes, and underscores'],
    required: [true, 'username is required'],
    },
    email : {
        type:String,
        unique:true,
        required: [true, 'email is required'],
    },
    password : {
    type:String,
    minlength: 8,
    required: [true, 'password is required'],
    },
    credit : {
    type:Number,
    default : 0.00,
    },
    fullName: {
      type:String,
      required: [true, 'full name is required'],
    },
    image: {
        s3Key :String,
        s3Bucket :String,
        uploadDate :Date,
        originalFileName: String
    },
    role : {type:String, enum: ['admin', 'moderator', 'user', 'bot', 'superadmin'], default : 'user'},
    status : {type:String},
    isBlocked: {type:Boolean,default:false},
    isEmailVerified: {type:Boolean,default:false},

    isLinkedinVerified: {type:String,default:null},
    isXVerified: {type:String,default:null},
    isFacebookVerified: {type:String,default:null},
    isInstagramVerified: {type:String,default:null},
    isYoutubeVerified: {type:String,default:null},
    isTiktokVerified: {type:String,default:null},



    bio:{type:String},
    mobileNumber:{type:String},
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
}, {
    timestamps:true
});


const followSchema = new mongoose.Schema({
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    following: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
}, {
    timestamps:true
});

const User = mongoose.model("users",userSchema);
const Follow = mongoose.model("follows",followSchema);

module.exports = {
    User,
    Follow
};

