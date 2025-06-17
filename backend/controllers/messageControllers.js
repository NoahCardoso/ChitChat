import asyncHandler from "express-async-handler";
import db from "../config/db.js";

export const sendMessage = asyncHandler(async (req, res) => {
  const {content, chatId} = req.body;

  if(!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  try {
    const {rows} = await db.query("INSERT INTO messages (sender, content, chat) VALUES ($1, $2, $3) RETURNING id",[req.user.id, content, chatId]);
    const id = rows[0].id;
    console.log(id);
    //update chat with last message
    const {rows: chat} = await db.query("UPDATE chats SET latestmessage = $1, sender = $2 WHERE id = $3 RETURNING *",[id, req.user.id, chatId]);
    const userResult = await db.query(
      `SELECT u.*
       FROM users u
       INNER JOIN chat_users cu ON cu.user_id = u.id
       WHERE cu.chat_id = $1`,
      [chatId]
    );
    res.status(200).json({
      chat: chat[0],
      users: userResult.rows,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }

});
