import express from "express";
import { ensureAuthenticated } from "../middleware/authMiddleware.js";
import { sendMessage, allMessages } from "../controllers/messageControllers.js";

const router = express.Router();

router.route("/").post(ensureAuthenticated,sendMessage);
router.route("/:chatId").get(ensureAuthenticated,allMessages);

export default router;