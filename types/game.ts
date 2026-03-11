export interface Player {
  socketId: string;
  username: string;
  score: number;
  isHost: boolean;
}

export interface GameState {
  status: "WAITING" | "CHOOSING_WORD" | "DRAWING" | "ROUND_REVEAL" | "GAME_OVER";
  currentRound: number;
  currentDrawerId: string | null;
  currentWord: string | null;
  timeRemaining: number;
  correctGuessersThisTurn: string[];
  wordsToChoose: string[];
}

export interface RoomState {
  id: string;
  players: Player[];
  settings: {
    maxPlayers: number;
    drawTimeSeconds: number;
    maxRounds: number;
  };
  gameState: GameState;
}

export interface StrokeData {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
}
