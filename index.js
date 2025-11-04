import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import cryptopanicRoutes from './routes/cryptopanic.js';
import preferencesRoutes from './routes/preferences.js';

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
app.use('/api/profile', profileRoutes);
app.use('/api/news/cryptopanic', cryptopanicRoutes);
app.use('/api/preferences', preferencesRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});