const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const { User } = require("../schema/user.schema");
const { Otp } = require("../schema/otp.schema");
const { sendTemplateEmail } = require("../helper/mail.function");


const loginController = async (req,res) =>{
    const {username,password,email} = req.body || {};
    if ((!username && !email) || !password) return res.status(406).json({ status: false, message: `failed, username/email and password is required` });
    try{
        const findData = await User.findOne({ $or : [
            {username},{email}
        ] });
        if (!findData) return res.status(406).json({ status: false, message: `failed, ${username?"username":"email"} not found` });

        if(!await bcrypt.compare(password,findData.password)) return res.status(406).json({ status: false, message: `failed, password didnot match` });
        const token = jwt.sign({
                _id:findData._id,
                username : findData.username
            },process.env.SECRET_KEY, {expiresIn:30000});
           
         return res.status(200).json({ status: true, message: `success`,token,data:{_id:findData._id,email:findData.email,username:findData.username} });
    }
    catch(err){
       return res.status(500).json({status:false,error:err})
    }
};

const forgetController = async (req,res) =>{
    const {email} = req.body || {};
    if (!email) return res.status(406).json({ status: false, message: `failed, email is required` });
    try{
        const findData = await User.findOne({ email });
        if (!findData) return res.status(406).json({ status: false, message: `failed, email not found` });
         const otp = Math.floor(1000 + Math.random() * 9000);
        const expiresIn = Date.now() + 5 * 60 * 1000;
        await Otp.create({
            otp:otp,
            expiresIn:expiresIn,
            type:"forgetpassword",
            user:findData._id
        });
        sendTemplateEmail({
             data : {
                 email:email,
                 expiryMinutes: Math.ceil((expiresIn - Date.now()) / (1000 * 60)),
                 otp,
             },
             subject : `Otp code for verification`,
             template:"otp"
         });
        return res.status(200).json({ status: true, message: `success`});
    }
    catch(err){
       return res.status(500).json({status:false,error:err})
    }
};

const verifyOtpController = async (req,res) =>{
    const {otp,type,email} = req.body || {};
    if (!otp || !type || !email) return res.status(406).json({ status: false, message: `failed, otp,user and type is required` });
    if(!["forgetpassword","emailverification"].includes(type)) return res.status(406).json({ status: false, message: `failed, type is invalid` });
    try{
        const findData = await User.findOne({ email });
        if (!findData) return res.status(406).json({ status: false, message: `failed, email not found` });

        const findOtpData = await Otp.findOne({ email , type });
        if (!findOtpData) return res.status(404).json({ status: false, message: `failed, otp not found with email and type` });

        const currentDate = Date.now();
        if(currentDate <= findOtpData.expiresIn && otp !== findOtpData.otp){
            return res.status(404).json({ status: false, message: `failed, otp didnot matched!` });
        }

        
        await Otp.deleteOne({ email , type });
         if(currentDate > findOtpData.expiresIn){
            return res.status(404).json({ status: false, message: `failed, otp expired!` });
        }

        if(currentDate <= findOtpData.expiresIn && otp === findOtpData.otp && type==="emailverification"){
            findData.isEmailVerified = true;
            await findData.save();
            return res.status(200).json({ status: true, message: `success` });
        }
        if(currentDate <= findOtpData.expiresIn && otp === findOtpData.otp && type==="forgetpassword"){
            const token = jwt.sign({email:email,type},process.env.SECRET_KEY,{expiresIn : "5m"});
            return res.status(200).json({ status: true, message: `success`,token });
        }

        return res.status(401).json({ status: false, message: `failed, otp details mis-matched `});
    }
    catch(err){
       return res.status(500).json({status:false,error:err})
    }
};

const resendOtpController = async (req,res) =>{
    const {type,email} = req.body || {};
    if (!type || !email) return res.status(406).json({ status: false, message: `failed, otp,user and type is required` });
    if(!["forgetpassword","emailverification"].includes(type)) return res.status(406).json({ status: false, message: `failed, type is invalid` });
    try{
        const findData = await User.findOne({ email });
        if (!findData) return res.status(406).json({ status: false, message: `failed, email not found` });
        await Otp.deleteMany({ email , type });

        const otp = Math.floor(1000 + Math.random() * 9000);
        const expiresIn = Date.now() + 5 * 60 * 1000;
        await Otp.create({
            otp:otp,
            expiresIn:expiresIn,
            type,
            user:findData._id,
            email
        });
        sendTemplateEmail({
             data : {
                 email:email,
                 expiryMinutes: Math.ceil((expiresIn - Date.now()) / (1000 * 60)),
                 otp,
             },
             subject : `Otp code for verification`,
             template:"otp"
         });


        return res.status(200).json({ status: true, message: `success`});
    }
    catch(err){
       return res.status(500).json({status:false,error:err})
    }
};

const changePasswordController = async (req,res) =>{
    const {token,password,confirmPassword} = req.body || {};
    if (!token || !password || !confirmPassword) return res.status(406).json({ status: false, message: `failed, token,password and confirm password is required` });
    if (password!==confirmPassword) return res.status(406).json({ status: false, message: `failed,password and confirm password does not match.` });

    try{
        let verifyToken = jwt.decode(token,process.env.SECRET_KEY);
        const findData = await User.findOne({ email:verifyToken.email });
        if (!findData) return res.status(406).json({ status: false, message: `failed, email not found` });
        let hashPassword = await bcrypt.hash(password,10);
        findData.password = hashPassword;
        findData.save();
        return res.status(200).json({ status: true, message: `success`});
    }
    catch(err){
       return res.status(500).json({status:false,error:err})
    }
};

module.exports = {
    loginController,
    forgetController,
    verifyOtpController,
    resendOtpController,
    changePasswordController
}

