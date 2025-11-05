import express from 'express';
import authMiddleware from '../middleware/auth.js';
import getPool from '../db/db.js';

const router = express.Router();

// Validate preference data
const validatePreferences = (data) => {
    const errors = [];
    
    // Validate currencies array
    if (data.currencies) {
        if (!Array.isArray(data.currencies)) {
            errors.push('currencies must be an array');
        } else if (!data.currencies.every(c => typeof c === 'string')) {
            errors.push('currencies must be an array of strings');
        }
    }

    // Validate content array
    if (data.content) {
        if (!Array.isArray(data.content)) {
            errors.push('content must be an array');
        } else {
            const validContent = ['news', 'charts', 'AI', 'fun'];
            if (!data.content.every(c => validContent.includes(c))) {
                errors.push(`content must be one of: ${validContent.join(', ')}`);
            }
        }
    }

    // Validate investor_type
    if (data.investor_type) {
        const validTypes = ['HODLer', 'Day Trader', 'NFT Collector', 'Swing Trader', 'Other'];
        if (!validTypes.includes(data.investor_type)) {
            errors.push(`investor_type must be one of: ${validTypes.join(', ')}`);
        }
    }

    return errors;
};

// GET /api/preferences - Get user preferences
router.get('/', authMiddleware, async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.query(
            'SELECT * FROM user_preferences WHERE user_id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'No preferences found for this user',
                preferences: {
                    currencies: [],
                    content: [],
                    investor_type: null
                }
            });
        }

        res.json({
            message: 'Preferences retrieved successfully',
            preferences: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching user preferences:', error);
        res.status(500).json({ message: 'Error fetching preferences' });
    }
});

// PUT /api/preferences - Update user preferences
router.put('/', authMiddleware, async (req, res) => {
    try {
        const pool = getPool();
        const { currencies, content, investor_type } = req.body;
        
        // Validate input
        const validationErrors = validatePreferences({ currencies, content, investor_type });
        if (validationErrors.length > 0) {
            return res.status(400).json({
                message: 'Invalid preferences data',
                errors: validationErrors
            });
        }

        // Check if preferences exist
        const existingResult = await pool.query(
            'SELECT id FROM user_preferences WHERE user_id = $1',
            [req.user.id]
        );

        let result;
        if (existingResult.rows.length === 0) {
            // Insert new preferences
            result = await pool.query(
                `INSERT INTO user_preferences (user_id, currencies, content, investor_type)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [req.user.id, JSON.stringify(currencies), JSON.stringify(content), investor_type]
            );
        } else {
            // Update existing preferences
            result = await pool.query(
                `UPDATE user_preferences 
                 SET currencies = $2,
                     content = $3,
                     investor_type = $4
                 WHERE user_id = $1
                 RETURNING *`,
                [req.user.id, JSON.stringify(currencies), JSON.stringify(content), investor_type]
            );
        }

        res.json({
            message: 'Preferences updated successfully',
            preferences: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating user preferences:', error);
        res.status(500).json({ message: 'Error updating preferences' });
    }
});

export default router;