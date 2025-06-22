import asyncHandler from "express-async-handler";
import db from "../config/db.js";

export const sendMessage = asyncHandler(async (req, res) => {
  const {content, chatId} = req.body;

  if(!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  try {
    const {rows} = await db.query("INSERT INTO messages (sender, content, chat) VALUES ($1, $2, $3) RETURNING *",[req.user.id, content, chatId]);
    const message = rows[0];
    //update chat with last message
    let {rows: chat} = await db.query("UPDATE chats SET latestmessage = $1, sender = $2 WHERE id = $3 RETURNING *",[message.id, req.user.id, chatId]);
    chat = chat[0];
    const userResult = await db.query(
      `SELECT u.*
       FROM users u
       INNER JOIN chat_users cu ON cu.user_id = u.id
       WHERE cu.chat_id = $1`,
      [chatId]
    );
    let {rows: sender} = await db.query("SELECT * FROM users WHERE id = $1",[chat.sender]);
    sender = sender[0];
    res.status(200).json({
      ...message,
      sender: sender,
      chat: {
        id: chat.id,
        chatname: chat.chatname,
        isgroupchat: chat.isgroupchat,
        groupadmin: chat.groupadmin,
        latestmessage: message,
        sender: sender,
        users: userResult.rows,
      }
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }

});

export const allMessages = asyncHandler(async (req, res) => {
  try {
    // 1. Get all messages and embed sender
    const { rows: messages } = await db.query(
      `SELECT 
        m.*, 
        row_to_json(u) AS sender
      FROM messages m
      JOIN users u ON m.sender = u.id
      WHERE m.chat = $1
      ORDER BY m.created_at ASC`,
      [req.params.chatId]
    );

    // 2. Get chat object
    const { rows: chatRows } = await db.query("SELECT * FROM chats WHERE id = $1", [req.params.chatId]);
    const chat = chatRows[0];

    // 3. Get users in the chat
    const { rows: users } = await db.query(
      `SELECT u.*
      FROM users u
      INNER JOIN chat_users cu ON cu.user_id = u.id
      WHERE cu.chat_id = $1`,
      [req.params.chatId]
    );

    // 4. Embed the same chat object into each message
    const messagesWithChat = messages.map(m => ({
      ...m,
      chat: {
        id: chat.id,
        chatname: chat.chatname,
        isgroupchat: chat.isgroupchat,
        groupadmin: chat.groupadmin,
        users: users
      }
    }));

    // 5. Return array of messages (each with chat & sender)
    res.json(messagesWithChat);

  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});
