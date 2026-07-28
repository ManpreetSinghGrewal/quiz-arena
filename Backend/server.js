import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './Routes/authRoutes.js';
import { initSocket } from './services/socketService.js';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Initialize Sockets
initSocket(io);

// API Routes
app.use('/api/auth', authRoutes);

// Serve Frontend Static Files
const frontendPath = path.join(__dirname, '../Frontend/dist');
app.use(express.static(frontendPath));

// Handle SPA routing (skip API routes)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Unified server running on port ${PORT}`);
});

// Graceful shutdown logic
const shutdown = (signal) => {
  console.log(`${signal} received. Closing servers...`);
  io.close(() => {
    httpServer.close(() => {
      console.log('Servers closed.');
      process.exit(0);
    });
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGUSR2', () => shutdown('SIGUSR2'));



