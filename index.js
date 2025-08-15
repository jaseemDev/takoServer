import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth/authRoutes.js";
import userRoutes from "./routes/user/userRoutes.js";
import statusRoutes from "./routes/status/statusRoutes.js";
import tagsRoutes from "./routes/tags/tagsRoutes.js";
import taskRoutes from "./routes/tasks/taskRoutes.js";
import setupSwagger from "./swagger.js";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", //allows api calls only from frontend port 3000
    credentials: true, // set credentials true for setting cookies
  })
);

app.use(express.json());
app.use(cookieParser());

// Set up __dirname for ES module
const __dirname = path.resolve();

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client", "build")));
}

//setup swagger ui for api documentation
setupSwagger(app);
//API routes entry points
app.use("/api/auth/v1/", authRoutes);
app.use("/api/user/v1/", userRoutes);
app.use("/api/status/v1/", statusRoutes);
app.use("/api/tags/v1/", tagsRoutes);
app.use("/api/tasks/v1/", taskRoutes);

//write your api routes entry points here

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("user connected:", socket.id);

  socket.on("register", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.join(userId);
    console.log("Online users:", Array.from(onlineUsers.keys()));
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
    onlineUsers.forEach((value, key) => {
      if (value === socket.id) {
        onlineUsers.delete(key);
      }
    });
    console.log(
      "Online users after disconnect:",
      Array.from(onlineUsers.keys())
    );
  });
});

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to DB");
    server.listen(process.env.PORT || 5000, () => {
      console.log("Backend server with WebSocket running!");
    });
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.json("backend is running");
});

export { io, onlineUsers };
