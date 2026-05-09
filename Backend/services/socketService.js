import { generateQuestions } from "./quizService.js";

let onlineUsers = new Set();
let matchmakingQueue = [];
let activeMatches = {}; // roomId -> { players: {socketId: {score, finished, timeTaken}}, questions, subject }

const SUBJECTS = ["Operating System", "Linux", "Computer Networks", "Data Base Management System", "Data Structures and Algorithms", "C and Pointers"];

let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    onlineUsers.add(socket.id);
    io.emit('onlineUsersCount', onlineUsers.size);

    socket.on('auth:join', (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(`User ${userId} joined their private room`);
      }
    });


    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      onlineUsers.delete(socket.id);
      matchmakingQueue = matchmakingQueue.filter(user => user.socketId !== socket.id);
      
      // Cleanup active matches if a player disconnects
      Object.keys(activeMatches).forEach(roomId => {
        if (activeMatches[roomId].players[socket.id]) {
          const opponentId = Object.keys(activeMatches[roomId].players).find(id => id !== socket.id);
          if (opponentId) {
            io.to(opponentId).emit('match:opponent_disconnected');
          }
          delete activeMatches[roomId];
        }
      });

      io.emit('onlineUsersCount', onlineUsers.size);
    });

    socket.on('matchmaking:join', async (userData) => {
      const existingIndex = matchmakingQueue.findIndex(user => user.socketId === socket.id);
      if (existingIndex !== -1) return;

      const newUser = {
        socketId: socket.id,
        name: userData.name || "Guest",
        level: userData.level || 1,
        avatar: userData.avatar || 0
      };

      if (matchmakingQueue.length > 0) {
        const opponent = matchmakingQueue.shift();
        const roomId = `room_${opponent.socketId}_${newUser.socketId}`;
        const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
        
        console.log(`Starting match: ${newUser.name} vs ${opponent.name} on ${subject}`);

        try {
          const questions = await generateQuestions(subject, "10", 10);
          
          activeMatches[roomId] = {
            subject,
            questions,
            players: {
              [newUser.socketId]: { name: newUser.name, score: 0, finished: false, timeTaken: 0 },
              [opponent.socketId]: { name: opponent.name, score: 0, finished: false, timeTaken: 0 }
            }
          };

          socket.join(roomId);
          const opponentSocket = io.sockets.sockets.get(opponent.socketId);
          if (opponentSocket) opponentSocket.join(roomId);

          const matchData = {
            roomId,
            subject,
            questions,
            timePerQuestion: 20
          };

          io.to(newUser.socketId).emit('matchmaking:found', {
            ...matchData,
            opponent: { name: opponent.name, level: opponent.level, avatar: opponent.avatar }
          });

          io.to(opponent.socketId).emit('matchmaking:found', {
            ...matchData,
            opponent: { name: newUser.name, level: newUser.level, avatar: newUser.avatar }
          });

        } catch (error) {
          console.error("Match initialization failed:", error);
          io.to(newUser.socketId).emit('matchmaking:error', "Failed to initialize match");
          io.to(opponent.socketId).emit('matchmaking:error', "Failed to initialize match");
        }
      } else {
        matchmakingQueue.push(newUser);
      }
    });

    socket.on('matchmaking:cancel', () => {
      matchmakingQueue = matchmakingQueue.filter(user => user.socketId !== socket.id);
    });

    // Match Progress Events
    socket.on('quiz:submit_answer', ({ roomId, score, timeTaken }) => {
      const match = activeMatches[roomId];
      if (!match || !match.players[socket.id]) return;

      match.players[socket.id].score = score;
      match.players[socket.id].timeTaken += timeTaken;

      // Broadcast progress to opponent
      const opponentId = Object.keys(match.players).find(id => id !== socket.id);
      if (opponentId) {
        io.to(opponentId).emit('match:opponent_progress', {
          score: match.players[socket.id].score,
          questionIndex: match.players[socket.id].progress || 0
        });
      }
    });

    socket.on('quiz:finish', ({ roomId, score, timeTaken }) => {
      const match = activeMatches[roomId];
      if (!match || !match.players[socket.id]) return;

      match.players[socket.id].score = score;
      match.players[socket.id].timeTaken += timeTaken;
      match.players[socket.id].finished = true;

      const playerIds = Object.keys(match.players);
      const allFinished = playerIds.every(id => match.players[id].finished);

      if (allFinished) {
        const p1Id = playerIds[0];
        const p2Id = playerIds[1];
        const p1 = match.players[p1Id];
        const p2 = match.players[p2Id];

        let winnerId = null;
        if (p1.score > p2.score) winnerId = p1Id;
        else if (p2.score > p1.score) winnerId = p2Id;
        else if (p1.timeTaken < p2.timeTaken) winnerId = p1Id;
        else if (p2.timeTaken < p1.timeTaken) winnerId = p2Id;

        io.to(roomId).emit('match:result', {
          winnerId,
          players: match.players
        });

        delete activeMatches[roomId];
      }
    });
  });
};

export const notifyStatsUpdate = (userId, stats) => {
  if (ioInstance && userId) {
    ioInstance.to(userId.toString()).emit('stats:updated', stats);
  }
};

export const broadcastActivity = (activity) => {
  if (ioInstance) {
    ioInstance.emit('activity:new', activity);
    ioInstance.emit('leaderboard:updated'); // Notify all to refresh leaderboard
  }
};

