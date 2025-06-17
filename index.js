const express = require("express");
require("dotenv").config();
require("./db/config");
const http = require("http");
const app = express();
const {userRouter} = require("./router/index.router");
const {accessLogger,errorLogger} = require("./helper/logger.function");

app.use(express.json());
app.use(express.static("./public/"));
app.use(accessLogger);
app.use(errorLogger);

app.use('/api/v1',userRouter);

/* base api */
app.get("/", (req,res) => res.status(200).json({status:true,message:"server tested ok!"}) );


/* server and socket */
const server = http.createServer(app);


server.listen(process.env.PORT||3000 , ()=> console.log( `server running at port ${process.env.PORT}`));