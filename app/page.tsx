"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy, Plus, Users, Zap } from "lucide-react";

export default function Lobby() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  useEffect(() => {
    const saved = sessionStorage.getItem("skribbl_username");
    if (saved) setUsername(saved);
    
    if (typeof window !== "undefined") {
       const searchParams = new URLSearchParams(window.location.search);
       const paramRoom = searchParams.get("roomId");
       if (paramRoom) {
          setRoomId(paramRoom);
       }
    }
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    sessionStorage.setItem("skribbl_username", username.trim());
    
    const idToJoin = roomId.trim() || Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/room/${idToJoin}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 selection:bg-fuchsia-300 selection:text-fuchsia-900">
      <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-white/20">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-4 rounded-full shadow-lg">
            <Zap className="w-10 h-10 text-white fill-white" />
          </div>
        </div>
        
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-center mb-2 tracking-tight">Skribbl.clone</h1>
        <p className="text-center text-gray-500 mb-8 font-medium">Draw, guess, and win!</p>
        
        <form onSubmit={handleJoin} className="space-y-5">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Users className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Enter your nickname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-lg font-semibold text-gray-800 placeholder:text-gray-400 placeholder:font-normal"
              maxLength={15}
              required
            />
          </div>
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
               <Copy className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Room ID (optional)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-lg font-semibold text-gray-800 uppercase placeholder:normal-case placeholder:text-gray-400 placeholder:font-normal"
              maxLength={10}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xl py-4 rounded-2xl shadow-[0_8px_30px_rgb(99,102,241,0.3)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.5)] transform hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
            <span>Play Game</span>
          </button>
        </form>
      </div>
    </div>
  );
}
