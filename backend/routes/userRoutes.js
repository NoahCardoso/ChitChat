import express from "express";
import userController from "../controllers/userControllers.js";
const router = express.Router();

router.route("/").post(userController.registerUser);
router.post("/login",userController.authUser);

export default router;