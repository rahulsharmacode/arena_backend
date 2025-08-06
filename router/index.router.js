const express = require("express");
const userRouter = new express.Router();
const multer = require('multer');


const { getUserController,
  postUserController,
  putUserController,
  patchUserController,
  deleteUserController,
  getByIdUserController, 
  getUsersController,
  getByUsernameUserController} = require("../controller/user.controller");

const { loginController, forgetController, verifyOtpController, resendOtpController, changePasswordController } = require("../controller/auth.controller");
const { auth } = require("../middelware/auth.middelware");
const { getArenaController, postArenaController, getByIdArenaController, putArenaController, patchArenaController, deleteArenaController, patchArenaGuestController, patchArenaBookmarksController, patchArenaLikeController, postArenaNewConversationController } = require("../controller/arena.controller");
const { likeArenaController } = require("../controller/areanareact.controller");
const passport = require("passport");
const { linkedinLog, linkedinPreLog, twitterPreLog, twitterLog } = require("../helper/oauth.direct.function");
const {upload} = require("../helper/s3.function");
const { verifyImage } = require("../controller/tesseract.controller");
const { getArenaMessagesController } = require("../controller/messages.controller");
const { getFeedController, getFeedUserController } = require("../controller/feeds.controller");
const { postArenaCommentController, patchArenaCommentController, deleteArenaCommentController, getArenaCommentController } = require("../controller/comment.controller");
const { getNotificationController, patchNotificationController, deleteNotificationController, patchNotificationReadAllController } = require("../controller/notification.controller");
const { getFollowController, postFollowController } = require("../controller/follow.controller");
const { postArenaViewController } = require("../controller/views.controller");
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
  userRouter.route('/users')
  .get(auth, getUsersController)
userRouter.route('/user/:id')
  .get(auth, getByIdUserController)
  .put(auth,upload.single('image'), putUserController)
  .patch(auth,upload.single('image'), patchUserController)
  .delete(auth, deleteUserController);

userRouter.route('/user/profile/:username')
  .get(auth, getByUsernameUserController)

// ============================ arena routes ============================ //
userRouter.route('/arena')
  .get(auth, getArenaController)
  .post(auth, postArenaController);
  userRouter.route('/arena/new-conversation')
  .post(auth, postArenaNewConversationController);
userRouter.route('/arena/:id')
  .get(getByIdArenaController)
  .put(auth, putArenaController)
  .patch(auth, patchArenaController)
  .delete(auth, deleteArenaController);
  userRouter.route('/arena/guest-accept/:id')
  .patch(auth, patchArenaGuestController)

  userRouter.route('/arena/bookmarks/:id')
  .patch(auth, patchArenaBookmarksController)

    userRouter.route('/arena/like/:id')
  .patch(auth, patchArenaLikeController)

      
// ============================ arena comments ============================ //
  userRouter.route('/arena/comment/:id')
  .get(auth, getArenaCommentController)
  .post(auth, postArenaCommentController)
  userRouter.route('/arena/comment/:id')
  .patch(auth, patchArenaCommentController)
  .delete(auth, deleteArenaCommentController)


  // ============================ arena views ============================ //
  userRouter.route('/arena/view/:id')
  .post(auth, postArenaViewController)

// ============================ home feeds routes ============================ //
userRouter.route('/feeds')
  .get(auth, getFeedController)
  userRouter.route('/feeds/user/:id')
  .get(auth, getFeedUserController)



  // ============================ follow/following routes ============================ //
userRouter.route('/follows/:userId')
  .get(auth, getFollowController)
  userRouter.route('/follows/:userId')
  .post(auth, postFollowController)


  // ============================ messages routes ============================ //
userRouter.route('/arena/messages/:roomId')
  .get(auth, getArenaMessagesController);


  // ============================ arena notification ============================ //
userRouter.route('/notification')
  .get(auth, getNotificationController);
userRouter.route('/notification/:id')
  .patch(auth, patchNotificationController)
  .delete(auth, deleteNotificationController);
userRouter.route('/notification/mark-all-read')
  .post(auth, patchNotificationReadAllController)


// ============================ arena like/unlike/views ============================ //
userRouter.route('/arena/likeby/:postId')
  .get( likeArenaController)


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

