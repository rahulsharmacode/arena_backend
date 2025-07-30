const express = require("express");
require("dotenv").config();
require("./db/config");
const session = require('express-session');
const cors = require("cors");
const http = require("http");
const app = express();
const {userRouter} = require("./router/index.router");
const {accessLogger,errorLogger} = require("./helper/logger.function");
const passport = require("passport");
const cookieParser = require('cookie-parser');
const { Server } = require("socket.io");
const { socketHandler } = require("./socket/connection.socket");

app.use(express.json());
app.use(cors({
    origin : "*"
}));
app.use(cookieParser());
app.use(session({
  secret: process.env.SECRET_KEY,   // Change this in production!
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));
app.use(passport.initialize());
app.use(passport.session());
require("./helper/passport");

app.use(express.static("./public/"));
app.use(accessLogger);
app.use(errorLogger);

app.use('/api/v1',userRouter);

/* base api */
app.get("/", (req,res) => res.status(200).json({status:true,message:"server tested ok!"}) );


/* server and socket */
const server = http.createServer(app);


const io = new Server(server, {
    cors : {
        origin : "*"
    }
});
socketHandler(io);

server.listen(process.env.PORT||3000 , ()=> console.log( `server running at port ${process.env.PORT}`));