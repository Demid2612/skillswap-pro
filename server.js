const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // ВАЖНО!!!

// ===== Простая фейковая база данных =====
let users = [];
let messages = [];

// ===== Регистрация =====
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name  !email  !password) {
    return res.status(400).json({ error: "Заполните все поля" });
  }

  if (users.some(u => u.email === email)) {
    return res.status(400).json({ error: "Email уже используется" });
  }

  const user = {
    id: Date.now().toString(),
    name,
    email,
    password
  };

  users.push(user);
  res.json({ user });
});

// ===== Вход =====
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(400).json({ error: "Неверный логин или пароль" });
  }

  res.json({ user });
});

// ===== Список пользователей =====
app.get("/api/users", (req, res) => {
  res.json(users);
});

// ===== Сообщения =====
app.post("/api/message", (req, res) => {
  const { fromId, toId, text } = req.body;
  messages.push({ fromId, toId, text, time: new Date().toLocaleTimeString() });
  res.json({ success: true });
});

app.get("/api/messages", (req, res) => {
  const { a, b } = req.query;
  res.json(messages.filter(m =>
    (m.fromId === a && m.toId === b) ||
    (m.fromId === b && m.toId === a)
  ));
});

// ===== ПОКАЗ САЙТА =====
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Сервер запущен на порту " + PORT));
