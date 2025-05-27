import express from "express";
import {ensureAuthenticated} from "../middleware/authMiddleware.js";
import {accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup} from "../controllers/chatControllers.js";
const router = express.Router();

router.route("/").post(ensureAuthenticated, accessChat);
router.route("/").get(ensureAuthenticated, fetchChats); 
router.route("/group").post(ensureAuthenticated, createGroupChat); 
router.route("/group-rename").put(ensureAuthenticated, renameGroup); 
router.route("/group-remove").put(ensureAuthenticated, removeFromGroup); 
router.route("/group-add").put(ensureAuthenticated, addToGroup); 

export default router;