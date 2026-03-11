"use client";

import { Timer } from "lucide-react";

interface TopbarProps {
  word: string | null;
  timeRemaining: number;
  currentRound: number;
  maxRounds: number;
  isDrawer: boolean;
  status: string;
}

export default function Topbar({ word, timeRemaining, currentRound, maxRounds, isDrawer, status }: TopbarProps) {
  
  const getWordDisplay = () => {
    if (status === "WAITING") return <span className="text-gray-400 font-sans tracking-normal text-xl animate-pulse">Waiting for players...</span>;
    if (status === "CHOOSING_WORD") return <span className="text-indigo-400 font-sans tracking-normal text-xl animate-pulse">Choosing a word...</span>;
    if (status === "ROUND_REVEAL") return <span className="text-green-500">The word was: {word}</span>;
    if (status === "GAME_OVER") return <span className="text-purple-600">Game Over!</span>;
    
    // DRAWING state
    if (!word) return "";
    
    if (isDrawer) {
      return word;
    }
    
    // Guesser sees blanks
    return word.split('').map(char => char === ' ' ? '   ' : '_ ').join('');
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 sm:p-6 flex items-center justify-between mx-2 sm:mx-0">
      <div className="flex flex-col bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Round</span>
        <span className="text-xl font-black text-gray-800 text-center">{currentRound} <span className="text-gray-400 font-semibold text-lg">/ {maxRounds}</span></span>
      </div>
      
      <div className="flex-1 flex justify-center px-2 sm:px-6 overflow-hidden">
        <div className="text-center w-full">
           <p className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">
             {status === "DRAWING" ? (isDrawer ? 'Draw this:' : 'Guess this:') : 'Status'}
           </p>
           <h2 className={`text-xl sm:text-3xl md:text-4xl font-black ${status === 'DRAWING' ? 'tracking-[0.2em] font-mono' : ''} text-indigo-600 truncate`}>
             {getWordDisplay()}
           </h2>
        </div>
      </div>
      
      <div className={`flex flex-col items-center px-4 py-2 rounded-2xl border transition-colors ${timeRemaining <= 10 && status === 'DRAWING' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
        <Timer className={`w-5 h-5 mb-1 ${timeRemaining <= 10 && status === 'DRAWING' ? 'text-red-500 animate-spin-slow' : 'text-gray-400'}`} />
        <span className={`text-xl font-black ${timeRemaining <= 10 && status === 'DRAWING' ? 'text-red-600 relative' : 'text-gray-800'}`}>
          {timeRemaining}s
        </span>
      </div>
    </div>
  );
}
