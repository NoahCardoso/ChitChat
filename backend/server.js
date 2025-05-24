import express from "express";
import bodyParser from "body-parser";
import chats from "./data/data.js";
import db from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

const app = express();
const port = process.env.PORT || 5000;
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.get("/api/chats", (req,res) => {
	res.json(chats);
});

app.get("/api/chats/:id", (req,res) => {
	const chat = chats.find((chat) => req.params.id === chat._id);
	
	res.json(chat);
});

app.use("/api/user",userRoutes);

app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);


app.listen(port, () =>{
	console.log(`server listening on port ${port}`);
});

