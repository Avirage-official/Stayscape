'use client';

import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Place, MapPlace } from '@/types';
import ChatBubble from '@/components/assistant/ChatBubble';
import type { ChatMessage } from '@/components/assistant/ChatBubble';
import PlaceDetailsCard from '@/components/assistant/PlaceDetailsCard';
import { defaultSuggestions } from '@/components/assistant/assistant-responses';
import { sendChatMessage } from '@/lib/ai/chat';

/* ─── Types ─── */

export interface TravelAssistantPanelHandle {
  selectPlace: (place: Place | MapPlace) => void;
}

interface TravelAssistantPanelProps {
  selectedPlace: Place | MapPlace | null;
  onClearSelection: () => void;
  stayId?: string | null;
}

/* ─── Main Component ─── */

const TravelAssistantPanel = forwardRef<TravelAssistantPanelHandle, TravelAssistantPanelProps>(
  function TravelAssistantPanel({ selectedPlace, onClearSelection, stayId }, ref) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(0);

  const hasInteracted = messages.length > 0;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Expose selectPlace handler to the parent via ref
  const addPlaceMessage = useCallback((place: Place | MapPlace) => {
    const id = `place-${++idCounterRef.current}`;
    const placeMessage: ChatMessage = {
      id,
      role: 'assistant',
      text: `You selected ${place.name} — let me check it for you. Here are the details I found. If you decide to book it, just send me the date and time and I'll add it to your itinerary.`,
      place,
    };
    setMessages((prev) => [...prev, placeMessage]);
  }, []);

  useImperativeHandle(ref, () => ({
    selectPlace: addPlaceMessage,
  }), [addPlaceMessage]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${++idCounterRef.current}`,
      role: 'user',
      text: messageText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const reply = await sendChatMessage(
      messageText,
      stayId,
      'discovery',
    );

    const assistantMsg: ChatMessage = {
      id: `assistant-${++idCounterRef.current}`,
      role: 'assistant',
      text: reply,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  const handleAddToItinerary = () => {
    if (!selectedPlace) return;

    const assistantMsg: ChatMessage = {
      id: `itinerary-${++idCounterRef.current}`,
      role: 'assistant',
      text: `Great choice! To add ${selectedPlace.name} to your itinerary, just let me know the date and time you'd like to go, and I'll take care of the rest.`,
    };

    setMessages((prev) => [...prev, assistantMsg]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-slide-in-right">
        {/* Panel Header */}
        <div className="px-4 pt-4 pb-3.5 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
                <span className="text-[11px] text-[#C9A84C]">✦</span>
              </div>
              <div>
                <h2 className="text-[13px] font-medium text-white tracking-wide">Travel Assistant</h2>
              </div>
            </div>
            {selectedPlace && (
              <button
                onClick={onClearSelection}
                className="text-[10px] text-white/45 hover:text-white/75 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 transition-colors cursor-pointer"
              >
                Back to chat
              </button>
            )}
          </div>
          <p className="text-[9px] text-white/35 mt-1 tracking-wide">
            Your personal concierge · Ask anything
          </p>
          <p className="text-[9px] text-white/25 mt-0.5 tracking-wide">
            Each message starts fresh — no memory of previous turns
          </p>
        </div>

        {/* Scrollable messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-4">
          {/* Default greeting when no interaction yet */}
          {!hasInteracted && (
            <div className="flex flex-col items-center justify-center h-full text-center px-2">
              <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/8 border border-[#C9A84C]/15 flex items-center justify-center mb-4">
                <span className="text-[18px] text-[#C9A84C]">✦</span>
              </div>
              <h3 className="text-[14px] font-medium text-white tracking-wide mb-2">
                Welcome to Stayscape
              </h3>
              <p className="text-[11px] text-white/45 leading-[1.7] max-w-[240px] mb-6">
                I&apos;m your personal travel assistant. Ask me anything about your stay, nearby places, dining, activities, or select a place on the map to learn more.
              </p>
              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-1.5">
                {defaultSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="text-[10px] text-white/55 bg-white/5 border border-white/10 rounded-lg px-2.5 py-[5px] hover:border-[#C9A84C]/20 hover:text-white/80 transition-all cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {hasInteracted && (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id}>
                  <ChatBubble message={msg} />
                  {/* Show place details card after the place-context message */}
                  {msg.place && (
                    <div className="mt-3 ml-0">
                      <PlaceDetailsCard
                        place={msg.place}
                        onAddToItinerary={handleAddToItinerary}
                      />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 px-1">
                  <div className="w-5 h-5 rounded-lg bg-[#C9A84C]/8 border border-[#C9A84C]/15 flex items-center justify-center">
                    <span className="text-[10px] text-[#C9A84C]">✦</span>
                  </div>
                  <span className="text-[10px] text-white/40 animate-pulse">
                    Thinking…
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat input — always visible at bottom */}
        <div className="px-4 py-3 border-t border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white/8 border border-white/12 rounded-xl px-3 py-2.5 focus-within:border-[#C9A84C]/30 transition-colors duration-200">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your stay…"
              disabled={isLoading}
              className="text-[11px] text-white placeholder-white/30 bg-transparent focus:outline-none flex-1"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading}
              className="text-white/30 hover:text-[#C9A84C] transition-colors duration-200 cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 14-7-4 7 4 7z" />
              </svg>
            </button>
          </div>
        </div>
    </div>
  );
});

export default TravelAssistantPanel;
