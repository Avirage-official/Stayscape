export function getAssistantResponse(input: string): string {
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

export const defaultSuggestions = [
  'What should I do today?',
  'Best restaurants nearby',
  'Spa recommendations',
  'Things to do tonight',
];
