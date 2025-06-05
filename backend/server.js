import express from "express";
import bodyParser from "body-parser";
import chats from "./data/data.js";
import db from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import authMiddleware from "./middleware/authMiddleware.js";
import session from "express-session";
import passport from "passport";
import cors from "cors";
const app = express();
const port = process.env.PORT || 5000;
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(authMiddleware.initializePassport(db));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors({
  origin: process.env.FRONTEND_PORT,
  credentials: true,
}));

app.get("/api/chats", (req,res) => {
	res.json(chats);
});

app.get("/api/chats/:id", (req,res) => {
	const chat = chats.find((chat) => req.params.id === chat._id);
	
	res.json(chat);
});

app.use("/api/user",userRoutes);
app.use("/api/chat",chatRoutes);

app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);


app.listen(port, () =>{
	console.log(`server listening on port ${port}`);
});

