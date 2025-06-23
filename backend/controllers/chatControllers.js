import asyncHandler from "express-async-handler";
import db from "../config/db.js";
import bcrypt from "bcrypt";

export const accessChat = asyncHandler(async (req, res) => {
  const userId = req.body.userId;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  // 1. Try to find existing one-to-one chat
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

  let chat;
  if (possibleChats.rows.length > 0) {
    chat = possibleChats.rows[0];
  } else {
    // 2. Create new chat
    const newChatResult = await db.query(
      "INSERT INTO chats (chatname, isgroupchat, groupadmin) VALUES ($1, $2, $3) RETURNING *",
      ["sender", false, req.user.id]
    );

    chat = newChatResult.rows[0];

    await db.query("INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)", [chat.id, req.user.id]);
    await db.query("INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)", [chat.id, userId]);
  }

  // 3. Get users in chat
  const { rows: users } = await db.query(
    `SELECT u.id, u.name, u.email, u.pic
     FROM users u
     JOIN chat_users cu ON cu.user_id = u.id
     WHERE cu.chat_id = $1`,
    [chat.id]
  );

  // 4. Get latest message + sender (if exists)
  let latestMessage = null;
  let sender = null;

  if (chat.latestmessage) {
    const { rows: latestMsgRows } = await db.query(
      `SELECT m.id, m.content, m.sender, u.* AS sender
       FROM messages m
       JOIN users u ON m.sender = u.id
       WHERE m.id = $1`,
      [chat.latestmessage]
    );

    if (latestMsgRows.length > 0) {
      latestMessage = {
        id: latestMsgRows[0].id,
        content: latestMsgRows[0].content,
        sender: latestMsgRows[0].sender,
      };
      sender = latestMsgRows[0].sender
    }
  }

  // 5. Return full chat object
  res.status(200).json({
    ...chat,
    users,
    latestmessage: latestMessage,
    sender,
  });
});



