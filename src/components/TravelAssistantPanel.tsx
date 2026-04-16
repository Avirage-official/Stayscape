'use client';

import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Place, MapPlace } from '@/types';
import ChatBubble from '@/components/assistant/ChatBubble';
import type { ChatMessage } from '@/components/assistant/ChatBubble';
import PlaceDetailsCard from '@/components/assistant/PlaceDetailsCard';
import { getAssistantResponse, defaultSuggestions } from '@/components/assistant/assistant-responses';

/* ─── Types ─── */

export interface TravelAssistantPanelHandle {
  selectPlace: (place: Place | MapPlace) => void;
}

interface TravelAssistantPanelProps {
  selectedPlace: Place | MapPlace | null;
  onClearSelection: () => void;
}

/* ─── Main Component ─── */

const TravelAssistantPanel = forwardRef<TravelAssistantPanelHandle, TravelAssistantPanelProps>(
  function TravelAssistantPanel({ selectedPlace, onClearSelection }, ref) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

  const handleSend = (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMsg: ChatMessage = {
      id: `user-${++idCounterRef.current}`,
      role: 'user',
      text: messageText,
    };

    const assistantMsg: ChatMessage = {
      id: `assistant-${++idCounterRef.current}`,
      role: 'assistant',
      text: getAssistantResponse(messageText),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInputValue('');
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
    <div className="flex flex-col h-full overflow-hidden bg-[var(--dashboard-bg)] animate-slide-in-right">
        {/* Panel Header */}
        <div className="px-4 pt-4 pb-3.5 border-b border-[var(--dashboard-card-border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-[4px] bg-[var(--gold)]/8 border border-[var(--gold)]/15 flex items-center justify-center">
                <span className="text-[10px] text-[var(--gold)]">✦</span>
              </div>
              <div>
                <h2 className="text-[12px] font-medium text-[var(--text-primary)] tracking-wide">Travel Assistant</h2>
              </div>
            </div>
            {selectedPlace && (
              <button
                onClick={onClearSelection}
                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[5px] px-2.5 py-1 transition-colors duration-200 tracking-wide"
              >
                Back to chat
              </button>
            )}
          </div>
          <p className="text-[9px] text-[var(--text-faint)] mt-1.5 ml-7 tracking-wide">
            Your personal concierge · Ask anything
          </p>
        </div>

        {/* Scrollable messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-4">
          {/* Default greeting when no interaction yet */}
          {!hasInteracted && (
            <div className="flex flex-col items-center justify-center h-full text-center px-2">
              <div className="w-12 h-12 rounded-[8px] bg-[var(--gold)]/8 border border-[var(--gold)]/15 flex items-center justify-center mb-4">
                <span className="text-[18px] text-[var(--gold)]">✦</span>
              </div>
              <h3 className="text-[14px] font-medium text-[var(--text-primary)] tracking-wide mb-2">
                Welcome to Stayscape
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] leading-[1.7] max-w-[240px] mb-6">
                I&apos;m your personal travel assistant. Ask me anything about your stay, nearby places, dining, activities, or select a place on the map to learn more.
              </p>
              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-1.5">
                {defaultSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="text-[10px] text-[var(--text-secondary)] bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] rounded-[5px] px-2.5 py-[5px] hover:border-[var(--gold)]/20 hover:text-[var(--text-primary)] transition-all duration-200 tracking-wide"
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
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat input — always visible at bottom */}
        <div className="px-4 py-3 border-t border-[var(--dashboard-card-border)] flex-shrink-0">
          <div className="flex items-center space-x-2 bg-[var(--dashboard-card-bg)] border border-[var(--dashboard-card-border)] rounded-[6px] px-3 py-2.5 focus-within:border-[var(--gold)]/20 transition-colors duration-200">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your stay…"
              className="flex-1 bg-transparent text-[11px] text-[var(--text-secondary)] placeholder-[var(--text-faint)] focus:outline-none tracking-wide"
            />
            <button
              onClick={() => handleSend()}
              className="text-[var(--text-faint)] hover:text-[var(--gold)] transition-colors duration-200"
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
