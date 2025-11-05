import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from './routes/auth.js';
import cryptopanicRoutes from './routes/cryptopanic.js';
import preferencesRoutes from './routes/preferences.js';
import cgSimpleRoutes from './routes/cg_simple.js';
import openrouterRoutes from './routes/openrouter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.ORIGIN_CORS || "http://localhost:5173", // Vite's default port
}));

// Routes
app.use('/auth', authRoutes);
app.use('/api/news/cryptopanic', cryptopanicRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/coins/', cgSimpleRoutes);
app.use('/api/ai/openrouter', openrouterRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});