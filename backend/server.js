import express from "express";
import bodyParser from "body-parser";
import chats from "./data/data.js";
import db from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import authMiddleware from "./middleware/authMiddleware.js";
import session from "express-session";
import passport from "passport";
import cors from "cors";
const app = express();
const port = process.env.PORT || 5000;
import { Server } from "socket.io";


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
app.use("/api/message",messageRoutes);

app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);


const server = app.listen(port, () =>{
	console.log(`server listening on port ${port}`);
});

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.FRONTEND_PORT,
    credentials: true,
  }
});

io.on("connection", (socket) => {
  console.log("connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData.id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
  });

  socket.on("new message", (newMessageRecieved) => {
    let chat = newMessageRecieved.chat;
    console.log(chat);

    if (!chat.users) return console.log("chat.users not defined");
    
    chat.users.forEach(user => {
      if(user.id == newMessageRecieved.sender.id) return;

      socket.in(user.id).emit("message recieved", newMessageRecieved);
    });
  });
});