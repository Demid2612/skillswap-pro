const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let users = [];
let messages = [];

app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name  !email  !password)
    return res.status(400).json({ error: "Заполните всё" });

  if (users.find(u => u.email === email))
    return res.status(400).json({ error: "Email занят" });

  const user = { id: Date.now().toString(), name, email, password };
  users.push(user);
  res.json({ user });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user)
    return res.status(400).json({ error: "Неверный логин или пароль" });
  res.json({ user });
});

app.get("/api/users", (req, res) => {
  res.json(users);
});

app.post("/api/message", (req, res) => {
  const { fromId, toId, text } = req.body;
  if (!text) return;
  messages.push({ fromId, toId, text, time: new Date().toLocaleTimeString() });
  res.json({ ok: true });
});

app.get("/api/messages", (req, res) => {
  const { a, b } = req.query;
  const chat = messages.filter(
    m => (m.fromId === a && m.toId === b) || (m.fromId === b && m.toId === a)
  );
  res.json(chat);
});

app.get("*", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

app.listen(process.env.PORT || 3000, () =>
  console.log("SERVER STARTED")
);
