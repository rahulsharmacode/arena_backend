const mongoose = require("mongoose");

const arenaSchema = new mongoose.Schema({
    title: { type: String, minLength: 5 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    topics: [{type:String}],
    slug: { type: String },
    isLinkedinVerified: { type: Boolean, default: false },
    isXVerified: { type: Boolean, default: false },
    isFacebookVerified: { type: Boolean, default: false },
    isInstagramVerified: { type: Boolean, default: false },
    isYoutubeVerified: { type: Boolean, default: false },
    isTiktokVerified: { type: Boolean, default: false },

    view: { type: Number, default: 0 },
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],

}, {
    timestamps: true
});

const Arena = mongoose.model("arenas", arenaSchema);
module.exports = { Arena };