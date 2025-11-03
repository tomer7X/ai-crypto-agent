import express from "express";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;

// connect to database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// base route
app.get("/", (req, res) => {
  res.send("Hello World");
});

// GET /message/:id
app.get("/message/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM messages WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
