const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db");

const app = express();
const server = http.createServer(app);

// 🔥 FIX: proper socket setup
const io = socketIo(server, {
    cors: {
        origin: "*"
    }
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

let users = [];

/* REGISTER */
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);

    db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, hash],
        (err) => {
            if (err) return res.send("Error");
            res.send("Registered");
        }
    );
});

/* LOGIN */
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE username=?",
        [username],
        async (err, result) => {
            if (result.length > 0) {
                const match = await bcrypt.compare(password, result[0].password);
                if (match) res.send("Login Success");
                else res.send("Wrong Password");
            } else {
                res.send("User Not Found");
            }
        }
    );
});

/* LOAD MESSAGES */
app.get("/messages", (req, res) => {
    db.query(
        "SELECT * FROM messages ORDER BY created_at ASC",
        (err, result) => {
            res.json(result);
        }
    );
});

/* SOCKET */
io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    socket.on("join", (username) => {
        users.push({ id: socket.id, username });
        io.emit("onlineUsers", users);
    });

    socket.on("sendMessage", (data) => {
        console.log("Message received:", data);

        db.query(
            "INSERT INTO messages (username, message) VALUES (?, ?)",
            [data.username, data.message]
        );

        io.emit("receiveMessage", data);
    });

    socket.on("typing", (username) => {
        socket.broadcast.emit("typing", username);
    });

    socket.on("disconnect", () => {
        users = users.filter(u => u.id !== socket.id);
        io.emit("onlineUsers", users);
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});