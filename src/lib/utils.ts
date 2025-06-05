import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generatePostId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  // The sequential number (000-999) needs backend logic.
  // For frontend mock, we use a timestamp-based suffix for more uniqueness in mock.
  const sequentialSuffix = (now.getTime() % 1000).toString().padStart(3, '0');
  return `${year}_${month}_${day}_${hours}_HEMUNG_${sequentialSuffix}`;
}

export function formatDate(dateString: string | Date, dateFormat: string = 'dd/MM/yyyy'): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, dateFormat);
  } catch (error) {
    return String(dateString); // Fallback if date is invalid
  }
}