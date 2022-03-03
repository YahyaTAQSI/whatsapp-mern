// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";
// app config
const app = express();
const port = process.env.port || 9000;
const pusher = new Pusher({
  appId: "1166530",
  key: "1ca156783e5d309aa343",
  secret: "4909104782117a277491",
  cluster: "eu",
  useTLS: true,
});
// middleware
app.use(express.json());
app.use(cors());
// DB config
const connection_url =
  "mongodb+srv://admin:admin@cluster0.d5aqd.mongodb.net/whatsappdb?retryWrites=true&w=majority";
const connectionParams = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
};
mongoose.connect(connection_url, connectionParams).then(() => {
  console.log("Connected to database ");
});

//
const db = mongoose.connection;
db.once("open", () => {
  console.log("DB connected");
  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log("A change accured", change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.user,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("error triggering pusher");
    }
  });
});

// api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});
// listner
app.listen(port, () => console.log(`Listen on localhost : ${port}`));
