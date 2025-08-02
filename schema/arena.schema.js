const mongoose = require("mongoose");

const arenaSchema = new mongoose.Schema({
    title: { type: String, minLength: 5 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "users", index: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: "users", required:false },
    guestName:{type:String},
    topics: [{type:String}],
    mainTopicIndex : {type:Number,default:0},
    slug: { type: String },
    isLinkedinVerified: { type: Boolean, default: false },
    isXVerified: { type: Boolean, default: false },
    isFacebookVerified: { type: Boolean, default: false },
    isInstagramVerified: { type: Boolean, default: false },
    isYoutubeVerified: { type: Boolean, default: false },
    isTiktokVerified: { type: Boolean, default: false },

    eventType : {type:String,enums : ["length","time","freeflow"],default:"length"},
    wordsLength : {type:Number,default:null},
    
    isCustomWordsLength : {type:Boolean,default:false},
    isCustomTimePeriod : {type:Boolean,default:false},

    timePeriod : {type:Number,default:null},
    isPaid : {type:Boolean,default:false},
    offerAmount : {type:Number,default:null},
    paymentMode : {type:String,enums:["stripe","paypal"],default:"stripe"},
    paymentStatus:{type:String,enums:['pending' , 'authorized' , 'cancelled' , 'completed'],default: null},
    isEventClosed : {type:Boolean,default:false},
    eventStatus:{type:String,enums:["pending","negotation","open","closed","decline"],default:"pending"},
    view: { type: Number, default: 0 },
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],

    isNewDiscussion:{type:Boolean,default:false},
    content:{type:String,default:null}
}, {
    timestamps: true
});




const bookmarksSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", index: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "arenas", required:false },
}, {
    timestamps: true
});

const likedSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", index: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "messages", required:false },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "arenas", required:false,default:null },
}, {
    timestamps: true
});


const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", index: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "messages", required:false },
    content : {type:String, required: [true, 'comment content is required'],},
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "arenas", required:false,default:null },
}, {
    timestamps: true
});

const Arena = mongoose.model("arenas", arenaSchema);
const Bookmarks = mongoose.model("bookmarks", bookmarksSchema);
const Liked = mongoose.model("likes", likedSchema);
const Comment = mongoose.model("comments", commentSchema);


module.exports = { Arena,Bookmarks,Liked,Comment };