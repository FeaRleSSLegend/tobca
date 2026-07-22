import { DayPlan } from '../data/biblePlan';

export function parseBiblePlanLine(line: string): DayPlan | null {
  // Parse "January 1: Genesis 1:1-31, 2:1-25, Matthew 1:1-25, 2:1-12, Psalm 1:1-6, Proverbs 1:1-6"
  const match = line.match(/^(\w+ \d+):\s*(.+)$/);
  if (!match) return null;
  
  const [_, date, readings] = match;
  const parts = readings.split(',').map(s => s.trim());
  
  // Extract OT, NT, Psalm, Proverb
  // The format is: OT1, OT2, NT, Psalm, Proverb
  const oldTestament = parts.slice(0, 2).join(', ');
  const newTestament = parts[2] || '';
  const psalm = parts[3] || '';
  const proverb = parts[4] || '';
  
  return {
    day: getDayNumber(date),
    month: getMonth(date),
    date: date,
    oldTestament,
    newTestament,
    psalm,
    proverb
  };
}

function getDayNumber(dateString: string): number {
  const parts = dateString.split(' ');
  return parseInt(parts[1], 10);
}

function getMonth(dateString: string): string {
  const parts = dateString.split(' ');
  return parts[0];
}

// Helper to parse multiple lines from PDF
export function parseBiblePlanText(text: string): DayPlan[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const plan: DayPlan[] = [];
  
  for (const line of lines) {
    const parsed = parseBiblePlanLine(line);
    if (parsed) {
      plan.push(parsed);
    }
  }
  
  return plan;
}