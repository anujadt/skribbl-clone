"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { SendHorizontal } from "lucide-react";

interface ChatMessage {
  type: "chat" | "system";
  username?: string;
  text: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket();

    const onChat = (data: { username: string; text: string }) => {
      setMessages((prev) => [...prev, { type: "chat", ...data }]);
    };

    const onSystem = (text: string) => {
      setMessages((prev) => [...prev, { type: "system", text }]);
    };

    socket.on("receive_chat_message", onChat);
    socket.on("system_message", onSystem);

    return () => {
      socket.off("receive_chat_message", onChat);
      socket.off("system_message", onSystem);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    getSocket().emit("send_chat_message", input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-100 p-4 shrink-0 flex items-center justify-between">
        <h3 className="font-bold text-gray-700">Live Chat</h3>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-sm pb-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.type === 'system' ? 'items-center my-2' : 'items-start'}`}>
            {m.type === "system" ? (
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${m.text.includes('guessed') ? 'bg-green-100 text-green-700 border border-green-200 shadow-sm' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                {m.text}
              </span>
            ) : (
              <div className="bg-gray-50 px-4 py-2.5 rounded-2xl rounded-tl-sm w-fit max-w-[95%] break-words border border-gray-100 shadow-sm">
                <span className="font-bold text-indigo-600 mr-2">{m.username}:</span>
                <span className="text-gray-700 font-medium">{m.text}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your guess..."
          className="flex-1 px-4 py-3 bg-gray-50 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white border text-gray-700 transition-all placeholder:text-gray-400"
          maxLength={100}
        />
        <button
          type="submit"
          className="bg-indigo-500 hover:bg-indigo-600 text-white w-12 h-12 flex-shrink-0 rounded-xl transition-all shadow-[0_4px_14px_0_rgb(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] active:scale-95 flex items-center justify-center pointer-events-auto"
        >
          <SendHorizontal className="w-5 h-5 ml-0.5" />
        </button>
      </form>
    </div>
  );
}
