'use client';

import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Place } from '@/types';

/* ─── Types ─── */

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  place?: Place;
}

export interface TravelAssistantPanelHandle {
  selectPlace: (place: Place) => void;
}

interface TravelAssistantPanelProps {
  selectedPlace: Place | null;
  onClearSelection: () => void;
}

/* ─── Helpers ─── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[9px] font-medium text-gray-500 uppercase tracking-[0.14em] mb-2.5 ml-0.5">
      {children}
    </h4>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? 'text-[#C9A84C]' : 'text-gray-700'}
          style={{ fontSize: '11px' }}
        >
          ★
        </span>
      ))}
      <span className="text-[10px] text-gray-400 ml-1">{rating}</span>
    </div>
  );
}

/* ─── Place Details Card ─── */

function PlaceDetailsCard({
  place,
  onAddToItinerary,
}: {
  place: Place;
  onAddToItinerary: () => void;
}) {
  return (
    <div className="animate-fade-in-up stagger-1">
      <SectionLabel>Place Details</SectionLabel>
      <div className="bg-[#141414] rounded-[6px] border border-[#1C1C1C] overflow-hidden">
        {/* Gradient header */}
        <div className={`h-20 bg-gradient-to-br ${place.gradient} relative`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-2.5 bg-gradient-to-t from-[#141414] to-transparent">
            <span className="inline-block text-[9px] text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/25 rounded-[4px] px-2 py-[2px] mb-1 uppercase tracking-wider">
              {place.category}
            </span>
            <h3 className="text-[13px] font-medium text-gray-100 tracking-wide">{place.name}</h3>
          </div>
        </div>

        {/* Info body */}
        <div className="px-3.5 py-3 space-y-3">
          {/* Rating & Distance */}
          <div className="flex items-center justify-between">
            <StarRating rating={place.rating} />
            <span className="text-[10px] text-gray-500 flex items-center space-x-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{place.distance}</span>
            </span>
          </div>

          {/* Description */}
          <p className="text-[11px] text-gray-300 leading-[1.7]">
            {place.description}
          </p>

          {/* AI Rundown */}
          <div className="bg-[#0F0F0F] rounded-[5px] p-3 border border-[#1A1A1A]">
            <div className="flex items-center space-x-1.5 mb-2">
              <span className="text-[9px] text-[#C9A84C]">✦</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">Concierge Notes</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-[1.7]">
              {place.aiRundown}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            {/* Book externally */}
            <a
              href={place.bookingUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 w-full bg-[#C9A84C] hover:bg-[#D4B85C] text-[#0A0A0A] text-[11px] font-medium py-2.5 rounded-[6px] transition-colors duration-200 tracking-wide"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Book This Place</span>
            </a>

            {/* Add to itinerary */}
            <button
              onClick={onAddToItinerary}
              className="flex items-center justify-center space-x-2 w-full border border-[#C9A84C]/25 hover:border-[#C9A84C]/50 text-[#C9A84C] text-[11px] py-2.5 rounded-[6px] transition-all duration-200 tracking-wide hover:bg-[#C9A84C]/5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="12" y1="14" x2="12" y2="18" />
                <line x1="10" y1="16" x2="14" y2="16" />
              </svg>
              <span>Add to Itinerary</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Chat Message Bubble ─── */

function ChatBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} animate-fade-in-up`}>
      <div
        className={`max-w-[90%] rounded-[6px] px-3.5 py-2.5 ${
          isAssistant
            ? 'bg-[#141414] border border-[#1C1C1C]'
            : 'bg-[#C9A84C]/10 border border-[#C9A84C]/20'
        }`}
      >
        {isAssistant && (
          <div className="flex items-center space-x-1.5 mb-1.5">
            <span className="text-[9px] text-[#C9A84C]">✦</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">Stayscape</span>
          </div>
        )}
        <p className={`text-[11px] leading-[1.7] ${isAssistant ? 'text-gray-300' : 'text-gray-200'}`}>
          {message.text}
        </p>
      </div>
    </div>
  );
}

/* ─── Suggestion chips ─── */

const defaultSuggestions = [
  'What should I do today?',
  'Best restaurants nearby',
  'Spa recommendations',
  'Things to do tonight',
];

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
  const addPlaceMessage = useCallback((place: Place) => {
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
    <div className="flex h-full overflow-hidden bg-[#0F0F0F] animate-slide-in-left">
      {/* Thin vertical accent rail */}
      <div className="w-[3px] flex-shrink-0 bg-gradient-to-b from-[#C9A84C]/20 via-[#C9A84C]/8 to-transparent" />

      {/* Main panel content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Panel Header */}
        <div className="px-4 pt-4 pb-3.5 border-b border-[#1A1A1A] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-[4px] bg-[#C9A84C]/8 border border-[#C9A84C]/15 flex items-center justify-center">
                <span className="text-[10px] text-[#C9A84C]">✦</span>
              </div>
              <div>
                <h2 className="text-[12px] font-medium text-gray-200 tracking-wide">Travel Assistant</h2>
              </div>
            </div>
            {selectedPlace && (
              <button
                onClick={onClearSelection}
                className="text-[10px] text-gray-500 hover:text-gray-300 bg-[#141414] border border-[#1C1C1C] rounded-[5px] px-2.5 py-1 transition-colors duration-200 tracking-wide"
              >
                Back to chat
              </button>
            )}
          </div>
          <p className="text-[9px] text-gray-600 mt-1.5 ml-7 tracking-wide">
            Your personal concierge · Ask anything
          </p>
        </div>

        {/* Scrollable messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-4">
          {/* Default greeting when no interaction yet */}
          {!hasInteracted && (
            <div className="flex flex-col items-center justify-center h-full text-center px-2">
              <div className="w-12 h-12 rounded-[8px] bg-[#C9A84C]/8 border border-[#C9A84C]/15 flex items-center justify-center mb-4">
                <span className="text-[18px] text-[#C9A84C]">✦</span>
              </div>
              <h3 className="text-[14px] font-medium text-gray-200 tracking-wide mb-2">
                Welcome to Stayscape
              </h3>
              <p className="text-[11px] text-gray-500 leading-[1.7] max-w-[240px] mb-6">
                I&apos;m your personal travel assistant. Ask me anything about your stay, nearby places, dining, activities, or select a place on the map to learn more.
              </p>
              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-1.5">
                {defaultSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="text-[10px] text-gray-400 bg-[#141414] border border-[#1C1C1C] rounded-[5px] px-2.5 py-[5px] hover:border-[#C9A84C]/20 hover:text-gray-300 transition-all duration-200 tracking-wide"
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
        <div className="px-4 py-3 border-t border-[#1A1A1A] flex-shrink-0">
          <div className="flex items-center space-x-2 bg-[#141414] border border-[#1C1C1C] rounded-[6px] px-3 py-2.5 focus-within:border-[#C9A84C]/20 transition-colors duration-200">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your stay…"
              className="flex-1 bg-transparent text-[11px] text-gray-300 placeholder-gray-600 focus:outline-none tracking-wide"
            />
            <button
              onClick={() => handleSend()}
              className="text-gray-600 hover:text-[#C9A84C] transition-colors duration-200"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 14-7-4 7 4 7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TravelAssistantPanel;

function getAssistantResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('restaurant') || lower.includes('dining') || lower.includes('eat')) {
    return "I'd recommend Nobu for world-class Japanese-Peruvian fusion, or Le Bernardin for an unforgettable three Michelin star seafood experience. Both are within walking distance. Would you like me to check availability for either?";
  }
  if (lower.includes('spa') || lower.includes('wellness') || lower.includes('relax')) {
    return "Our on-site spa offers a wonderful selection of treatments. I'd suggest the signature deep-tissue massage or the aromatherapy session. Would you like me to book a time slot for you?";
  }
  if (lower.includes('tonight') || lower.includes('evening') || lower.includes('night')) {
    return "For tonight, I'd suggest starting with cocktails at Bemelmans Bar — the live jazz is wonderful. Then perhaps a late dinner at Nobu. If you prefer something more relaxed, the hotel lounge has a curated tasting menu available until midnight.";
  }
  if (lower.includes('today') || lower.includes('do')) {
    return "It's a beautiful day! I'd suggest a morning stroll through Central Park — the path along the Mall is particularly scenic. After that, perhaps some shopping on Fifth Avenue, followed by afternoon tea at the hotel. Shall I plan a detailed itinerary?";
  }
  if (lower.includes('book') || lower.includes('reservation')) {
    return "I'd be happy to help with a booking. Just let me know the place, date, and time, and I'll arrange everything. If you've already booked externally, send me the details and I'll add it to your itinerary timeline.";
  }
  return "I'd be happy to help with that. Could you tell me a bit more about what you're looking for? I can assist with dining reservations, activity recommendations, spa bookings, transportation, or anything else during your stay.";
}
