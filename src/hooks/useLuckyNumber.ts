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
  // Lấy 3 ký tự cuối cùng của postId, chuyển sang số, lấy mod 1000
  let last3 = postId.slice(-3);
  // Nếu không phải số, chuyển ký tự sang mã charCode rồi cộng lại
  let num = 0;
  if (/^\d{3}$/.test(last3)) {
    num = parseInt(last3, 10);
  } else {
    for (let i = 0; i < last3.length; i++) {
      num += last3.charCodeAt(i);
    }
    num = num % 1000;
  }
  return num.toString().padStart(3, '0');
}; 