const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Создание таблиц (один раз при запуске)
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      premium BOOLEAN DEFAULT false,
      online BOOLEAN DEFAULT true
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      fromId INTEGER,
      toId INTEGER,
      text TEXT,
      time TEXT
    );
  `);

  console.log("Таблицы проверены/созданы");
}
initDB();

// 🔹 Регистрация
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email уже используется" });
    }

    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING *",
      [name, email, password]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Вход
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1 AND password=$2",
    [email, password]
  );
  if (result.rows.length === 0) {
    return res.status(400).json({ error: "Неверный логин или пароль" });
  }

  res.json({ user: result.rows[0] });
});

// 🔹 Все пользователи
app.get("/api/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
});

// 🔹 Отправка сообщения
app.post("/api/message", async (req, res) => {
  const { fromId, toId, text } = req.body;
  const time = new Date().toLocaleTimeString();

  await pool.query(
    "INSERT INTO messages (fromId, toId, text, time) VALUES ($1,$2,$3,$4)",
    [fromId, toId, text, time]
  );
  res.json({ success: true });
});

// 🔹 Получение сообщений
app.get("/api/messages", async (req, res) => {
  const { a, b } = req.query;
  const result = await pool.query(
    "SELECT * FROM messages WHERE (fromId=$1 AND toId=$2) OR (fromId=$2 AND toId=$1)",
    [a, b]
  );
  res.json(result.rows);
});

// Отдаём сайт
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server стартовал на порту " + PORT));
