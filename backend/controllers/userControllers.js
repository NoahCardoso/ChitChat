import asyncHandler from "express-async-handler";
import db from "../config/db.js";
import bcrypt from "bcrypt";

const saltRounds = 10;


const registerUser = asyncHandler(async (req, res) => {
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
const authUser = asyncHandler(async(req, res) => {
  
	const {email, password} = req.body;
	if (!email || !password) {
		res.status(400);
		throw new Error("Please enter all the fields");
	}

	// Check if user already exists
	const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
	if(result.rows){
		const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
		if(user && isMatch){
			res.json({
				id: user.id,
				name: user.name,
				email: user.email,
				pic: user.pic,

			})
		} else {
			res.status(401);
			throw new Error("Invalid Email or Password");
		}
	} 
});

export default {registerUser, authUser};
