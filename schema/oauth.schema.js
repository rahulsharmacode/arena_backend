const mongoose = require("mongoose");

const oauthSchema = new mongoose.Schema({
    user : {type: mongoose.Schema.Types.ObjectId, ref: "users", required: false},
    googleId: String,
  name: String,
  email: String
},{
    timestamps : true
});

const OAuth = mongoose.model("oauths", oauthSchema);
module.exports = {
    OAuth
}