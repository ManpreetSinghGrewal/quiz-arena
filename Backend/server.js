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

import fs from 'fs';

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

const PORT = process.env.PORT || 8085;

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Initialize Sockets
initSocket(io);

// Health check route for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// API Routes
app.use('/api/auth', authRoutes);

// Serve Frontend Static Files if built/available
const frontendPath = path.join(__dirname, '../Frontend/dist');
const indexPath = path.join(frontendPath, 'index.html');

if (fs.existsSync(indexPath)) {
  app.use(express.static(frontendPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(indexPath);
  });
} else {
  app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'QuizArena Backend API is running' });
  });
}

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



