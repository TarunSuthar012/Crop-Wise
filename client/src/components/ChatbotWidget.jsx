import React, { useState, useEffect, useRef } from 'react';

export default function ChatbotWidget({ farmerContext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am Kisan Mitra, your Agri-Assistant. How can I help you with your crops, weather, mandi prices, or government schemes today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [defaultQuestions, setDefaultQuestions] = useState([]);
  
  const messagesEndRef = useRef(null);
  const chatbotBase = "/chatbot-api";

  // Fetch default questions from backend on mount
  useEffect(() => {
    fetch(`${chatbotBase}/default-questions`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        if (data.questions) setDefaultQuestions(data.questions);
      })
      .catch(() => {
        // Fallback default questions in English
        setDefaultQuestions([
          "How will the rainfall and soil moisture be in my area this week?",
          "Where can I get the best mandi price for my crop today?",
          "What government schemes are active in my state?",
          "What fertilizer (NPK) do I need for my crop?"
        ]);
      });
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    // Prepare farmer context payload
    const ctx = farmerContext ? {
      district: farmerContext.district || null,
      state: farmerContext.state || null,
      primary_crop: farmerContext.primary_crop || null,
      crop_stage: farmerContext.crop_stage || null,
      land_area: farmerContext.land_area ? Number(farmerContext.land_area) : null,
      land_unit: farmerContext.land_unit || null,
      preferred_language: farmerContext.preferred_language || null,
    } : null;

    // Build chat history formatted for backend (last 6 messages)
    const history = newMessages.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      const response = await fetch(`${chatbotBase}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          farmer_context: ctx,
          history: history
        })
      });

      if (!response.ok) {
        throw new Error("Chatbot API response error");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I am having trouble connecting to the services right now. Please try again in a moment."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all focus:outline-none relative group"
        aria-label="Toggle Kisan Mitra Chat"
        title="Toggle Kisan Mitra Chat"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742h.016M12 10.742h.016M15.3 10.742h.016M8 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15" />
          </svg>
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-bold items-center justify-center">1</span>
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[500px] rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/80 shadow-2xl flex flex-col overflow-hidden animate-fade-in transition-all">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="text-xl">🧑‍🌾</span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-wide">Kisan Mitra</h4>
                <p className="text-[10px] text-emerald-100 font-medium flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Your Agri-Assistant &bull; Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-all focus:outline-none"
              aria-label="Close Chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-stone-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none'
                    : 'bg-white border border-stone-200/80 text-stone-700 rounded-tl-none'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white border border-stone-200/80 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Default Prompts (show when only the initial message is present) */}
          {messages.length === 1 && !isTyping && defaultQuestions.length > 0 && (
            <div className="p-3 bg-stone-50/80 border-t border-stone-100 space-y-1.5 max-h-[160px] overflow-y-auto">
              <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold px-2">Suggestions</p>
              <div className="grid grid-cols-1 gap-1.5">
                {defaultQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="w-full text-left px-3 py-2 rounded-xl bg-white border border-stone-200/60 text-xs font-semibold text-stone-600 hover:border-emerald-500 hover:text-emerald-700 transition-all truncate"
                  >
                    💡 {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-stone-100 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              placeholder="Ask anything about farming..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200/80 bg-stone-50 text-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium disabled:opacity-65"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={isTyping || !inputValue.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shrink-0"
              aria-label="Send Message"
            >
              <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
