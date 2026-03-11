const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory state for the MVP
const rooms = {};

const createRoom = (roomId) => {
  return {
    id: roomId,
    players: [],
    settings: {
      maxPlayers: 8,
      drawTimeSeconds: 60,
      maxRounds: 3,
    },
    gameState: {
      status: "WAITING", // WAITING, CHOOSING_WORD, DRAWING, ROUND_REVEAL, GAME_OVER
      currentRound: 1,
      currentDrawerId: null,
      currentWord: null,
      timeRemaining: 0,
      correctGuessersThisTurn: [],
      wordsToChoose: [],
    },
    timer: null,
  };
};

const WORDS = [
  "apple", "car", "dog", "house", "sun", "moon", "tree", "cat", "bird", "fish",
  "book", "computer", "phone", "pizza", "burger", "coffee", "guitar", "piano",
  "elephant", "giraffe", "monkey", "rocket", "train", "plane", "ship", "bicycle",
  "keyboard", "mouse", "jacket", "shoes", "hat", "glasses", "clock", "watch"
];

const getRandomWords = (count = 3) => {
  const shuffled = [...WORDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(httpServer);

  // Helper to broadcast room state to everyone in the room
  const broadcastRoomState = (roomId) => {
    if (rooms[roomId]) {
      // Send a sanitized version of the room (hide word from guessers)
      const sanitizedRoom = { ...rooms[roomId] };
      io.to(roomId).emit("room_state_update", sanitizedRoom);
    }
  };

  const endTurn = (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    
    clearInterval(room.timer);
    
    room.gameState.status = "ROUND_REVEAL";
    io.to(roomId).emit("system_message", `The word was: ${room.gameState.currentWord}`);
    broadcastRoomState(roomId);
    
    // Wait afew seconds before passing turn
    setTimeout(() => {
      startNextTurn(roomId);
    }, 5000);
  };
  
  const tickTimer = (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    
    room.gameState.timeRemaining -= 1;
    io.to(roomId).emit("timer_tick", room.gameState.timeRemaining);
    
    if (room.gameState.timeRemaining <= 0) {
      endTurn(roomId);
    }
  };

  const startNextTurn = (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    
    room.gameState.correctGuessersThisTurn = [];
    room.gameState.currentWord = null;
    io.to(roomId).emit("canvas_cleared");

    // Logic to select next drawer
    const currentPlayerIndex = room.players.findIndex(p => p.socketId === room.gameState.currentDrawerId);
    let nextPlayerIndex = currentPlayerIndex + 1;
    
    if (nextPlayerIndex >= room.players.length) {
      nextPlayerIndex = 0;
      room.gameState.currentRound += 1;
    }
    
    if (room.gameState.currentRound > room.settings.maxRounds) {
      room.gameState.status = "GAME_OVER";
      io.to(roomId).emit("system_message", "Game Over!");
      broadcastRoomState(roomId);
      return;
    }
    
    if (room.players.length >= 2) {
      const nextDrawer = room.players[nextPlayerIndex];
      room.gameState.currentDrawerId = nextDrawer.socketId;
      room.gameState.status = "CHOOSING_WORD";
      room.gameState.wordsToChoose = getRandomWords(3);
      
      io.to(roomId).emit("system_message", `${nextDrawer.username} is choosing a word...`);
      broadcastRoomState(roomId);
    } else {
      room.gameState.status = "WAITING";
      room.gameState.currentDrawerId = null;
      room.gameState.wordsToChoose = [];
      io.to(roomId).emit("system_message", "Waiting for more players...");
      broadcastRoomState(roomId);
    }
  };

  io.on("connection", (socket) => {
    let currentRoomId = null;

    socket.on("join_room", ({ roomId, username }) => {
      if (!roomId || !username) return;
      
      socket.join(roomId);
      currentRoomId = roomId;
      
      if (!rooms[roomId]) {
        rooms[roomId] = createRoom(roomId);
      }
      
      const room = rooms[roomId];
      const isHost = room.players.length === 0;
      
      room.players.push({
        socketId: socket.id,
        username,
        score: 0,
        isHost
      });
      
      io.to(roomId).emit("system_message", `${username} has joined the room!`);
      
      if (room.players.length >= 2 && room.gameState.status === "WAITING") {
         startNextTurn(roomId);
      } else {
        broadcastRoomState(roomId);
      }
    });

    socket.on("send_chat_message", (text) => {
      if (!currentRoomId) return;
      const room = rooms[currentRoomId];
      if (!room) return;
      
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      // Guessing logic
      if (room.gameState.status === "DRAWING" && room.gameState.currentDrawerId !== socket.id) {
        if (room.gameState.currentWord && text.toLowerCase().trim() === room.gameState.currentWord.toLowerCase()) {
           if (!room.gameState.correctGuessersThisTurn.includes(socket.id)) {
              room.gameState.correctGuessersThisTurn.push(socket.id);
              
              // Calculate points
              const pointsForGuesser = Math.max(10, Math.floor(room.gameState.timeRemaining * (100 / room.settings.drawTimeSeconds)));
              player.score += pointsForGuesser;
              
              const drawer = room.players.find(p => p.socketId === room.gameState.currentDrawerId);
              if (drawer) {
                 drawer.score += 10;
              }
              
              io.to(currentRoomId).emit("system_message", `🟩 ${player.username} guessed the word!`);
              broadcastRoomState(currentRoomId);
              
              // If everyone guessed
              if (room.gameState.correctGuessersThisTurn.length === room.players.length - 1) {
                 endTurn(currentRoomId);
              }
              return; // Do not broadcast the correct guess to chat
           } else {
              // Already guessed
              return; 
           }
        }
      }

      // regular chat broadcast to room
      io.to(currentRoomId).emit("receive_chat_message", { username: player.username, text });
    });

    socket.on("select_word", (word) => {
      if (!currentRoomId) return;
      const room = rooms[currentRoomId];
      if (!room || room.gameState.currentDrawerId !== socket.id || room.gameState.status !== "CHOOSING_WORD") return;
      
      room.gameState.currentWord = word;
      room.gameState.wordsToChoose = [];
      room.gameState.status = "DRAWING";
      room.gameState.timeRemaining = room.settings.drawTimeSeconds;
      
      io.to(currentRoomId).emit("system_message", `✏️ Drawer is drawing!`);
      broadcastRoomState(currentRoomId);
      
      room.timer = setInterval(() => tickTimer(currentRoomId), 1000);
    });

    socket.on("draw_stroke", (strokeData) => {
      if (!currentRoomId) return;
      const room = rooms[currentRoomId];
      // Only drawer can draw
      if (room && room.gameState.currentDrawerId === socket.id && room.gameState.status === "DRAWING") {
        socket.to(currentRoomId).emit("receive_stroke", strokeData);
      }
    });

    socket.on("clear_canvas", () => {
      if (!currentRoomId) return;
      const room = rooms[currentRoomId];
      if (room && room.gameState.currentDrawerId === socket.id) {
        io.to(currentRoomId).emit("canvas_cleared");
      }
    });

    socket.on("disconnect", () => {
      if (currentRoomId && rooms[currentRoomId]) {
        const room = rooms[currentRoomId];
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        
        if (playerIndex !== -1) {
          const player = room.players[playerIndex];
          room.players.splice(playerIndex, 1);
          io.to(currentRoomId).emit("system_message", `${player.username} has left the room.`);
          
          if (room.players.length === 0) {
             clearInterval(room.timer);
             delete rooms[currentRoomId];
          } else {
            // If the current drawer left
            if (room.gameState.currentDrawerId === socket.id) {
               endTurn(currentRoomId);
            } else {
               broadcastRoomState(currentRoomId);
            }
          }
        }
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
