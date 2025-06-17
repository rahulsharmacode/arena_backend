const jwt = require("jsonwebtoken");
const { User } = require("../schema/user.schema");
const auth = async (req,res,next) => {

    const token = req.headers["authorization"]?.split(" ")[1];
    if(!token) res.status(401).json({status:false,message:'access token missing'})
    try{
        const verifyToken = jwt.decode(token ,process.env.SECRET_KEY)
        const findUser = await User.findById(verifyToken._id);
        req["rootUser"] = findUser;
        req["rootId"] = verifyToken._id;
        next();
    }
    catch (err) { return res.status(500).json({ status: false, error: err }) };
};

module.exports = {auth}