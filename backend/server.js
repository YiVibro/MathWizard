
// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path=require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Data structures
const rooms = new Map(); // roomId -> room data
const leaderboard = new Map(); // username -> player stats

app.get("/",(req,res)=>{
   res.sendFile(path.join(__dirname,"client","index.html"));
})

app.get('/assets/index-Cb7zLiWL.js',(req,res)=>{
  res.sendFile(path.join(__dirname,"client","assets",'index-Cb7zLiWL.js'))
})

app.get('/assets/index-DgL274gC.css',(req,res)=>{
  res.sendFile(path.join(__dirname,"client","assets",'index-DgL274gC.css'))
})
// Helper functions
function generateMathProblem() {
  const operators = ['+', '-', '*'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  
  let num1, num2, answer;
  
  switch (operator) {
    case '+':
      num1 = Math.floor(Math.random() * 50) + 1;
      num2 = Math.floor(Math.random() * 50) + 1;
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 50) + 20;
      num2 = Math.floor(Math.random() * 20) + 1;
      answer = num1 - num2;
      break;
    case '*':
      num1 = Math.floor(Math.random() * 12) + 1;
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = num1 * num2;
      break;
    default:
      num1 = 1;
      num2 = 1;
      answer = 2;
  }
  
  return {
    problem: `${num1} ${operator} ${num2} = ?`,
    answer: answer
  };
}

function updateLeaderboard(username, score, solvedCount) {
  if (!leaderboard.has(username)) {
    leaderboard.set(username, { 
      score: 0, 
      totalSolved: 0,
      gamesPlayed: 0 
    });
  }
  
  const playerStats = leaderboard.get(username);
  playerStats.score += score;
  playerStats.totalSolved += solvedCount;
  playerStats.gamesPlayed += 1;
  leaderboard.set(username, playerStats);
}

// API routes
app.post('/api/rooms/create', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }
  
  const roomId = uuidv4().slice(0, 8);
  
  rooms.set(roomId, {
    id: roomId,
    creator: username,
    players: [{ username, score: 0, solvedCount: 0, isCreator: true }],
    status: 'waiting',
    currentProblem: null
  });
  
  return res.status(201).json({ roomId });
});

app.post('/api/rooms/join', (req, res) => {
  const { roomId, username } = req.body;
  
  if (!roomId || !username) {
    return res.status(400).json({ message: 'Room ID and username are required' });
  }
  
  if (!rooms.has(roomId)) {
    return res.status(404).json({ message: 'Room not found' });
  }
  
  const room = rooms.get(roomId);
  
  if (room.status === 'playing') {
    return res.status(400).json({ message: 'Cannot join room, game already in progress' });
  }
  
  if (room.players.some(player => player.username === username)) {
    return res.status(400).json({ message: 'Username already taken in this room' });
  }
  
  room.players.push({ username, score: 0, solvedCount: 0, isCreator: false });
  rooms.set(roomId, room);
  
  io.to(roomId).emit('room-update', { players: room.players });
  
  return res.status(200).json({ message: 'Joined room successfully' });
});

app.get('/api/leaderboard', (req, res) => {
  const leaderboardArray = Array.from(leaderboard.entries()).map(([username, stats]) => {
    return {
      username,
      score: stats.score,
      totalSolved: stats.totalSolved,
      gamesPlayed: stats.gamesPlayed
    };
  });
  
  // Sort by score in descending order
  leaderboardArray.sort((a, b) => b.score - a.score);
  
  return res.status(200).json(leaderboardArray);
});

