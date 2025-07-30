const { uploadBase64Image } = require("../helper/s3.function");
const { Message } = require("../schema/messages.schema");

const userInRoom = {};
const socketHandler = (io) => {
  return io.on("connection" , (socket) => {
    socket.on("room:join", ({ roomId ,user}) => {
    socket.join(roomId);
  });

    socket.on("message:send", async (data)=>{
      let result = null;
      if(data.file){
       result = await uploadBase64Image({
      base64Data: data?.file?.data,
      filename: data?.file?.name,
      mimetype: data?.file?.type,
      folder: `chat-images` // optional
    });
      }


      await Message.create({
            room: data.user.roomId,
            content :data.content,
            file : result?  {
                imageUrl: result.url,
                s3Key: result.s3Key,   
              } : {},
            topic : data.topic,
            topicIndex : data.topicIndex,
            sender : data.user.uid,
      });
        io.to(data.user.roomId).emit("message:receive" , {type:"message",...data,createdAt:new Date()});
    });

    socket.on("message:typing", (data)=>{
        socket.to(data.user.roomId).emit("message:user_typing" , data);
    });

    socket.on("room:leave", ({room,username})=>{
        io.to(room).emit("room:info" , {users:userInRoom[room] });
    });

    socket.on("disconnect", () =>{ 
    console.log(`user disconnected, ${socket.id}`)
  });
});
};

module.exports ={ 
    socketHandler
}