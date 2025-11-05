import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import getPool from '../db/db.js';

const router = express.Router();
const ROUNDS = 10;

const TOKEN_EXPIRY_HOURS = 24;




router.post("/register", express.json(), async (req, res) => {
  const { email, fullName, password } = req.body;
  try {
    const pool = getPool();
    const emailCheck = await pool.query("SELECT * FROM accounts WHERE email = $1", [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
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

router.post("/login", express.json(), async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = getPool();
    const result = await pool.query(
      "SELECT * FROM accounts WHERE email = $1",
      [email]
    );
    if (result.rowCount === 0) return res.status(401).json({ error: "Invalid credentials" });

    const { id, password: hashPassword, full_name } = result.rows[0];

    const ok = await bcrypt.compare(password, hashPassword);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id,
        email,
        name: full_name 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: `${TOKEN_EXPIRY_HOURS}h` }
    );

    const tokenExpirationDate = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    res.json({ 
      token,
      tokenExpirationDate,
      user: {
        id,
        email,
        name: full_name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "login failed" });
  }
});

export default router;