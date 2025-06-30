import { useState, useEffect } from 'react';

export const useLuckyNumber = () => {
  const [luckyNumber, setLuckyNumber] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLuckyNumber(prev => {
        if (prev >= 99999) {
          return 0; // Reset to 0 after reaching 99999
        }
        return prev + 1;
      });
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, []);

  // Format the number based on its value
  const formatNumber = (num: number): string => {
    if (num <= 9999) {
      return num.toString().padStart(4, '0'); // 4 digits with leading zeros (0000-9999)
    } else {
      return num.toString(); // 5 digits (10000-99999)
    }
  };

  return formatNumber(luckyNumber);
};

// Generate a lucky number for each post based on post ID
export const generatePostLuckyNumber = (postId: string): string => {
  // Use post ID to generate a consistent lucky number for each post
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    const char = postId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Ensure positive number and limit to 99999
  const number = Math.abs(hash) % 100000;
  
  // Format based on value
  if (number <= 9999) {
    return number.toString().padStart(4, '0');
  } else {
    return number.toString();
  }
}; 