export const fetchChats = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT 
      c.id AS chat_id,
      c.chatname,
      c.isgroupchat,
      c.groupadmin,
      c.created_at,
      c.updated_at,
      c.sender AS chat_sender_id,
      u.id AS user_id,
      u.name,
      u.email,
      u.pic,
      m.id AS message_id,
      m.content AS message_content,
      mu.id AS message_sender_id,
      mu.name AS message_sender_name
    FROM chats c
    JOIN chat_users cu1 ON cu1.chat_id = c.id AND cu1.user_id = $1
    JOIN chat_users cu2 ON cu2.chat_id = c.id
    JOIN users u ON u.id = cu2.user_id
    LEFT JOIN messages m ON m.id = c.latestmessage
    LEFT JOIN users mu ON mu.id = m.sender`,
    [req.user.id]
  );

  const chatsMap = {};

  for (const row of rows) {
    const chatId = row.chat_id;

    if (!chatsMap[chatId]) {
      chatsMap[chatId] = {
        id: chatId,
        chatname: row.chatname,
        isgroupchat: row.isgroupchat,
        groupadmin: row.groupadmin,
        created_at: row.created_at,
        updated_at: row.updated_at,
        sender: row.chat_sender_id ? { id: row.chat_sender_id } : null,
        users: [],
        latestmessage: row.message_id
          ? {
              id: row.message_id,
              content: row.message_content,
              sender: {
                id: row.message_sender_id,
                name: row.message_sender_name,
                pic: row.pic,
              },
            }
          : null,
      };
    }

    // Avoid duplicate users
    if (!chatsMap[chatId].users.find((u) => u.id === row.user_id)) {
      chatsMap[chatId].users.push({
        id: row.user_id,
        name: row.name,
        email: row.email,
        pic: row.pic,
      });
    }
  }

  // Fetch full sender objects
  const senderIds = Array.from(
    new Set(
      Object.values(chatsMap)
        .map((chat) => chat.sender?.id)
        .filter(Boolean)
    )
  );

  let sendersMap = {};
  if (senderIds.length > 0) {
    const { rows: senderRows } = await db.query(
      "SELECT * FROM users WHERE id = ANY($1::int[])",
      [senderIds]
    );
    for (const sender of senderRows) {
      sendersMap[sender.id] = sender;
    }
  }

  // Final formatting
  const chats = Object.values(chatsMap)
    .map((chat) => ({
      ...chat,
      sender: chat.sender?.id ? sendersMap[chat.sender.id] : null,
    }))
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  res.status(200).json(chats);
});


export const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please fill all the fields" });
  }

  let users = JSON.parse(req.body.users);
  const result = await db.query(
    "INSERT INTO chats (chatname, isgroupchat, groupadmin, sender) VALUES ($1, true, $2, $2) RETURNING *",
    [req.body.name, req.user.id]
  );

  const chat = result.rows[0];
  const chatId = chat.id;

  users.push(req.user.id);
  for (const user of users) {
    await db.query("INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)", [chatId, user]);
  }

  const fullUsers = await Promise.all(
    users.map(async (user) => {
      const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [user]);
      return rows[0];
    })
  );

  res.status(200).json({
    
    id: chatId,
    chatname: chat.chatname,
    isgroupchat: true,
    groupadmin: chat.groupadmin,
    updated_at: chat.updated_at,
    created_at: chat.created_at,
    sender: null,
    users: fullUsers,
    latestmessage: null,
  });
});


export const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;
  const { rows: chatRows } = await db.query("UPDATE chats SET chatname = $1 WHERE id = $2 RETURNING *", [chatName, chatId]);

  // Get users of chat
  const { rows: userResult } = await db.query(
    `SELECT *
     FROM users u
     INNER JOIN chat_users cu ON cu.user_id = u.id
     WHERE cu.chat_id = $1`,
    [chatId]
  );

  // Get latest message + sender
  let latestMessage = null;
  let sender = null;
  if (chatRows[0].latestmessage) {
    const { rows: latestMsgRows } = await db.query(
      `SELECT m.id, m.content, u.* AS sender
       FROM messages m
       JOIN users u ON m.sender = u.id
       WHERE m.id = $1`,
      [chatRows[0].latestmessage]
    );
    if (latestMsgRows.length > 0) {
      latestMessage = {
        ...latestMsgRows[0],
      };
      sender = latestMsgRows[0].sender;
    }
  }

  res.status(200).json({
    ...chatRows[0],
    users: userResult,
    latestmessage: latestMessage,
    sender,
  });
});

export const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  await db.query("INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)", [chatId, userId]);

  const { rows: chatRows } = await db.query("SELECT * FROM chats WHERE id = $1", [chatId]);
  const { rows: userResult } = await db.query(
    `SELECT *
     FROM users u
     INNER JOIN chat_users cu ON cu.user_id = u.id
     WHERE cu.chat_id = $1`,
    [chatId]
  );

  // Get latest message + sender
  let latestMessage = null;
  let sender = null;
  if (chatRows[0].latestmessage) {
    const { rows: latestMsgRows } = await db.query(
      `SELECT m.id, m.content, u.* AS sender
       FROM messages m
       JOIN users u ON m.sender = u.id
       WHERE m.id = $1`,
      [chatRows[0].latestmessage]
    );
    if (latestMsgRows.length > 0) {
      latestMessage = {
        ...latestMsgRows[0],
      };
      sender = latestMsgRows[0].sender;
    }
  }

  res.status(200).json({
    ...chatRows[0],
    users: userResult,
    latestmessage: latestMessage,
    sender,
  });
});


export const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  await db.query("DELETE FROM chat_users WHERE chat_id = $1 AND user_id = $2", [chatId, userId]);

  const { rows: chatRows } = await db.query("SELECT * FROM chats WHERE id = $1", [chatId]);
  const { rows: userResult } = await db.query(
    `SELECT *
     FROM users u
     INNER JOIN chat_users cu ON cu.user_id = u.id
     WHERE cu.chat_id = $1`,
    [chatId]
  );

  // Get latest message + sender
  let latestMessage = null;
  let sender = null;
  if (chatRows[0].latestmessage) {
    const { rows: latestMsgRows } = await db.query(
      `SELECT m.id, m.content, u.* AS sender
       FROM messages m
       JOIN users u ON m.sender = u.id
       WHERE m.id = $1`,
      [chatRows[0].latestmessage]
    );
    if (latestMsgRows.length > 0) {
      latestMessage = {
        ...latestMsgRows[0],
      };
      sender = latestMsgRows[0].sender
    }
  }

  res.status(200).json({
    ...chatRows[0],
    users: userResult,
    latestmessage: latestMessage,
    sender,
  });
});
