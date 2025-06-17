import express from "express";
import { ensureAuthenticated } from "../middleware/authMiddleware.js";
import { sendMessage } from "../controllers/messageControllers.js";

const router = express.Router();

router.route("/").post(ensureAuthenticated,sendMessage);
// router.route("/:chatId").post(ensureAuthenticated,allMessages);

export default router;