import asyncHandler from "express-async-handler";
import db from "../config/db.js";
import bcrypt from "bcrypt";

export const accessChat = asyncHandler(async(req,res) => {
  const userId = req.body.userId;
  if(!userId){
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  const possibleChats = await db.query(
  `SELECT c.*
   FROM chats c
   JOIN (
     SELECT chat_id
     FROM chat_users
     WHERE user_id IN ($1, $2)
     GROUP BY chat_id
     HAVING COUNT(DISTINCT user_id) = 2 AND COUNT(*) = 2
   ) cu ON c.id = cu.chat_id
   WHERE c.isgroupchat = false`,
  [req.user.id, userId]
  );
  if(possibleChats.rows.length > 0){
    res.send(possibleChats.rows[0]);
  } else {
    const newChat = await db.query("INSERT INTO chats (chatname, isgroupchat, groupadmin) VALUES ($1, $2, $3) RETURNING *",["sender",false,req.user.id]);
    const newChatId = newChatId.rows[0].id;
    if(newChatId){
      await db.query("INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)",[newChatId,req.user.id]);
      await db.query("INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)",[newChatId,userId]);
      res.status(200).send(newChat);
    } else {
      res.status(500);
    }
    
  }
});

export const fetchChats = asyncHandler(async(req,res) => {
  const { rows } = await db.query(
  `SELECT 
  c.id AS chat_id,
  c.chatname,
  c.isgroupchat,
  c.updated_at,
  u.id AS user_id,
  u.name,
  u.email
  FROM chats c
  JOIN chat_users cu1 ON cu1.chat_id = c.id AND cu1.user_id = $1
  JOIN chat_users cu2 ON cu2.chat_id = c.id
  JOIN users u ON u.id = cu2.user_id;`, [req.user.id]);

  const chatsMap = {};

  for (const row of rows) {
    const chatId = row.chat_id;

    if (!chatsMap[chatId]) {
      chatsMap[chatId] = {
        id: chatId,
        chatname: row.chatname,
        isgroupchat: row.isgroupchat,
        updated_at: row.updated_at,
        users: [],
      };
    }

    chatsMap[chatId].users.push({
      id: row.user_id,
      name: row.name,
      email: row.email,
    });
  }

  const chats = Object.values(chatsMap).sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
  );

  res.status(200).json(chats);
  
});
// should be try catch
export const createGroupChat = asyncHandler(async(req, res) => {
  if(!req.body.users || !req.body.name){
    return res.status(400).send({ message: "Please Fill all the feilds" });
  }
  let users = JSON.parse(req.body.users);
  const result = await db.query("INSERT INTO chats (chatName, isgroupchat, groupadmin) VALUES ($1, true, $2) RETURNING *",[req.body.name, req.user.id]);
  if(result.rows.length > 0){
    const chatId = result.rows[0].id;
    users.push(req.user.id);
    for (const user of users) {
      await db.query("INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)",[chatId,user]);
    };
    const fullUsers = await Promise.all(users.map(async(user) => {
      const {rows} = await db.query("SELECT * FROM users WHERE id = $1",[user]);
      return rows[0];
    }));
    
    
    
    res.status(200).json({
      
      id: chatId,
      chatname: result.rows[0].chatname,
      isgroupchat: true,
      groupadmin: req.user,
      updated_at: result.rows[0].updated_at,
      created_at: result.rows[0].created_at,
      users: fullUsers,
    
    });
  }

});

export const renameGroup = asyncHandler(async(req, res) => {
  const { chatId, chatName } = req.body;
  const {rows: chat} = await db.query("UPDATE chats SET chatname = $1 WHERE id = $2 RETURNING *",[chatName, chatId]);
  const userResult = await db.query(
      `SELECT u.*
       FROM users u
       INNER JOIN chat_users cu ON cu.user_id = u.id
       WHERE cu.chat_id = $1`,
      [chatId]
    );
  res.status(200).json({
      ...chat,
      users: userResult.rows,
    });
});

export const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  await db.query("INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)",[chatId, userId]);
  const {rows: chat} = await db.query("SELECT * FROM chats WHERE id = $1",[chatId]);
  const userResult = await db.query(
      `SELECT u.*
       FROM users u
       INNER JOIN chat_users cu ON cu.user_id = u.id
       WHERE cu.chat_id = $1`,
      [chatId]
    );
  res.status(200).json({
      ...chat,
      users: userResult.rows,
    });
});

export const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  await db.query("DELETE FROM chat_users WHERE chat_id = $1 AND user_id = $2",[chatId, userId]);
  const {rows: chat} = await db.query("SELECT * FROM chats WHERE id = $1",[chatId]);
  const userResult = await db.query(
      `SELECT u.*
       FROM users u
       INNER JOIN chat_users cu ON cu.user_id = u.id
       WHERE cu.chat_id = $1`,
      [chatId]
    );
  res.status(200).json({
      ...chat,
      users: userResult.rows,
    });
});