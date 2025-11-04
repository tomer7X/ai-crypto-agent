import express from "express";
import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "./middleware/auth.js";

dotenv.config();
const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;
const ROUNDS = 10;

// ✅ Allow requests from your frontend
app.use(cors({
  origin: process.env.ORIGIN_CORS || "http://localhost:5173", // Vite's default port
}));


// connect to database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.post("/auth/register", express.json(), async (req, res) => {
  const { email, fullName, password } = req.body;
  try {
    const emailCheck = await pool.query("SELECT * FROM accounts WHERE email = $1", [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json("Email already in use");
    }
    const passwordHash = await bcrypt.hash(password, ROUNDS);
    const result = await pool.query(
      "INSERT INTO accounts (full_name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [fullName, email, passwordHash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/auth/login", express.json(), async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM accounts WHERE email = $1",
    [email]
  );
  if (result.rowCount === 0) return res.status(401).json({ error: "Invalid credentials" });

  const { id, password: hashPassword, full_name, email: userEmail } = result.rows[0];

  const ok = await bcrypt.compare(password, hashPassword);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  // Generate JWT token
  const token = jwt.sign(
    { 
      id,
      email: userEmail,
      name: full_name 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );

  res.json({ 
    token,
  });
});

// Protected route example
app.get("/api/profile", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, full_name, email FROM accounts WHERE id = $1",
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});