const userRooms = {};
const activeGames = {}; // room-wise game state
const userInRoom = {};
const {handleCommand} = require("../helper/socket.function");
const socketHandler = (io) => {
    return io.on("connection" , (socket) => {

    socket.on("room:join", ({ room, username }) => {
    socket.join(room);
    userRooms[socket.id] = { room, username };
    if(!userInRoom[room]) userInRoom[room] = [];
    if(!userInRoom[room].includes(userRooms)) {userInRoom[room].push(username)};

    socket.emit("message:joined", { status: true, message: "success" });
    socket.to(room).emit("message:greeting", `${username} 🎨 has entered!`);
    io.to(room).emit("room:info" , {users:userInRoom[room] });

    // Notify new user if a game is running or joinable
    const game = activeGames[room];
    if (game) {
      if (game.phase === "joining") {
        socket.emit("message:receive", {
          type: "command",
          user: "BOT",
          content: `🎮 A HeadOrTail game is open! Type !j to join within 30s.`
        });
      } else {
        socket.emit("message:receive", {
          type: "command",
          user: "BOT",
          content: `⚠️ A HeadOrTail game is currently running.`
        });
      }
    }
  });

    socket.on("message:send", (data)=>{
        if(data.content.startsWith("/") || data.content.startsWith("!")){
            handleCommand(data , socket, io,activeGames);
        }
        else io.to(data.user.room).emit("message:receive" , {type:"message",...data});
    });

    socket.on("message:typing", (data)=>{
        socket.to(data.room).emit("message:user_typing" , data);
    });

    socket.on("room:leave", ({room,username})=>{
        socket.to(room).emit("message:greeting",`${username} has left!`);
        userInRoom[room] = userInRoom[room].filter((item) => item!==username);
        io.to(room).emit("room:info" , {users:userInRoom[room] });

    });

    socket.on("disconnect", () =>{ 
        const userData = userRooms[socket.id];
        if (userData) {
            socket.to(userData.room).emit("message:greeting", `${userData.username} has left!`);
            delete userRooms[socket.id]; // Clean up the stored data
            userInRoom[userData.room] = userInRoom[userData.room].filter((item) => item!==userData.username);
            io.to(userData.room).emit("room:info" , {users:userInRoom[userData.room] });
        }
    console.log(`user disconnected, ${socket.id}`)});
});
};

module.exports ={ 
    socketHandler
}