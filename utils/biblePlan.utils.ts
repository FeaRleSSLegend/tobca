import AsyncStorage from '@react-native-async-storage/async-storage';
import { biblePlan, totalDays, DayPlan } from '../data/biblePlan';

const STORAGE_KEY = '@bible_progress';

export interface ReadingProgress {
  completedDays: string[]; // ['January 1', 'January 2']
  lastReadDate: string | null;
  currentStreak: number;
  longestStreak: number;
}

export function getTodayReading(): DayPlan | null {
  const today = new Date();
  const month = today.toLocaleString('default', { month: 'long' });
  const day = today.getDate();
  const dateString = `${month} ${day}`;
  
  return biblePlan.find(p => p.date === dateString) || null;
}

export function getDayByDate(dateString: string): DayPlan | null {
  return biblePlan.find(p => p.date === dateString) || null;
}

export async function getProgress(): Promise<ReadingProgress> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return {
      completedDays: [],
      lastReadDate: null,
      currentStreak: 0,
      longestStreak: 0
    };
  } catch (error) {
    console.error('Error loading progress:', error);
    return {
      completedDays: [],
      lastReadDate: null,
      currentStreak: 0,
      longestStreak: 0
    };
  }
}

export async function markDayAsRead(dateString: string): Promise<void> {
  try {
    const progress = await getProgress();
    if (!progress.completedDays.includes(dateString)) {
      progress.completedDays.push(dateString);
      
      // Update streak
      const today = new Date().toDateString();
      if (progress.lastReadDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();
        
        if (progress.lastReadDate === yesterdayString) {
          progress.currentStreak += 1;
        } else {
          progress.currentStreak = 1;
        }
        
        progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak);
        progress.lastReadDate = today;
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

export function getCompletionPercentage(completedDays: string[]): number {
  return Math.round((completedDays.length / totalDays) * 100);
}

export function getWeekProgress(): { day: string; status: 'completed' | 'today' | 'pending' }[] {
  const today = new Date();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result: { day: string; status: 'completed' | 'today' | 'pending' }[] = [];
  
  // Get the start of the week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    
    const isToday = date.toDateString() === today.toDateString();
    const month = date.toLocaleString('default', { month: 'long' });
    const dayNum = date.getDate();
    const dateString = `${month} ${dayNum}`;
    
    // Check if this day has been completed (we'd need to check AsyncStorage)
    // For now, we'll just mark today as 'today' and others as 'pending'
    let status: 'completed' | 'today' | 'pending' = 'pending';
    if (isToday) {
      status = 'today';
    }
    
    result.push({
      day: weekDays[i],
      status
    });
  }
  
  return result;
}

export async function isDayCompleted(dateString: string): Promise<boolean> {
  const progress = await getProgress();
  return progress.completedDays.includes(dateString);
}