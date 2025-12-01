const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const DB_FILE = path.join(__dirname, "db.json");

function readDb() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ---------- Регистрация ----------
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;
  const db = readDb();

  if (db.users.some(u => u.email === email)) {
    return res.status(400).json({ error: "Email уже используется" });
  }

  const user = {
    id: Date.now().toString(),
    name,
    email,
    password,
    friends: [],
    premium: false,
    online: true
  };

  db.users.push(user);
  writeDb(db);
  res.json({ user });
});

// ---------- Вход ----------
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDb();

  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(400).json({ error: "Неверный логин или пароль" });
  }

  user.online = true;
  writeDb(db);
  res.json({ user });
});

// ---------- Список пользователей ----------
app.get("/api/users", (req, res) => {
  const db = readDb();
  res.json(db.users);
});

// ---------- Чат ----------
app.post("/api/message", (req, res) => {
  const { fromId, toId, text } = req.body;
  const db = readDb();

  const message = {
    id: Date.now(),
    fromId,
    toId,
    text,
    time: new Date().toLocaleTimeString()
  };

  db.messages.push(message);
  writeDb(db);
  res.json({ success: true });
});

app.get("/api/messages", (req, res) => {
  const { a, b } = req.query;
  const db = readDb();
  const msgs = db.messages.filter(
    m => (m.fromId === a && m.toId === b) || (m.fromId === b && m.toId === a)
  );
  res.json(msgs);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server запущен на порту " + PORT));
