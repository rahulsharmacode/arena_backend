const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/arena").then(()=> console.log(`db connected`)).catch((err) => `db failed to connect, error: ${err}`)