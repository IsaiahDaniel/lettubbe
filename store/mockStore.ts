// helpers/mockData/callHistory.ts

import { CallHistoryItem, CallType } from '@/helpers/types/chat/call';

// Function to generate a random date within the last week
const getRandomRecentDate = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 7); // 0-6 days ago
  const hoursAgo = Math.floor(Math.random() * 24); // 0-23 hours ago
  const minutesAgo = Math.floor(Math.random() * 60); // 0-59 minutes ago
  
  now.setDate(now.getDate() - daysAgo);
  now.setHours(now.getHours() - hoursAgo);
  now.setMinutes(now.getMinutes() - minutesAgo);
  
  return now;
};

// Generate a specific number of mock calls
export const generateMockCallHistory = (count = 20): CallHistoryItem[] => {
  const contactIds = ['1', '2', '3', '4']; // Using the mock contact IDs from contactStore
  const callTypes: CallType[] = ['audio', 'video'];
  const mockCalls: CallHistoryItem[] = [];
  
  // Generate random calls
  for (let i = 0; i < count; i++) {
    const contactId = contactIds[Math.floor(Math.random() * contactIds.length)];
    const callType = callTypes[Math.floor(Math.random() * callTypes.length)];
    const isOutgoing = Math.random() > 0.5;
    const isMissed = !isOutgoing && Math.random() > 0.7; // Only incoming calls can be missed
    const timestamp = getRandomRecentDate();
    
    // For connected calls, add a duration
    const duration = isMissed ? undefined : Math.floor(Math.random() * 300) + 10; // 10-310 seconds
    
    const mockCall: CallHistoryItem = {
      id: `call-mock-${i}-${Date.now()}`,
      contactId,
      type: callType,
      direction: isOutgoing ? 'outgoing' : 'incoming',
      timestamp,
      missed: isMissed,
      duration,
      groupCall: Math.random() > 0.8, // 20% chance of being a group call
    };
    
    mockCalls.push(mockCall);
  }
  
  // Sort calls by timestamp (newest first)
  return mockCalls.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

// Create a set of predefined mock calls to ensure we have all types for testing
export const createPredefinedMockCalls = (): CallHistoryItem[] => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const predefinedCalls: CallHistoryItem[] = [
    // Today's calls
    {
      id: 'call-today-1',
      contactId: '1', // John Doe
      type: 'audio',
      direction: 'incoming',
      timestamp: new Date(now.setHours(now.getHours() - 1)),
      missed: false,
      duration: 120,
      groupCall: false
    },
    {
      id: 'call-today-2',
      contactId: '2', // Jane Smith
      type: 'video',
      direction: 'outgoing',
      timestamp: new Date(now.setHours(now.getHours() - 3)),
      missed: false,
      duration: 300,
      groupCall: false
    },
    {
      id: 'call-today-3',
      contactId: '3', // Alice Johnson
      type: 'audio',
      direction: 'incoming',
      timestamp: new Date(now.setHours(now.getHours() - 4)),
      missed: true,
      groupCall: false
    },
    
    // Yesterday's calls
    {
      id: 'call-yesterday-1',
      contactId: '4', // Bob Brown
      type: 'video',
      direction: 'incoming',
      timestamp: new Date(yesterday.setHours(yesterday.getHours() - 2)),
      missed: false,
      duration: 180,
      groupCall: true
    },
    {
      id: 'call-yesterday-2',
      contactId: '1', // John Doe
      type: 'audio',
      direction: 'outgoing',
      timestamp: new Date(yesterday.setHours(yesterday.getHours() - 5)),
      missed: false,
      duration: 60,
      groupCall: false
    },
    
    // Two days ago
    {
      id: 'call-twodays-1',
      contactId: '2', // Jane Smith
      type: 'video',
      direction: 'incoming',
      timestamp: new Date(twoDaysAgo),
      missed: true,
      groupCall: false
    }
  ];

  // Add some random calls
  const randomCalls = generateMockCallHistory(14);
  
  // Combine and sort by timestamp (newest first)
  return [...predefinedCalls, ...randomCalls].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

// Export a ready-to-use set of mock calls
export const mockCallHistory = createPredefinedMockCalls();