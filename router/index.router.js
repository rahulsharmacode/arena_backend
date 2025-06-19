const express = require("express");
const userRouter = new express.Router();

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
  .get(auth,getUserController)
  .post(postUserController);
userRouter.route('/user/:id')
  .get(auth, getByIdUserController)
  .put(auth, putUserController)
  .patch(auth, patchUserController)
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
    res.redirect('http://localhost:4000/home'); // frontend redirect
  }
);


userRouter.get("/auth/x", passport.authenticate("twitter"));
userRouter.get("/auth/x/callback", passport.authenticate("twitter", {
  failureRedirect: "/login",
  
}), (req, res) => {
     res.redirect('http://localhost:4000/home'); // frontend redirect
});


userRouter.get("/auth/linkedin", passport.authenticate("linkedin"));
userRouter.get("/auth/linkedin/callback", passport.authenticate("linkedin", {
  failureRedirect: "/login",
  
}), (req, res) => {
     res.redirect('http://localhost:4000/home'); // frontend redirect
});

userRouter.get("/auth/discord", passport.authenticate("discord"));
userRouter.get("/auth/discord/callback", passport.authenticate("discord", {
  failureRedirect: "/login",
  
}), (req, res) => {
     res.redirect('http://localhost:4000/home'); // frontend redirect
});




module.exports = {
  userRouter
}

