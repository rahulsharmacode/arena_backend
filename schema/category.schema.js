const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
name : {type:String,minLength:1,required:[true, 'name is required'],unique:true},
},{
    timestamps : true
});

const Category = mongoose.model("categories",categorySchema);
module.exports = {Category};