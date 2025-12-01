const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DB_FILE = path.join(__dirname, "db.json");

// ===== Работа с файлом БД =====
function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    return { users: [], messages: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (e) {
    console.error("Ошибка чтения db.json:", e);
    return { users: [], messages: [] };
  }
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ===== Регистрация =====
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name  !email  !password) {
    return res.status(400).json({ error: "Заполните все поля" });
  }

  const db = loadDb();

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
  saveDb(db);

  res.json({ user });
});

// ===== Вход =====
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const db = loadDb();

  const user = db.users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(400).json({ error: "Неверный логин или пароль" });
  }

  user.online = true;
  saveDb(db);

  res.json({ user });
});

// ===== Список пользователей =====
app.get("/api/users", (req, res) => {
  const db = loadDb();
  res.json(db.users);
});

// ===== Добавить сообщение =====
app.post("/api/message", (req, res) => {
  const { fromId, toId, text } = req.body;

  if (!fromId  !toId  !text) {
    return res.status(400).json({ error: "Пустое сообщение" });
  }

  const db = loadDb();

  db.messages.push({
    id: Date.now().toString(),
    fromId,
    toId,
    text,
    time: new Date().toLocaleTimeString()
  });

  saveDb(db);
  res.json({ success: true });
});

// ===== Получить сообщения между двумя юзерами =====
app.get("/api/messages", (req, res) => {
  const { a, b } = req.query;
  const db = loadDb();

  const msgs = db.messages.filter(
    m =>
      (m.fromId === a && m.toId === b) ||
      (m.fromId === b && m.toId === a)
  );

  res.json(msgs);
});

// ===== Отдаём фронт =====
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
