const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    room: {type:mongoose.Schema.Types.ObjectId , ref :"arenas",index:true},
    content : {type:String,default:null},
    file : { 
        s3Key :String,
        imageUrl :String,
        },
    topic :  {type:String},
    topicIndex :  {type:String},
    sender : {type:mongoose.Schema.Types.ObjectId , ref :"users"},
},{
    timestamps:true
});

const Message = mongoose.model( "messages",messageSchema );
module.exports =  {Message}