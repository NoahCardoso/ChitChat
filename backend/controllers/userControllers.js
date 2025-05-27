import asyncHandler from "express-async-handler";
import db from "../config/db.js";
import bcrypt from "bcrypt";


const saltRounds = 10;

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  // Input validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please enter all the fields");
  }

  // Check if user already exists
  const result = await db.query("SELECT email FROM users WHERE email = $1", [email]);

  if (result.rows.length > 0) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Insert new user
  const insertResult = await db.query(
    "INSERT INTO users (name, email, password, pic) VALUES ($1, $2, $3, $4) RETURNING id",
    [name, email, await bcrypt.hash(password, saltRounds), pic]
  );

  const insertedUserId = insertResult.rows[0].id;

  if (insertedUserId) {
    res.status(201).json({
      _id: insertedUserId,
      name,
      email,
      pic,
    });
  } else {
    res.status(400);
    throw new Error("Failed to create the user");
  }
});

//auth

export const allUsers = asyncHandler(async (req, res) => {
  
  const search = req.query.search;
  const currentUserId = req.user?.id;

  try {
    let users;

    if (search) {
      const keyword = `%${search}%`;
      users = await db.query(
        `SELECT * FROM users WHERE (name ILIKE $1 OR email ILIKE $1) AND id != $2`,
        [keyword, currentUserId || -1]
      );
    } else {
      users = await db.query(
        `SELECT * FROM users WHERE id != $1`,
        [currentUserId || -1]
      );
    }

    res.json(users.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


