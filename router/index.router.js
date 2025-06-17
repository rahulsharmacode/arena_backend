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

// ============================ auth routes ============================ //
userRouter.route('/auth/login')
  .post(loginController);
userRouter.route('/auth/register')
  .post((req, res) => {

  })
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
  .get(getUserController)
  .post(postUserController);
userRouter.route('/user/:id')
  .get(auth,getByIdUserController)
  .put(auth,putUserController)
  .patch(auth,patchUserController)
  .delete(auth,deleteUserController);

  // ============================ arena routes ============================ //
userRouter.route('/arena')
  .get(getArenaController)
  .post(auth,postArenaController);
userRouter.route('/arena/:id')
  .get(getByIdArenaController)
  .put(auth,putArenaController)
  .patch(auth,patchArenaController)
  .delete(auth,deleteArenaController);


module.exports = {
  userRouter
}

