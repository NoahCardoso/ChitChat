import jwt from "jsonwebtoken";

function generateToken (id) {
	return jwt.sign({id},process.env.JWT_SECRET, {
		expiresIn: "1d",
	});
}
//add passport
/* 
TO DO
add passport, cookie and session verification bc i dont like haveing the token in my db. ewww
*/
export default generateToken;