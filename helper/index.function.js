const { default: mongoose } = require("mongoose");

const getRequired = (data, match) => {
    const requiredFields = ['username', 'password'];
    const missing = requiredFields.filter(field => !req.body[field]);
    return !missing.length ?  false : `Missing required fields: ${missing.join(', ')}`
};


const getUserGroupedRoom = (data) => {
    return  Object.entries(data).reduce((acc, [id, { room, username }]) => {
  if (!acc[room]) acc[room] = [];
  acc[room].push({ id, username });
  return acc;
}, {});
}


const getObjectId = (id) => {return mongoose.Types.ObjectId(id)}


function normalizeProfileUrl(url) {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}

module.exports ={
    getUserGroupedRoom,
    getObjectId,
    normalizeProfileUrl
}