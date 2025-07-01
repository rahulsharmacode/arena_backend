const express = require("express");
const userRouter = new express.Router();
const multer = require('multer');


const { getUserController,
  postUserController,
  putUserController,
  patchUserController,
  deleteUserController,
  getByIdUserController } = require("../controller/user.controller");

const { loginController, forgetController, verifyOtpController, resendOtpController, changePasswordController } = require("../controller/auth.controller");
const { auth } = require("../middelware/auth.middelware");
const { getArenaController, postArenaController, getByIdArenaController, putArenaController, patchArenaController, deleteArenaController } = require("../controller/arena.controller");
const { likeArenaController } = require("../controller/areanareact.controller");
const passport = require("passport");
const { linkedinLog, linkedinPreLog, twitterPreLog, twitterLog } = require("../helper/oauth.direct.function");
const {upload} = require("../helper/s3.function");
const { verifyImage } = require("../controller/tesseract.controller");
// ============================ auth routes ============================ //
userRouter.route('/auth/login')
  .post(loginController);
userRouter.route('/auth/register')
  .post(postUserController);
userRouter.route('/auth/forgetpassword')
  .post(forgetController)
userRouter.route('/auth/verifyotp')
  .post(verifyOtpController)
userRouter.route('/auth/resendotp')
  .post(resendOtpController)
userRouter.route('/auth/changepassword')
  .post(changePasswordController)

// ============================ user routes ============================ //
userRouter.route('/user')
  .get(auth, getUserController)
  .post(postUserController);
userRouter.route('/user/:id')
  .get(auth, getByIdUserController)
  .put(auth,upload.single('image'), putUserController)
  .patch(auth,upload.single('image'), patchUserController)
  .delete(auth, deleteUserController);

// ============================ arena routes ============================ //
userRouter.route('/arena')
  .get(auth, getArenaController)
  .post(auth, postArenaController);
userRouter.route('/arena/:id')
  .get(getByIdArenaController)
  .put(auth, putArenaController)
  .patch(auth, patchArenaController)
  .delete(auth, deleteArenaController);

// ============================ arena like/unlike/views ============================ //
userRouter.route('/arena/like/:id')
  .get(auth, likeArenaController)


// Routes
userRouter.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

userRouter.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect(`http://localhost:4000/profile?modal=update&ms=${Date.now()}`); // frontend redirect
  }
);



const storage = multer.memoryStorage(); // Store files in memory as buffers
const upload2 = multer({ storage: storage });

// userRouter.get("/auth/twitter", passport.authenticate("twitter"));
// userRouter.get("/auth/twitter/callback", passport.authenticate("twitter", {
//   failureRedirect: "/login",

// }), (req, res) => {
//      res.redirect(`http://localhost:4000/profile?modal=update&ms=${Date.now()}`); // frontend redirect
// });


userRouter.get("/auth/facebook", passport.authenticate("facebook"));
userRouter.get("/auth/facebook/callback", passport.authenticate("facebook", {
  failureRedirect: "/login",

}), (req, res) => {
     res.redirect(`http://localhost:4000/profile?modal=update&ms=${Date.now()}`); // frontend redirect
});

userRouter.get("/auth/discord", passport.authenticate("discord"));
userRouter.get("/auth/discord/callback", passport.authenticate("discord", {
  failureRedirect: "/login",

}), (req, res) => {
  res.redirect(`http://localhost:4000/profile?modal=update&ms=${Date.now()}`); // frontend redirect
});

userRouter.get("/auth/github", passport.authenticate("github"));
userRouter.get("/auth/github/callback", passport.authenticate("github", {
  failureRedirect: "/login",

}), (req, res) => {
  res.redirect(`http://localhost:4000/profile?modal=update&ms=${Date.now()}`); // frontend redirect
});





userRouter.get('/auth/twitter', twitterPreLog);
userRouter.get('/auth/twitter/callback', twitterLog);


userRouter.get('/auth/linkedin', linkedinPreLog);
userRouter.get('/auth/linkedin/callback', linkedinLog);


userRouter.post('/verify-image',auth, upload2.single('screenshot'), verifyImage);


module.exports = {
  userRouter
}