// Socket.io logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  socket.on('join-room', ({ roomId, username }) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      // Create room if it doesn't exist (fallback)
      rooms.set(roomId, {
        id: roomId,
        creator: username,
        players: [{ username, score: 0, solvedCount: 0, isCreator: true }],
        status: 'waiting',
        currentProblem: null
      });
    } else {
      // Add player if they're not already in the room
      const room = rooms.get(roomId);
      if (!room.players.some(player => player.username === username)) {
        room.players.push({ 
          username, 
          score: 0, 
          solvedCount: 0,
          isCreator: room.creator === username 
        });
        rooms.set(roomId, room);
      }
    }
    
    // Notify clients about room update
    io.to(roomId).emit('room-update', { players: rooms.get(roomId).players });
  });
  
  socket.on('start-game', ({ roomId }) => {
    if (!rooms.has(roomId)) return;
    
    const room = rooms.get(roomId);
    
    // Reset player scores for a new game
    room.players.forEach(player => {
      player.score = 0;
      player.solvedCount = 0;
    });
    
    room.status = 'playing';
    rooms.set(roomId, room);
    
    // Notify all clients in the room that game has started
    io.to(roomId).emit('game-start');
    
    // Send the first problem
    const mathProblem = generateMathProblem();
    room.currentProblem = mathProblem;
    rooms.set(roomId, room);
    
    io.to(roomId).emit('new-problem', { problem: mathProblem.problem });
    
    // Set a timer to end the game after 60 seconds
    setTimeout(() => {
      if (rooms.has(roomId) && rooms.get(roomId).status === 'playing') {
        endGame(roomId);
      }
    }, 60000);
  });
  
  socket.on('submit-answer', ({ roomId, answer }) => {
    if (!rooms.has(roomId)) return;
    
    const room = rooms.get(roomId);
    if (room.status !== 'playing' || !room.currentProblem) return;
    
    // Find the player
    const username = getUsernameFromSocket(socket);
    if (!username) return;
    
    const playerIndex = room.players.findIndex(p => p.username === username);
    if (playerIndex === -1) return;
    
    // Check answer
    const isCorrect = answer === room.currentProblem.answer;
    
    if (isCorrect) {
      // Increment score and solved count
      room.players[playerIndex].score += 10;
      room.players[playerIndex].solvedCount += 1;
      
      // Generate a new problem for this player
      const mathProblem = generateMathProblem();
      room.currentProblem = mathProblem;
      rooms.set(roomId, room);
      
      // Notify about the result and update other players
      io.to(roomId).emit('answer-result', {
        username,
        correct: true,
        score: room.players[playerIndex].score,
        solvedCount: room.players[playerIndex].solvedCount
      });
      
      io.to(roomId).emit('room-update', { players: room.players });
      
      // Send a new problem to the player
      socket.emit('new-problem', { problem: mathProblem.problem });
    } else {
      // Just notify about wrong answer
      socket.emit('answer-result', {
        username,
        correct: false,
        score: room.players[playerIndex].score,
        solvedCount: room.players[playerIndex].solvedCount
      });
    }
  });
  
  socket.on('end-game', ({ roomId }) => {
    endGame(roomId);
  });
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find rooms the user was in
    for (const [roomId, room] of rooms.entries()) {
      const username = getUsernameFromSocket(socket);
      if (!username) continue;
      
      const playerIndex = room.players.findIndex(p => p.username === username);
      
      if (playerIndex !== -1) {
        const isCreator = room.players[playerIndex].isCreator;
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          // Remove empty room
          rooms.delete(roomId);
        } else if (isCreator && room.players.length > 0) {
          // Assign new creator
          room.players[0].isCreator = true;
          room.creator = room.players[0].username;
          rooms.set(roomId, room);
          io.to(roomId).emit('room-update', { players: room.players });
        } else {
          // Just update the room
          rooms.set(roomId, room);
          io.to(roomId).emit('room-update', { players: room.players });
        }
      }
    }
  });
  
  // Helper function to get username from socket
  function getUsernameFromSocket(socket) {
    // Loop through all rooms
    for (const [roomId, room] of rooms.entries()) {
      // Check if this socket is in this room
      if (socket.rooms.has(roomId)) {
        // Find user by comparing socket ID
        for (const player of room.players) {
          if (player.username && socket.rooms.has(roomId)) {
            return player.username;
          }
        }
      }
    }
    return null;
  }
  
  // Function to end the game
  function endGame(roomId) {
    if (!rooms.has(roomId)) return;
    
    const room = rooms.get(roomId);
    if (room.status !== 'playing') return;
    
    // Change status to finished
    room.status = 'finished';
    rooms.set(roomId, room);
    
    // Update global leaderboard
    room.players.forEach(player => {
      updateLeaderboard(player.username, player.score, player.solvedCount);
    });
  
// Notify all clients in the room that game is over
io.to(roomId).emit('game-over', { 
  players: room.players,
  leaderboard: Array.from(leaderboard.entries()).map(([username, stats]) => ({
    username,
    score: stats.score,
    totalSolved: stats.totalSolved,
    gamesPlayed: stats.gamesPlayed
  })).sort((a, b) => b.score - a.score)
});

// Clean up the room after a delay
setTimeout(() => {
  if (rooms.has(roomId)) {
    rooms.delete(roomId);
  }
}, 60000); // Remove room after 1 minute
}
//
socket.on('submit-answer', ({ roomId, answer }) => {
  if (!rooms.has(roomId)) return;
  
  const room = rooms.get(roomId);
  if (room.status !== 'playing' || !room.currentProblem) return;
  
  // Find the player
  const username = getUsernameFromSocket(socket);
  if (!username) return;
  
  const playerIndex = room.players.findIndex(p => p.username === username);
  if (playerIndex === -1) return;
  
  // Check answer
  const isCorrect = answer === room.currentProblem.answer;
  
  if (isCorrect) {
    // Increment score and solved count ONLY for the player who answered
    room.players[playerIndex].score += 10;
    room.players[playerIndex].solvedCount += 1;
    
    // Generate a new problem for this player
    const mathProblem = generateMathProblem();
    room.currentProblem = mathProblem;
    rooms.set(roomId, room);
    
    // Notify about the result
    io.to(roomId).emit('answer-result', {
      username,
      correct: true,
      score: room.players[playerIndex].score,
      solvedCount: room.players[playerIndex].solvedCount
    });
    
    // Update ALL clients about the updated player scores
    io.to(roomId).emit('room-update', { players: room.players });
    
    // Send a new problem ONLY to the player who answered correctly
    socket.emit('new-problem', { problem: mathProblem.problem });
  } else {
    // Just notify about wrong answer
    socket.emit('answer-result', {
      username,
      correct: false,
      score: room.players[playerIndex].score,
      solvedCount: room.players[playerIndex].solvedCount
    });
  }
});

});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});