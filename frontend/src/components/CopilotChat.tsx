"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function CopilotChat({ repoId }: { repoId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm your Maintainer Copilot. Ask me anything about this repository's codebase, issues, or contributor velocity." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_id: repoId, messages: [...messages, userMessage] })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "I encountered an error connecting to the backend. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass w-[380px] h-[500px] flex flex-col mb-4 overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Sparkles size={16} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Maintainer Copilot</h3>
                  <p className="text-[10px] text-emerald-400 font-medium">Online • AI Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    m.role === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-white/5 border border-white/10 text-white/90 rounded-tl-none"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {m.role === "assistant" ? <Bot size={12} className="text-indigo-400" /> : <User size={12} className="text-white/40" />}
                      <span className="text-[10px] uppercase tracking-wider font-bold opacity-40">
                        {m.role === "assistant" ? "Copilot" : "You"}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-black/20">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask a question..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors pr-12"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
                >
                  <Send size={14} className="text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-indigo-600 shadow-xl flex items-center justify-center text-white hover:bg-indigo-500 transition-colors border border-white/10 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-transparent" />
        <MessageSquare className="group-hover:rotate-12 transition-transform" />
      </motion.button>
    </div>
  );
}
