"use client";
import React, { useState, useRef, useEffect } from "react";

/**
 * Chat.jsx
 * - Fixed to fit perfectly on laptop screen without extra scrolling
 */

const API_BASE = "http://localhost:3000";

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi — I'm Gemini. Ask me anything ✨",
      time: formatTime(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const textareaRef = useRef(null);
  const endRef = useRef(null);

  const placeholders = [
    "What's the first rule of Fight Club?",
    "Write a Javascript method to reverse a string",
    "How to assemble your own PC?",
    "Explain recursion like I'm 5",
    "Give me a 3-step plan to learn DS in 2 months",
  ];

  // rotate placeholder every 3.5s
  useEffect(() => {
    const t = setInterval(
      () => setPlaceholderIndex((i) => (i + 1) % placeholders.length),
      3500
    );
    return () => clearInterval(t);
  }, []);

  // scroll to bottom on messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 144) + "px"; // Max height 144px (6 lines)
  }, [prompt]);

  const appendMessage = (msg) =>
    setMessages((prev) => [...prev, { ...msg, time: formatTime() }]);

  const handleSend = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    // push user message
    appendMessage({ sender: "user", text: trimmed });
    setPrompt("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Server error");
      }

      const data = await res.json();
      appendMessage({
        sender: "bot",
        text: data.result || "No response (empty)",
      });
    } catch (err) {
      console.error(err);
      appendMessage({
        sender: "bot",
        text:
          "❌ Something went wrong. Check server logs or your backend. (" +
          (err.message || "unknown") +
          ")",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-black to-gray-900 text-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-4">
          {/* small sparkle svg */}
          <div className="relative w-10 h-10">
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="g" cx="50%" cy="30%">
                  <stop offset="0%" stopColor="#7dd3fc" stopOpacity="1" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="12" cy="12" r="10" fill="url(#g)" opacity="0.08" />
              <g fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.9">
                <path d="M12 4 L13 9 L18 10 L13 12 L12 18 L11 12 L6 10 L11 9 Z" />
              </g>
            </svg>
            {/* tiny animated sparkles */}
            <div className="absolute inset-0 pointer-events-none">
              <span className="animate-sparkle block w-1 h-1 bg-white rounded-full absolute left-2 top-1 opacity-80"></span>
              <span className="animate-sparkle delay-200 block w-1.5 h-1.5 bg-white rounded-full absolute left-8 top-3 opacity-70"></span>
              <span className="animate-sparkle delay-400 block w-1 h-1 bg-white rounded-full absolute left-5 top-8 opacity-60"></span>
            </div>
          </div>

          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              ChatBot
            </h1>
            <p className="text-xs text-gray-400 -mt-1">Gemini Chat</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="text-sm text-gray-400">Model</div>
          <div className="px-3 py-1 rounded-full bg-gray-800 text-xs text-gray-200">
            gemini-2.5-flash
          </div>
        </div>
      </header>

      {/* Main area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: conversation panel */}
        <section className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-3xl mx-auto h-full">
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex items-end gap-3 ${
                    m.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.sender === "bot" && (
                    <div className="flex-none">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                        AI
                      </div>
                    </div>
                  )}

                  <div
                    className={`relative max-w-[80%] px-4 py-3 rounded-2xl shadow-md transform transition duration-250 ease-out
                      ${
                        m.sender === "user"
                          ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-none"
                          : "bg-gray-800 text-gray-100 rounded-bl-none"
                      }`}
                    style={{
                      animation: "fadeInUp 260ms ease both",
                    }}
                  >
                    <div className="whitespace-pre-wrap break-words text-sm">{m.text}</div>
                    <div className="text-xs text-gray-400 mt-2 text-right">
                      {m.time}
                    </div>
                  </div>

                  {m.sender === "user" && (
                    <div className="flex-none">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                        U
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* loading placeholder */}
              {loading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-sm">
                    AI
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-gray-800 text-gray-200 max-w-[50%]">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" />
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-400" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>
          </div>
        </section>

        {/* Right: quick tips / shortcuts */}
        <aside className="w-full md:w-80 border-l border-gray-800 p-4 bg-gradient-to-b from-gray-900/50 to-transparent flex-shrink-0 overflow-auto">
          <div className="mb-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wide">Quick prompts</h3>
            <div className="mt-3 space-y-2">
              {placeholders.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p);
                    textareaRef.current?.focus();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-800/80 text-xs"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs text-gray-400 uppercase">Tips</h4>
            <ul className="mt-3 text-xs text-gray-300 space-y-1">
              <li>• Press Enter to send, Shift+Enter for newline.</li>
              <li>• Keep prompts short for faster responses.</li>
              <li>• Use follow-ups for clarifications.</li>
            </ul>
          </div>
        </aside>
      </main>

      {/* Composer */}
      <footer className="flex-shrink-0 p-3 md:p-4 border-t border-gray-800 bg-gradient-to-t from-black/60 to-transparent">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholders[placeholderIndex]}
              className="flex-1 min-h-[40px] max-h-36 resize-none px-3 py-2 rounded-xl bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow shadow-sm text-sm"
              rows={1}
            />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setPrompt("");
                  textareaRef.current?.focus();
                }}
                className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-800/80 text-xs"
                title="Clear"
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={!prompt.trim() || loading}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  prompt.trim() && !loading
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
                aria-label="Send"
              >
                {loading ? (
                  <>
                    <svg
                      className="w-3 h-3 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeOpacity="0.15"
                      />
                      <path
                        d="M22 12a10 10 0 00-10-10"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                    Thinking...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 12l18-9-9 18-2-7-7-2z"
                        fill="currentColor"
                      />
                    </svg>
                    Send
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </footer>

      {/* Small CSS-in-JS for animations */}
      <style >{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-sparkle {
          animation: sparkle 1500ms linear infinite;
          transform-origin: center;
          opacity: 0;
        }
        .animate-sparkle.delay-200 {
          animation-delay: 200ms;
        }
        .animate-sparkle.delay-400 {
          animation-delay: 400ms;
        }
        @keyframes sparkle {
          0% {
            opacity: 0;
            transform: scale(0.6) translateY(-2px);
          }
          30% {
            opacity: 1;
            transform: scale(1.05) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.6) translateY(2px);
          }
        }
        .delay-200 {
          animation-delay: 200ms;
        }
        .delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  );
}