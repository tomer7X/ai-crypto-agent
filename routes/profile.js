import express from 'express';
import authMiddleware from '../middleware/auth.js';
import getPool from '../db/db.js';

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const pool = getPool();
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
        res.status(500).json({ message: 'Middleware error' });
    }
});

export default router;