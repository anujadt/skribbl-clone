"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { RoomState } from "@/types/game";
import Canvas from "@/components/Canvas";
import Chat from "@/components/Chat";
import Leaderboard from "@/components/Leaderboard";
import Topbar from "@/components/Topbar";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;
  
  const router = useRouter();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [username, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const storedUsername = sessionStorage.getItem("skribbl_username");
    if (!storedUsername) {
      router.push(`/?roomId=${roomId}`);
      return;
    }
    setUserName(storedUsername);

    const socket = getSocket();
    
    if (socket.connected) {
      socket.emit("join_room", { roomId, username: storedUsername });
    } else {
      socket.on("connect", () => {
         socket.emit("join_room", { roomId, username: storedUsername });
      });
    }

    const onRoomUpdate = (state: RoomState) => setRoomState(state);

    socket.on("room_state_update", onRoomUpdate);

    return () => {
      socket.off("room_state_update", onRoomUpdate);
      // Wait, socket.off("connect") could break future reconnections but it's fine for MVP
    };
  }, [roomId, router]);

  if (!roomState) {
    return (
      <div className="min-h-screen bg-indigo-500 flex items-center justify-center font-sans">
        <div className="text-white text-3xl font-bold animate-pulse">Connecting to room...</div>
      </div>
    );
  }

  const { gameState, settings, players } = roomState;
  const isDrawer = gameState.currentDrawerName === username;

  const handleSelectWord = (word: string) => {
     getSocket().emit("select_word", word);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-2 sm:p-4 font-sans flex flex-col items-center">
      <div className="w-full max-w-7xl flex-1 flex flex-col gap-4">
        
        <Topbar 
          word={gameState.currentWord}
          timeRemaining={gameState.timeRemaining}
          currentRound={gameState.currentRound}
          maxRounds={settings.maxRounds}
          isDrawer={isDrawer}
          status={gameState.status}
        />

        <div className="flex-1 flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)] min-h-[600px]">
          <div className="lg:w-1/4 h-64 lg:h-full flex-shrink-0 order-2 lg:order-1">
             <Leaderboard players={players} currentDrawerName={gameState.currentDrawerName} />
          </div>

          <div className="flex-1 h-full min-h-[500px] relative order-1 lg:order-2 rounded-[2rem] shadow-sm overflow-hidden border border-gray-100 bg-white">
             {gameState.status === "CHOOSING_WORD" && isDrawer && gameState.wordsToChoose && gameState.wordsToChoose.length > 0 && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4">
                  <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-2xl text-center border border-gray-100 transform scale-100 animate-in fade-in zoom-in duration-200 w-full max-w-2xl">
                     <h2 className="text-2xl sm:text-3xl font-black text-indigo-900 mb-8 drop-shadow-sm">Choose a word to draw!</h2>
                     <div className="flex flex-wrap gap-4 justify-center">
                       {gameState.wordsToChoose.map(w => (
                          <button 
                            key={w} 
                            onClick={() => handleSelectWord(w)}
                            className="bg-indigo-100 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold py-4 px-6 sm:px-8 rounded-2xl text-lg sm:text-xl transition-all shadow-sm hover:shadow-xl active:scale-95"
                          >
                            {w}
                          </button>
                       ))}
                     </div>
                  </div>
                </div>
             )}
             
             {gameState.status === "ROUND_REVEAL" && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                   <div className="text-center animate-in fade-in zoom-in duration-300">
                      <h2 className="text-3xl sm:text-5xl font-black text-green-500 mb-4 drop-shadow-sm">The word was</h2>
                      <p className="text-5xl sm:text-7xl font-mono tracking-widest text-indigo-900 drop-shadow-md">{gameState.currentWord}</p>
                   </div>
                </div>
             )}

             {gameState.status === "GAME_OVER" && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
                   <div className="text-center p-8 sm:p-12 bg-white rounded-[3rem] shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-500 w-full max-w-xl">
                      <h2 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 mb-8 pb-2">Game Over!</h2>
                      <div className="space-y-4 text-left">
                         {players.sort((a,b) => b.score - a.score).slice(0, 3).map((p, i) => (
                            <div key={p.socketId} className="flex items-center justify-between gap-8 text-xl sm:text-2xl font-bold p-4 bg-gray-50 rounded-2xl border border-gray-100">
                               <div className="flex items-center gap-4">
                                 <span className={i === 0 ? 'text-3xl sm:text-4xl text-amber-400' : i === 1 ? 'text-2xl sm:text-3xl text-slate-400' : 'text-2xl sm:text-3xl text-amber-600'}>
                                   #{i+1}
                                 </span>
                                 <span className="text-gray-800">{p.username}</span>
                               </div>
                               <span className="text-indigo-600">{p.score} pts</span>
                            </div>
                         ))}
                      </div>
                      <button 
                         onClick={() => router.push("/")}
                         className="mt-10 bg-gray-900 text-white font-bold py-4 px-12 rounded-2xl text-xl hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95 w-full sm:w-auto"
                      >
                         Play Again
                      </button>
                   </div>
                </div>
             )}

             <div className="absolute inset-0 z-0">
               <Canvas isDrawer={isDrawer && gameState.status === "DRAWING"} />
             </div>
          </div>

          <div className="lg:w-1/4 h-80 lg:h-full flex-shrink-0 order-3 lg:order-3">
             <Chat />
          </div>
        </div>

      </div>
    </div>
  );
}
