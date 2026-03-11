"use client";

import { Player } from "@/types/game";
import { Brush, Trophy } from "lucide-react";

interface LeaderboardProps {
  players: Player[];
  currentDrawerId: string | null;
}

export default function Leaderboard({ players, currentDrawerId }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="bg-purple-50 border-b border-purple-100 p-4 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-purple-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500 fill-amber-500" /> Leaderboard
        </h3>
        <span className="text-xs font-bold bg-purple-200 text-purple-800 px-3 py-1 rounded-full shadow-sm">
          {players.length} Players
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sortedPlayers.map((p, index) => {
          const isDrawer = p.socketId === currentDrawerId;
          const isFirst = index === 0 && p.score > 0;
          return (
            <div 
              key={p.socketId}
              className={`flex items-center p-3 sm:p-4 rounded-[1.25rem] transition-all border ${isFirst ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-sm' : 'bg-gray-50 hover:bg-white border-transparent hover:border-gray-100 hover:shadow-sm'}`}
            >
              <div className={`font-black w-8 text-center text-lg ${isFirst ? 'text-amber-500' : 'text-gray-400'}`}>
                #{index + 1}
              </div>
              <div className="flex-1 ml-3 overflow-hidden">
                <div className="font-bold text-gray-800 truncate flex items-center gap-2 text-base">
                  {p.username}
                  {isDrawer && (
                    <div className="bg-indigo-100 text-indigo-600 p-1 rounded-lg">
                      <Brush className="w-3.5 h-3.5 animate-bounce" />
                    </div>
                  )}
                </div>
                <div className={`text-sm font-semibold mt-0.5 ${isFirst ? 'text-orange-600' : 'text-gray-500'}`}>
                  {p.score} pts
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
