export interface DayPlan {
  day: number;
  month: string;
  date: string;
  oldTestament: string;
  newTestament: string;
  psalm: string;
  proverb: string;
}

export const totalDays = 365;

export const biblePlan: DayPlan[] = [
  // ===== JANUARY =====
  {
    day: 1,
    month: 'January',
    date: 'January 1',
    oldTestament: 'Genesis 1:1-31, 2:1-25',
    newTestament: 'Matthew 1:1-25, 2:1-12',
    psalm: 'Psalm 1:1-6',
    proverb: 'Proverbs 1:1-6'
  },
  {
    day: 2,
    month: 'January',
    date: 'January 2',
    oldTestament: 'Genesis 3:1-24, 4:1-26',
    newTestament: 'Matthew 2:1-23, 3:1-6',
    psalm: 'Psalm 2:1-12',
    proverb: 'Proverbs 1:7-9'
  },
  {
    day: 3,
    month: 'January',
    date: 'January 3',
    oldTestament: 'Genesis 5:1-32, 6:1-22, 7:1-24',
    newTestament: 'Matthew 3:7-17, 4:1-11',
    psalm: 'Psalm 3:1-8',
    proverb: 'Proverbs 1:10-19'
  },
  {
    day: 4,
    month: 'January',
    date: 'January 4',
    oldTestament: 'Genesis 8:1-22, 9:1-29, 10:1-32',
    newTestament: 'Matthew 4:12-25',
    psalm: 'Psalm 4:1-8',
    proverb: 'Proverbs 1:20-23'
  },
  {
    day: 5,
    month: 'January',
    date: 'January 5',
    oldTestament: 'Genesis 11:1-32, 12:1-20, 13:1-4',
    newTestament: 'Matthew 5:1-26',
    psalm: 'Psalm 5:1-12',
    proverb: 'Proverbs 1:24-28'
  },
  {
    day: 6,
    month: 'January',
    date: 'January 6',
    oldTestament: 'Genesis 13:5-18, 14:1-24, 15:1-21',
    newTestament: 'Matthew 5:27-48',
    psalm: 'Psalm 6:1-10',
    proverb: 'Proverbs 1:29-33'
  },
  {
    day: 7,
    month: 'January',
    date: 'January 7',
    oldTestament: 'Genesis 16:1-16, 17:1-27, 18:1-19',
    newTestament: 'Matthew 6:1-24',
    psalm: 'Psalm 7:1-17',
    proverb: 'Proverbs 2:1-5'
  },
  {
    day: 8,
    month: 'January',
    date: 'January 8',
    oldTestament: 'Genesis 18:20-33, 19:1-38',
    newTestament: 'Matthew 6:25-34, 7:1-14',
    psalm: 'Psalm 8:1-9',
    proverb: 'Proverbs 2:6-15'
  },
  {
    day: 9,
    month: 'January',
    date: 'January 9',
    oldTestament: 'Genesis 20:1-18, 21:1-34, 22:1-24',
    newTestament: 'Matthew 7:15-29',
    psalm: 'Psalm 9:1-12',
    proverb: 'Proverbs 2:16-22'
  },
  {
    day: 10,
    month: 'January',
    date: 'January 10',
    oldTestament: 'Genesis 23:1-20, 24:1-51',
    newTestament: 'Matthew 8:1-17',
    psalm: 'Psalm 9:13-20',
    proverb: 'Proverbs 3:1-6'
  },
  {
    day: 11,
    month: 'January',
    date: 'January 11',
    oldTestament: 'Genesis 24:52-67, 25:1-34, 26:1-16',
    newTestament: 'Matthew 8:18-34',
    psalm: 'Psalm 10:1-15',
    proverb: 'Proverbs 3:7-8'
  },
  {
    day: 12,
    month: 'January',
    date: 'January 12',
    oldTestament: 'Genesis 26:17-35, 27:1-46',
    newTestament: 'Matthew 9:1-17',
    psalm: 'Psalm 10:16-18',
    proverb: 'Proverbs 3:9-10'
  },
  {
    day: 13,
    month: 'January',
    date: 'January 13',
    oldTestament: 'Genesis 28:1-22, 29:1-35',
    newTestament: 'Matthew 9:18-38',
    psalm: 'Psalm 11:1-7',
    proverb: 'Proverbs 3:11-12'
  },
  {
    day: 14,
    month: 'January',
    date: 'January 14',
    oldTestament: 'Genesis 30:1-43, 31:1-16',
    newTestament: 'Matthew 10:1-25',
    psalm: 'Psalm 12:1-8',
    proverb: 'Proverbs 3:13-15'
  },
  {
    day: 15,
    month: 'January',
    date: 'January 15',
    oldTestament: 'Genesis 31:17-55, 32:1-12',
    newTestament: 'Matthew 10:26-42, 11:1-6',
    psalm: 'Psalm 13:1-6',
    proverb: 'Proverbs 3:16-18'
  },
  {
    day: 16,
    month: 'January',
    date: 'January 16',
    oldTestament: 'Genesis 32:13-32, 33:1-20, 34:1-31',
    newTestament: 'Matthew 11:7-30',
    psalm: 'Psalm 14:1-7',
    proverb: 'Proverbs 3:19-20'
  },
  {
    day: 17,
    month: 'January',
    date: 'January 17',
    oldTestament: 'Genesis 35:1-29, 36:1-43',
    newTestament: 'Matthew 12:1-21',
    psalm: 'Psalm 15:1-5',
    proverb: 'Proverbs 3:21-26'
  },
  {
    day: 18,
    month: 'January',
    date: 'January 18',
    oldTestament: 'Genesis 37:1-36, 38:1-30',
    newTestament: 'Matthew 12:22-45',
    psalm: 'Psalm 16:1-11',
    proverb: 'Proverbs 3:27-32'
  },
  {
    day: 19,
    month: 'January',
    date: 'January 19',
    oldTestament: 'Genesis 39:1-23, 40:1-23, 41:1-16',
    newTestament: 'Matthew 12:46-50, 13:1-23',
    psalm: 'Psalm 17:1-15',
    proverb: 'Proverbs 3:33-35'
  },
  {
    day: 20,
    month: 'January',
    date: 'January 20',
    oldTestament: 'Genesis 41:17-57, 42:1-17',
    newTestament: 'Matthew 13:24-46',
    psalm: 'Psalm 18:1-15',
    proverb: 'Proverbs 4:1-6'
  },
  {
    day: 21,
    month: 'January',
    date: 'January 21',
    oldTestament: 'Genesis 42:18-38, 43:1-34',
    newTestament: 'Matthew 13:47-58, 14:1-12',
    psalm: 'Psalm 18:16-36',
    proverb: 'Proverbs 4:7-10'
  },
  {
    day: 22,
    month: 'January',
    date: 'January 22',
    oldTestament: 'Genesis 44:1-34, 45:1-28',
    newTestament: 'Matthew 14:13-36',
    psalm: 'Psalm 18:37-50',
    proverb: 'Proverbs 4:11-13'
  },
  {
    day: 23,
    month: 'January',
    date: 'January 23',
    oldTestament: 'Genesis 46:1-34, 47:1-31',
    newTestament: 'Matthew 15:1-28',
    psalm: 'Psalm 19:1-14',
    proverb: 'Proverbs 4:14-19'
  },
  {
    day: 24,
    month: 'January',
    date: 'January 24',
    oldTestament: 'Genesis 48:1-22, 49:1-33',
    newTestament: 'Matthew 15:29-39, 16:1-12',
    psalm: 'Psalm 20:1-9',
    proverb: 'Proverbs 4:20-27'
  },
  {
    day: 25,
    month: 'January',
    date: 'January 25',
    oldTestament: 'Genesis 50:1-26, Exodus 1:1-22, 2:1-10',
    newTestament: 'Matthew 16:13-28, 17:1-9',
    psalm: 'Psalm 21:1-13',
    proverb: 'Proverbs 5:1-6'
  },
  {
    day: 26,
    month: 'January',
    date: 'January 26',
    oldTestament: 'Exodus 2:11-25, 3:1-22',
    newTestament: 'Matthew 17:10-27',
    psalm: 'Psalm 22:1-18',
    proverb: 'Proverbs 5:7-14'
  },
  {
    day: 27,
    month: 'January',
    date: 'January 27',
    oldTestament: 'Exodus 4:1-31, 5:1-21',
    newTestament: 'Matthew 18:1-22',
    psalm: 'Psalm 22:19-31',
    proverb: 'Proverbs 5:15-21'
  },
  {
    day: 28,
    month: 'January',
    date: 'January 28',
    oldTestament: 'Exodus 5:22-23, 6:1-30, 7:1-24',
    newTestament: 'Matthew 18:23-35, 19:1-12',
    psalm: 'Psalm 23:1-6',
    proverb: 'Proverbs 5:22-23'
  },
  {
    day: 29,
    month: 'January',
    date: 'January 29',
    oldTestament: 'Exodus 7:25, 8:1-32, 9:1-35',
    newTestament: 'Matthew 19:13-30',
    psalm: 'Psalm 24:1-10',
    proverb: 'Proverbs 6:1-5'
  },
  {
    day: 30,
    month: 'January',
    date: 'January 30',
    oldTestament: 'Exodus 10:1-29, 11:1-10, 12:1-13',
    newTestament: 'Matthew 20:1-28',
    psalm: 'Psalm 25:1-15',
    proverb: 'Proverbs 6:6-11'
  },
  {
    day: 31,
    month: 'January',
    date: 'January 31',
    oldTestament: 'Exodus 12:14-51, 13:1-16',
    newTestament: 'Matthew 20:29-34, 21:1-22',
    psalm: 'Psalm 25:16-22',
    proverb: 'Proverbs 6:12-15'
  },

  // ===== FEBRUARY =====
  {
    day: 32,
    month: 'February',
    date: 'February 1',
    oldTestament: 'Exodus 13:17-22, 14:1-31, 15:1-21',
    newTestament: 'Matthew 21:23-46',
    psalm: 'Psalm 26:1-12',
    proverb: 'Proverbs 6:16-19'
  },
  {
    day: 33,
    month: 'February',
    date: 'February 2',
    oldTestament: 'Exodus 15:22-27, 16:1-36, 17:1-7',
    newTestament: 'Matthew 22:1-33',
    psalm: 'Psalm 27:1-6',
    proverb: 'Proverbs 6:20-26'
  },
  {
    day: 34,
    month: 'February',
    date: 'February 3',
    oldTestament: 'Exodus 17:8-16, 18:1-27, 19:1-25',
    newTestament: 'Matthew 22:34-46, 23:1-12',
    psalm: 'Psalm 27:7-14',
    proverb: 'Proverbs 6:27-35'
  },
  {
    day: 35,
    month: 'February',
    date: 'February 4',
    oldTestament: 'Exodus 20:1-26, 21:1-36, 22:1-15',
    newTestament: 'Matthew 23:13-39',
    psalm: 'Psalm 28:1-9',
    proverb: 'Proverbs 7:1-5'
  },
  {
    day: 36,
    month: 'February',
    date: 'February 5',
    oldTestament: 'Exodus 22:16-31, 23:1-13, 24:1-18',
    newTestament: 'Matthew 24:1-28',
    psalm: 'Psalm 29:1-11',
    proverb: 'Proverbs 7:6-23'
  },
  {
    day: 37,
    month: 'February',
    date: 'February 6',
    oldTestament: 'Exodus 24:19-33, 25:1-40, 26:1-30',
    newTestament: 'Matthew 24:29-51',
    psalm: 'Psalm 30:1-12',
    proverb: 'Proverbs 7:24-27'
  },
  {
    day: 38,
    month: 'February',
    date: 'February 7',
    oldTestament: 'Exodus 26:31-37, 27:1-21, 28:1-43',
    newTestament: 'Matthew 25:1-30',
    psalm: 'Psalm 31:1-8',
    proverb: 'Proverbs 8:1-11'
  },
  {
    day: 39,
    month: 'February',
    date: 'February 8',
    oldTestament: 'Exodus 29:1-46, 30:1-10',
    newTestament: 'Matthew 25:31-46, 26:1-13',
    psalm: 'Psalm 31:9-18',
    proverb: 'Proverbs 8:12-13'
  },
  {
    day: 40,
    month: 'February',
    date: 'February 9',
    oldTestament: 'Exodus 30:11-38, 31:1-18, 32:1-35',
    newTestament: 'Matthew 26:14-46',
    psalm: 'Psalm 31:19-24',
    proverb: 'Proverbs 8:14-26'
  },
  {
    day: 41,
    month: 'February',
    date: 'February 10',
    oldTestament: 'Exodus 33:1-23, 34:1-35, 35:1-9',
    newTestament: 'Matthew 26:47-68',
    psalm: 'Psalm 32:1-11',
    proverb: 'Proverbs 8:27-32'
  },
  {
    day: 42,
    month: 'February',
    date: 'February 11',
    oldTestament: 'Exodus 35:10-35, 36:1-38, 37:1-29',
    newTestament: 'Matthew 26:69-75, 27:1-14',
    psalm: 'Psalm 33:1-11',
    proverb: 'Proverbs 8:33-36'
  },
  {
    day: 43,
    month: 'February',
    date: 'February 12',
    oldTestament: 'Exodus 38:1-31, 39:1-43, 40:1-38',
    newTestament: 'Matthew 27:15-31',
    psalm: 'Psalm 33:12-22',
    proverb: 'Proverbs 9:1-6'
  },
  {
    day: 44,
    month: 'February',
    date: 'February 13',
    oldTestament: 'Leviticus 1:1-17, 2:1-16, 3:1-17',
    newTestament: 'Matthew 27:32-66',
    psalm: 'Psalm 34:1-10',
    proverb: 'Proverbs 9:7-8'
  },
  {
    day: 45,
    month: 'February',
    date: 'February 14',
    oldTestament: 'Leviticus 4:1-35, 5:1-19, 6:1-7',
    newTestament: 'Matthew 28:1-20',
    psalm: 'Psalm 34:11-22',
    proverb: 'Proverbs 9:9-10'
  },
  {
    day: 46,
    month: 'February',
    date: 'February 15',
    oldTestament: 'Leviticus 6:8-30, 7:1-38, 8:1-36',
    newTestament: 'Mark 1:1-28',
    psalm: 'Psalm 35:1-16',
    proverb: 'Proverbs 9:11-12'
  },
  {
    day: 47,
    month: 'February',
    date: 'February 16',
    oldTestament: 'Leviticus 9:1-24, 10:1-20, 11:1-47',
    newTestament: 'Mark 1:29-45, 2:1-12',
    psalm: 'Psalm 35:17-28',
    proverb: 'Proverbs 9:13-18'
  },
  {
    day: 48,
    month: 'February',
    date: 'February 17',
    oldTestament: 'Leviticus 12:1-8, 13:1-59, 14:1-57',
    newTestament: 'Mark 2:13-28, 3:1-6',
    psalm: 'Psalm 36:1-12',
    proverb: 'Proverbs 10:1-2'
  },
  {
    day: 49,
    month: 'February',
    date: 'February 18',
    oldTestament: 'Leviticus 15:1-33, 16:1-28, 17:1-16',
    newTestament: 'Mark 3:7-30',
    psalm: 'Psalm 37:1-11',
    proverb: 'Proverbs 10:3-4'
  },
  {
    day: 50,
    month: 'February',
    date: 'February 19',
    oldTestament: 'Leviticus 17:17-38, 18:1-30, 19:1-6',
    newTestament: 'Mark 4:1-25',
    psalm: 'Psalm 37:12-29',
    proverb: 'Proverbs 10:5'
  },
  {
    day: 51,
    month: 'February',
    date: 'February 20',
    oldTestament: 'Leviticus 19:7-24, 20:1-20, 21:1-24',
    newTestament: 'Mark 4:26-41, 5:1-20',
    psalm: 'Psalm 37:30-40',
    proverb: 'Proverbs 10:6-7'
  },
  {
    day: 52,
    month: 'February',
    date: 'February 21',
    oldTestament: 'Leviticus 21:25-47, 22:1-33, 23:1-44',
    newTestament: 'Mark 5:21-43',
    psalm: 'Psalm 38:1-22',
    proverb: 'Proverbs 10:8-9'
  },
  {
    day: 53,
    month: 'February',
    date: 'February 22',
    oldTestament: 'Leviticus 24:1-23, 25:1-55, 26:1-13',
    newTestament: 'Mark 6:1-29',
    psalm: 'Psalm 39:1-13',
    proverb: 'Proverbs 10:10'
  },
  {
    day: 54,
    month: 'February',
    date: 'February 23',
    oldTestament: 'Leviticus 26:14-46, 27:1-34, Numbers 1:1-54',
    newTestament: 'Mark 6:30-56',
    psalm: 'Psalm 40:1-10',
    proverb: 'Proverbs 10:11-12'
  },
  {
    day: 55,
    month: 'February',
    date: 'February 24',
    oldTestament: 'Numbers 2:1-34, 3:1-51, 4:1-33',
    newTestament: 'Mark 7:1-23',
    psalm: 'Psalm 40:11-17',
    proverb: 'Proverbs 10:13-14'
  },
  {
    day: 56,
    month: 'February',
    date: 'February 25',
    oldTestament: 'Numbers 4:34-49, 5:1-31, 6:1-27',
    newTestament: 'Mark 7:24-37, 8:1-10',
    psalm: 'Psalm 41:1-13',
    proverb: 'Proverbs 10:15-16'
  },
  {
    day: 57,
    month: 'February',
    date: 'February 26',
    oldTestament: 'Numbers 7:1-89, 8:1-26, 9:1-14',
    newTestament: 'Mark 8:11-38',
    psalm: 'Psalm 42:1-11',
    proverb: 'Proverbs 10:17'
  },
  {
    day: 58,
    month: 'February',
    date: 'February 27',
    oldTestament: 'Numbers 9:15-23, 10:1-36, 11:1-35',
    newTestament: 'Mark 9:1-29',
    psalm: 'Psalm 43:1-5',
    proverb: 'Proverbs 10:18'
  },
  {
    day: 59,
    month: 'February',
    date: 'February 28',
    oldTestament: 'Numbers 12:1-16, 13:1-33, 14:1-45',
    newTestament: 'Mark 9:30-50, 10:1-12',
    psalm: 'Psalm 44:1-8',
    proverb: 'Proverbs 10:19'
  },

  // ===== MARCH =====
  {
    day: 60,
    month: 'March',
    date: 'March 1',
    oldTestament: 'Numbers 15:1-41, 16:1-50, 17:1-13',
    newTestament: 'Mark 10:13-34',
    psalm: 'Psalm 44:9-26',
    proverb: 'Proverbs 10:20-21'
  },
  {
    day: 61,
    month: 'March',
    date: 'March 2',
    oldTestament: 'Numbers 17:14-26, 18:1-32, 19:1-22',
    newTestament: 'Mark 10:35-52',
    psalm: 'Psalm 45:1-17',
    proverb: 'Proverbs 10:22'
  },
  {
    day: 62,
    month: 'March',
    date: 'March 3',
    oldTestament: 'Numbers 20:1-29, 21:1-35, 22:1-41',
    newTestament: 'Mark 11:1-26',
    psalm: 'Psalm 46:1-11',
    proverb: 'Proverbs 10:23'
  },
  {
    day: 63,
    month: 'March',
    date: 'March 4',
    oldTestament: 'Numbers 23:1-30, 24:1-25, 25:1-18',
    newTestament: 'Mark 11:27-33, 12:1-17',
    psalm: 'Psalm 47:1-9',
    proverb: 'Proverbs 10:24-25'
  },
  {
    day: 64,
    month: 'March',
    date: 'March 5',
    oldTestament: 'Numbers 26:1-65, 27:1-23, 28:1-31',
    newTestament: 'Mark 12:18-44',
    psalm: 'Psalm 48:1-14',
    proverb: 'Proverbs 10:26-27'
  },
  {
    day: 65,
    month: 'March',
    date: 'March 6',
    oldTestament: 'Numbers 29:1-40, 30:1-16, 31:1-54',
    newTestament: 'Mark 13:1-37',
    psalm: 'Psalm 49:1-20',
    proverb: 'Proverbs 10:28-29'
  },
  {
    day: 66,
    month: 'March',
    date: 'March 7',
    oldTestament: 'Numbers 32:1-42, 33:1-56, 34:1-29',
    newTestament: 'Mark 14:1-26',
    psalm: 'Psalm 50:1-23',
    proverb: 'Proverbs 10:30'
  },
  {
    day: 67,
    month: 'March',
    date: 'March 8',
    oldTestament: 'Numbers 35:1-34, 36:1-13, Deuteronomy 1:1-46',
    newTestament: 'Mark 14:27-52',
    psalm: 'Psalm 51:1-19',
    proverb: 'Proverbs 10:31-32'
  },
  {
    day: 68,
    month: 'March',
    date: 'March 9',
    oldTestament: 'Deuteronomy 2:1-37, 3:1-29, 4:1-40',
    newTestament: 'Mark 14:53-72, 15:1-15',
    psalm: 'Psalm 52:1-9',
    proverb: 'Proverbs 11:1-3'
  },
  {
    day: 69,
    month: 'March',
    date: 'March 10',
    oldTestament: 'Deuteronomy 4:41-49, 5:1-33, 6:1-25',
    newTestament: 'Mark 15:16-47',
    psalm: 'Psalm 53:1-6',
    proverb: 'Proverbs 11:4'
  },
  {
    day: 70,
    month: 'March',
    date: 'March 11',
    oldTestament: 'Deuteronomy 7:1-26, 8:1-20, 9:1-29',
    newTestament: 'Mark 16:1-20',
    psalm: 'Psalm 54:1-7',
    proverb: 'Proverbs 11:5-6'
  },
  {
    day: 71,
    month: 'March',
    date: 'March 12',
    oldTestament: 'Deuteronomy 10:1-22, 11:1-32, 12:1-32',
    newTestament: 'Luke 1:1-25',
    psalm: 'Psalm 55:1-23',
    proverb: 'Proverbs 11:7'
  },
  {
    day: 72,
    month: 'March',
    date: 'March 13',
    oldTestament: 'Deuteronomy 13:1-18, 14:1-29, 15:1-23',
    newTestament: 'Luke 1:26-56',
    psalm: 'Psalm 56:1-13',
    proverb: 'Proverbs 11:8'
  },
  {
    day: 73,
    month: 'March',
    date: 'March 14',
    oldTestament: 'Deuteronomy 16:1-22, 17:1-20, 18:1-22',
    newTestament: 'Luke 1:57-80',
    psalm: 'Psalm 57:1-11',
    proverb: 'Proverbs 11:9-11'
  },
  {
    day: 74,
    month: 'March',
    date: 'March 15',
    oldTestament: 'Deuteronomy 19:1-21, 20:1-20, 21:1-23',
    newTestament: 'Luke 2:1-20',
    psalm: 'Psalm 58:1-11',
    proverb: 'Proverbs 11:12-13'
  },
  {
    day: 75,
    month: 'March',
    date: 'March 16',
    oldTestament: 'Deuteronomy 22:1-30, 23:1-25, 24:1-22',
    newTestament: 'Luke 2:21-40',
    psalm: 'Psalm 59:1-17',
    proverb: 'Proverbs 11:14'
  },
  {
    day: 76,
    month: 'March',
    date: 'March 17',
    oldTestament: 'Deuteronomy 25:1-19, 26:1-19, 27:1-26',
    newTestament: 'Luke 2:41-52, 3:1-22',
    psalm: 'Psalm 60:1-12',
    proverb: 'Proverbs 11:15'
  },
  {
    day: 77,
    month: 'March',
    date: 'March 18',
    oldTestament: 'Deuteronomy 28:1-68, 29:1-29',
    newTestament: 'Luke 3:23-38, 4:1-13',
    psalm: 'Psalm 61:1-8',
    proverb: 'Proverbs 11:16-17'
  },
  {
    day: 78,
    month: 'March',
    date: 'March 19',
    oldTestament: 'Deuteronomy 30:1-20, 31:1-30, 32:1-27',
    newTestament: 'Luke 4:14-37',
    psalm: 'Psalm 62:1-12',
    proverb: 'Proverbs 11:18-19'
  },
  {
    day: 79,
    month: 'March',
    date: 'March 20',
    oldTestament: 'Deuteronomy 32:28-52, 33:1-29, 34:1-12',
    newTestament: 'Luke 4:38-44, 5:1-16',
    psalm: 'Psalm 63:1-11',
    proverb: 'Proverbs 11:20-21'
  },
  {
    day: 80,
    month: 'March',
    date: 'March 21',
    oldTestament: 'Joshua 1:1-18, 2:1-24, 3:1-17',
    newTestament: 'Luke 5:17-39',
    psalm: 'Psalm 64:1-10',
    proverb: 'Proverbs 11:22'
  },
  {
    day: 81,
    month: 'March',
    date: 'March 22',
    oldTestament: 'Joshua 4:1-24, 5:1-15, 6:1-27',
    newTestament: 'Luke 6:1-26',
    psalm: 'Psalm 65:1-13',
    proverb: 'Proverbs 11:23'
  },
  {
    day: 82,
    month: 'March',
    date: 'March 23',
    oldTestament: 'Joshua 7:1-26, 8:1-35, 9:1-27',
    newTestament: 'Luke 6:27-49',
    psalm: 'Psalm 66:1-20',
    proverb: 'Proverbs 11:24-26'
  },
  {
    day: 83,
    month: 'March',
    date: 'March 24',
    oldTestament: 'Joshua 10:1-43, 11:1-23, 12:1-24',
    newTestament: 'Luke 7:1-30',
    psalm: 'Psalm 67:1-7',
    proverb: 'Proverbs 11:27'
  },
  {
    day: 84,
    month: 'March',
    date: 'March 25',
    oldTestament: 'Joshua 13:1-33, 14:1-15, 15:1-63',
    newTestament: 'Luke 7:31-50',
    psalm: 'Psalm 68:1-18',
    proverb: 'Proverbs 11:28-30'
  },
  {
    day: 85,
    month: 'March',
    date: 'March 26',
    oldTestament: 'Joshua 16:1-10, 17:1-18, 18:1-28',
    newTestament: 'Luke 8:1-25',
    psalm: 'Psalm 68:19-35',
    proverb: 'Proverbs 11:31'
  },
  {
    day: 86,
    month: 'March',
    date: 'March 27',
    oldTestament: 'Joshua 19:1-51, 20:1-9, 21:1-45',
    newTestament: 'Luke 8:26-56',
    psalm: 'Psalm 69:1-18',
    proverb: 'Proverbs 12:1'
  },
  {
    day: 87,
    month: 'March',
    date: 'March 28',
    oldTestament: 'Joshua 22:1-34, 23:1-16, 24:1-33',
    newTestament: 'Luke 9:1-27',
    psalm: 'Psalm 69:19-36',
    proverb: 'Proverbs 12:2-3'
  },
   {
    day: 88,
    month: 'March',
    date: 'March 29',
    oldTestament: 'Judges 1:1-36, 2:1-23, 3:1-31',
    newTestament: 'Luke 9:28-50',
    psalm: 'Psalm 70:1-5',
    proverb: 'Proverbs 12:4'
  },
    {
    day: 89,
    month: 'March',
    date: 'March 30',
    oldTestament: 'Judges 4:1-24, 5:1-31, 6:1-40',
    newTestament: 'Luke 9:51-62, 10:1-12',
    psalm: 'Psalm 70:1-5',
    proverb: 'Proverbs 12:4'
  },
  {
    day: 90,
    month: 'March',
    date: 'March 31',
    oldTestament: 'Judges 7:1-25, 8:1-35, 9:1-21',
    newTestament: 'Luke 10:13-42',
    psalm: 'Psalm 71:1-24',
    proverb: 'Proverbs 12:5-7'
  },

  // ===== APRIL =====
  {
    day: 91,
    month: 'April',
    date: 'April 1',
    oldTestament: 'Deuteronomy 18:1-22, 19:1-21, 20:1-20',
    newTestament: 'Luke 9:28-50',
    psalm: 'Psalm 73:1-28',
    proverb: 'Proverbs 12:10'
  },
  {
    day: 92,
    month: 'April',
    date: 'April 2',
    oldTestament: 'Deuteronomy 21:1-23, 22:1-30',
    newTestament: 'Luke 9:51-62, 10:1-12',
    psalm: 'Psalm 74:1-23',
    proverb: 'Proverbs 12:11'
  },
  {
    day: 93,
    month: 'April',
    date: 'April 3',
    oldTestament: 'Deuteronomy 23:1-25, 24:1-22, 25:1-19',
    newTestament: 'Luke 10:13-37',
    psalm: 'Psalm 75:1-10',
    proverb: 'Proverbs 12:12-14'
  },
  {
    day: 94,
    month: 'April',
    date: 'April 4',
    oldTestament: 'Deuteronomy 26:1-19, 27:1-26',
    newTestament: 'Luke 10:38-42, 11:1-13',
    psalm: 'Psalm 76:1-12',
    proverb: 'Proverbs 12:15-17'
  },
  {
    day: 95,
    month: 'April',
    date: 'April 5',
    oldTestament: 'Deuteronomy 28:1-68',
    newTestament: 'Luke 11:14-36',
    psalm: 'Psalm 77:1-20',
    proverb: 'Proverbs 12:18'
  },
  {
    day: 96,
    month: 'April',
    date: 'April 6',
    oldTestament: 'Deuteronomy 29:1-29, 30:1-20',
    newTestament: 'Luke 11:37-54, 12:1-7',
    psalm: 'Psalm 78:1-31',
    proverb: 'Proverbs 12:19-20'
  },
  {
    day: 97,
    month: 'April',
    date: 'April 7',
    oldTestament: 'Deuteronomy 31:1-30, 32:1-27',
    newTestament: 'Luke 12:8-34',
    psalm: 'Psalm 78:32-55',
    proverb: 'Proverbs 12:21-23'
  },
  {
    day: 98,
    month: 'April',
    date: 'April 8',
    oldTestament: 'Deuteronomy 32:28-52',
    newTestament: 'Luke 12:35-59',
    psalm: 'Psalm 78:56-64',
    proverb: 'Proverbs 12:24'
  },
  {
    day: 99,
    month: 'April',
    date: 'April 9',
    oldTestament: 'Deuteronomy 33:1-29',
    newTestament: 'Luke 13:1-21',
    psalm: 'Psalm 78:65-72',
    proverb: 'Proverbs 12:25'
  },
  {
    day: 100,
    month: 'April',
    date: 'April 10',
    oldTestament: 'Deuteronomy 34:1-12, Joshua 2:1-24',
    newTestament: 'Luke 13:22-35, 14:1-6',
    psalm: 'Psalm 79:1-13',
    proverb: 'Proverbs 12:26'
  },
  {
    day: 101,
    month: 'April',
    date: 'April 11',
    oldTestament: 'Joshua 3:1-17, 4:1-24',
    newTestament: 'Luke 14:7-35',
    psalm: 'Psalm 80:1-19',
    proverb: 'Proverbs 12:27-28'
  },
  {
    day: 102,
    month: 'April',
    date: 'April 12',
    oldTestament: 'Joshua 5:1-15, 6:1-27, 7:1-15',
    newTestament: 'Luke 15:1-32',
    psalm: 'Psalm 81:1-16',
    proverb: 'Proverbs 13:1'
  },
  {
    day: 103,
    month: 'April',
    date: 'April 13',
    oldTestament: 'Joshua 7:16-26, 8:1-35, 9:1-2',
    newTestament: 'Luke 16:1-18',
    psalm: 'Psalm 82:1-8',
    proverb: 'Proverbs 13:2-3'
  },
  {
    day: 104,
    month: 'April',
    date: 'April 14',
    oldTestament: 'Joshua 9:3-27, 10:1-43',
    newTestament: 'Luke 16:19-31, 17:1-10',
    psalm: 'Psalm 83:1-18',
    proverb: 'Proverbs 13:4'
  },
  {
    day: 105,
    month: 'April',
    date: 'April 15',
    oldTestament: 'Joshua 11:1-23, 12:1-24',
    newTestament: 'Luke 17:11-37',
    psalm: 'Psalm 84:1-12',
    proverb: 'Proverbs 13:5-6'
  },
  {
    day: 106,
    month: 'April',
    date: 'April 16',
    oldTestament: 'Joshua 13:1-33, 14:1-15',
    newTestament: 'Luke 18:1-17',
    psalm: 'Psalm 85:1-13',
    proverb: 'Proverbs 13:7-8'
  },
  {
    day: 107,
    month: 'April',
    date: 'April 17',
    oldTestament: 'Joshua 15:1-63',
    newTestament: 'Luke 18:18-43',
    psalm: 'Psalm 86:1-17',
    proverb: 'Proverbs 13:9-10'
  },
  {
    day: 108,
    month: 'April',
    date: 'April 18',
    oldTestament: 'Joshua 16:1-10, 17:1-18, 18:1-28',
    newTestament: 'Luke 19:1-27',
    psalm: 'Psalm 87:1-7',
    proverb: 'Proverbs 13:11'
  },
  {
    day: 109,
    month: 'April',
    date: 'April 19',
    oldTestament: 'Joshua 19:1-51, 20:1-9',
    newTestament: 'Luke 19:28-48',
    psalm: 'Psalm 88:1-18',
    proverb: 'Proverbs 13:12-14'
  },
  {
    day: 110,
    month: 'April',
    date: 'April 20',
    oldTestament: 'Joshua 21:1-45, 22:1-20',
    newTestament: 'Luke 20:1-26',
    psalm: 'Psalm 89:1-13',
    proverb: 'Proverbs 13:15-16'
  },
  {
    day: 111,
    month: 'April',
    date: 'April 21',
    oldTestament: 'Joshua 22:21-34, 23:1-16',
    newTestament: 'Luke 20:27-47',
    psalm: 'Psalm 89:14-37',
    proverb: 'Proverbs 13:17-19'
  },
  {
    day: 112,
    month: 'April',
    date: 'April 22',
    oldTestament: 'Joshua 24:1-33',
    newTestament: 'Luke 21:1-28',
    psalm: 'Psalm 89:38-52',
    proverb: 'Proverbs 13:20-23'
  },
  {
    day: 113,
    month: 'April',
    date: 'April 23',
    oldTestament: 'Judges 1:1-36, 2:1-9',
    newTestament: 'Luke 21:29-38, 22:1-13',
    psalm: 'Psalm 90:1-17, 91:1-16',
    proverb: 'Proverbs 13:24-25'
  },
  {
    day: 114,
    month: 'April',
    date: 'April 24',
    oldTestament: 'Judges 2:10-23, 3:1-31',
    newTestament: 'Luke 22:14-34',
    psalm: 'Psalm 92:1-15, 93:1-5',
    proverb: 'Proverbs 14:1-2'
  },
  {
    day: 115,
    month: 'April',
    date: 'April 25',
    oldTestament: 'Judges 4:1-24, 5:1-31',
    newTestament: 'Luke 22:35-53',
    psalm: 'Psalm 94:1-23',
    proverb: 'Proverbs 14:3-4'
  },
  {
    day: 116,
    month: 'April',
    date: 'April 26',
    oldTestament: 'Judges 6:1-40',
    newTestament: 'Luke 22:54-71, 23:1-12',
    psalm: 'Psalm 95:1-11, 96:1-13',
    proverb: 'Proverbs 14:5-6'
  },
  {
    day: 117,
    month: 'April',
    date: 'April 27',
    oldTestament: 'Judges 7:1-25, 8:1-17',
    newTestament: 'Luke 23:13-43',
    psalm: 'Psalm 97:1-12, 98:1-9',
    proverb: 'Proverbs 14:7-8'
  },
  {
    day: 118,
    month: 'April',
    date: 'April 28',
    oldTestament: 'Judges 8:18-35, 9:1-21',
    newTestament: 'Luke 23:44-56, 24:1-12',
    psalm: 'Psalm 99:1-9',
    proverb: 'Proverbs 14:9-10'
  },
  {
    day: 119,
    month: 'April',
    date: 'April 29',
    oldTestament: 'Judges 9:22-57, 10:1-18',
    newTestament: 'Luke 24:13-53',
    psalm: 'Psalm 100:1-5',
    proverb: 'Proverbs 14:11-12'
  },
  {
    day: 120,
    month: 'April',
    date: 'April 30',
    oldTestament: 'Judges 11:1-40, 12:1-15',
    newTestament: 'John 1:1-28',
    psalm: 'Psalm 101:1-8',
    proverb: 'Proverbs 14:13-14'
  },

  // ===== MAY =====
  {
    day: 121,
    month: 'May',
    date: 'May 1',
    oldTestament: 'Judges 13:1-25, 14:1-20, 15:1-20',
    newTestament: 'John 1:29-51',
    psalm: 'Psalm 102:1-28',
    proverb: 'Proverbs 14:15-16'
  },
  {
    day: 122,
    month: 'May',
    date: 'May 2',
    oldTestament: 'Judges 16:1-31, 17:1-13, 18:1-31',
    newTestament: 'John 2:1-25',
    psalm: 'Psalm 103:1-22',
    proverb: 'Proverbs 14:17-19'
  },
  {
    day: 123,
    month: 'May',
    date: 'May 3',
    oldTestament: 'Judges 19:1-30, 20:1-48, 21:1-25',
    newTestament: 'John 3:1-21',
    psalm: 'Psalm 104:1-23',
    proverb: 'Proverbs 14:20-21'
  },
  {
    day: 124,
    month: 'May',
    date: 'May 4',
    oldTestament: 'Ruth 1:1-22, 2:1-23, 3:1-18',
    newTestament: 'John 3:22-36, 4:1-3',
    psalm: 'Psalm 104:24-35',
    proverb: 'Proverbs 14:22-24'
  },
  {
    day: 125,
    month: 'May',
    date: 'May 5',
    oldTestament: 'Ruth 4:1-22, 1 Samuel 1:1-28, 2:1-11',
    newTestament: 'John 4:4-42',
    psalm: 'Psalm 105:1-15',
    proverb: 'Proverbs 14:25'
  },
  {
    day: 126,
    month: 'May',
    date: 'May 6',
    oldTestament: '1 Samuel 2:12-36, 3:1-21, 4:1-22',
    newTestament: 'John 4:43-54, 5:1-15',
    psalm: 'Psalm 105:16-36',
    proverb: 'Proverbs 14:26-27'
  },
  {
    day: 127,
    month: 'May',
    date: 'May 7',
    oldTestament: '1 Samuel 5:1-12, 6:1-21, 7:1-17',
    newTestament: 'John 5:16-47',
    psalm: 'Psalm 105:37-45',
    proverb: 'Proverbs 14:28-29'
  },
  {
    day: 128,
    month: 'May',
    date: 'May 8',
    oldTestament: '1 Samuel 8:1-22, 9:1-27, 10:1-27',
    newTestament: 'John 6:1-21',
    psalm: 'Psalm 106:1-12',
    proverb: 'Proverbs 14:30-31'
  },
  {
    day: 129,
    month: 'May',
    date: 'May 9',
    oldTestament: '1 Samuel 11:1-15, 12:1-25, 13:1-23',
    newTestament: 'John 6:22-42',
    psalm: 'Psalm 106:13-31',
    proverb: 'Proverbs 14:32-33'
  },
  {
    day: 130,
    month: 'May',
    date: 'May 10',
    oldTestament: '1 Samuel 14:1-52, 15:1-35',
    newTestament: 'John 6:43-71',
    psalm: 'Psalm 106:32-48',
    proverb: 'Proverbs 14:34-35'
  },
  {
    day: 131,
    month: 'May',
    date: 'May 11',
    oldTestament: '1 Samuel 16:1-23, 17:1-58, 18:1-30',
    newTestament: 'John 7:1-31',
    psalm: 'Psalm 107:1-43',
    proverb: 'Proverbs 15:1-3'
  },
  {
    day: 132,
    month: 'May',
    date: 'May 12',
    oldTestament: '1 Samuel 19:1-24, 20:1-42, 21:1-15',
    newTestament: 'John 7:32-53, 8:1-11',
    psalm: 'Psalm 108:1-13',
    proverb: 'Proverbs 15:4'
  },
  {
    day: 133,
    month: 'May',
    date: 'May 13',
    oldTestament: '1 Samuel 22:1-23, 23:1-29, 24:1-22',
    newTestament: 'John 8:12-30',
    psalm: 'Psalm 109:1-31',
    proverb: 'Proverbs 15:5-7'
  },
  {
    day: 134,
    month: 'May',
    date: 'May 14',
    oldTestament: '1 Samuel 25:1-44, 26:1-25, 27:1-12',
    newTestament: 'John 8:31-59',
    psalm: 'Psalm 110:1-7',
    proverb: 'Proverbs 15:8-10'
  },
  {
    day: 135,
    month: 'May',
    date: 'May 15',
    oldTestament: '1 Samuel 28:1-25, 29:1-11, 30:1-31',
    newTestament: 'John 9:1-41',
    psalm: 'Psalm 111:1-10',
    proverb: 'Proverbs 15:11'
  },
  {
    day: 136,
    month: 'May',
    date: 'May 16',
    oldTestament: '1 Samuel 31:1-13, 2 Samuel 1:1-27, 2:1-32',
    newTestament: 'John 10:1-21',
    psalm: 'Psalm 112:1-10',
    proverb: 'Proverbs 15:12-14'
  },
  {
    day: 137,
    month: 'May',
    date: 'May 17',
    oldTestament: '2 Samuel 3:1-39, 4:1-12, 5:1-25',
    newTestament: 'John 10:22-42',
    psalm: 'Psalm 113:1-9, 114:1-8',
    proverb: 'Proverbs 15:15-17'
  },
  {
    day: 138,
    month: 'May',
    date: 'May 18',
    oldTestament: '2 Samuel 6:1-23, 7:1-29, 8:1-18',
    newTestament: 'John 11:1-29',
    psalm: 'Psalm 115:1-18',
    proverb: 'Proverbs 15:18-19'
  },
  {
    day: 139,
    month: 'May',
    date: 'May 19',
    oldTestament: '2 Samuel 9:1-13, 10:1-19, 11:1-27',
    newTestament: 'John 11:30-57',
    psalm: 'Psalm 116:1-19',
    proverb: 'Proverbs 15:20-21'
  },
  {
    day: 140,
    month: 'May',
    date: 'May 20',
    oldTestament: '2 Samuel 12:1-31, 13:1-39, 14:1-33',
    newTestament: 'John 12:1-26',
    psalm: 'Psalm 117:1-2',
    proverb: 'Proverbs 15:22-23'
  },
  {
    day: 141,
    month: 'May',
    date: 'May 21',
    oldTestament: '2 Samuel 15:1-37, 16:1-23, 17:1-29',
    newTestament: 'John 12:27-50',
    psalm: 'Psalm 118:1-18',
    proverb: 'Proverbs 15:24-26'
  },
  {
    day: 142,
    month: 'May',
    date: 'May 22',
    oldTestament: '2 Samuel 18:1-33, 19:1-10, 19:11-43',
    newTestament: 'John 13:1-20',
    psalm: 'Psalm 118:19-29',
    proverb: 'Proverbs 15:27-28'
  },
  {
    day: 143,
    month: 'May',
    date: 'May 23',
    oldTestament: '2 Samuel 20:1-13, 20:14-26, 21:1-22',
    newTestament: 'John 13:21-38',
    psalm: 'Psalm 119:1-16',
    proverb: 'Proverbs 15:29-30'
  },
  {
    day: 144,
    month: 'May',
    date: 'May 24',
    oldTestament: '2 Samuel 22:1-51, 23:1-23, 23:24-39',
    newTestament: 'John 14:1-31',
    psalm: 'Psalm 119:17-32',
    proverb: 'Proverbs 15:31-32'
  },
  {
    day: 145,
    month: 'May',
    date: 'May 25',
    oldTestament: '2 Samuel 24:1-25, 1 Kings 1:1-53, 2:1-46',
    newTestament: 'John 15:1-27',
    psalm: 'Psalm 119:33-48',
    proverb: 'Proverbs 16:1-3'
  },
  {
    day: 146,
    month: 'May',
    date: 'May 26',
    oldTestament: '1 Kings 3:1-28, 4:1-34, 5:1-18',
    newTestament: 'John 16:1-33',
    psalm: 'Psalm 119:49-64',
    proverb: 'Proverbs 16:4-5'
  },
  {
    day: 147,
    month: 'May',
    date: 'May 27',
    oldTestament: '1 Kings 6:1-38, 7:1-51, 8:1-66',
    newTestament: 'John 17:1-26',
    psalm: 'Psalm 119:65-80',
    proverb: 'Proverbs 16:6-7'
  },
  {
    day: 148,
    month: 'May',
    date: 'May 28',
    oldTestament: '1 Kings 9:1-28, 10:1-29, 11:1-43',
    newTestament: 'John 18:1-24',
    psalm: 'Psalm 119:81-96',
    proverb: 'Proverbs 16:8-9'
  },
  {
    day: 149,
    month: 'May',
    date: 'May 29',
    oldTestament: '1 Kings 12:1-33, 13:1-34, 14:1-31',
    newTestament: 'John 18:25-40, 19:1-16',
    psalm: 'Psalm 119:97-112',
    proverb: 'Proverbs 16:10-11'
  },
  {
    day: 150,
    month: 'May',
    date: 'May 30',
    oldTestament: '1 Kings 15:1-34, 16:1-34, 17:1-24',
    newTestament: 'John 19:17-42',
    psalm: 'Psalm 119:113-128',
    proverb: 'Proverbs 16:12-13'
  },
  {
    day: 151,
    month: 'May',
    date: 'May 31',
    oldTestament: '1 Kings 18:1-46, 19:1-21, 20:1-43',
    newTestament: 'John 20:1-31',
    psalm: 'Psalm 119:129-152',
    proverb: 'Proverbs 16:14-15'
  },

  // ===== JUNE =====
  {
    day: 152,
    month: 'June',
    date: 'June 1',
    oldTestament: '1 Kings 21:1-29, 22:1-53',
    newTestament: 'John 21:1-25',
    psalm: 'Psalm 119:153-176',
    proverb: 'Proverbs 16:16-17'
  },
  {
    day: 153,
    month: 'June',
    date: 'June 2',
    oldTestament: '2 Kings 1:1-18, 2:1-25, 3:1-27',
    newTestament: 'Acts 1:1-26',
    psalm: 'Psalm 120:1-7',
    proverb: 'Proverbs 16:18'
  },
  {
    day: 154,
    month: 'June',
    date: 'June 3',
    oldTestament: '2 Kings 4:1-44, 5:1-27, 6:1-33',
    newTestament: 'Acts 2:1-47',
    psalm: 'Psalm 121:1-8',
    proverb: 'Proverbs 16:19-20'
  },
  {
    day: 155,
    month: 'June',
    date: 'June 4',
    oldTestament: '2 Kings 7:1-20, 8:1-29, 9:1-13',
    newTestament: 'Acts 3:1-26',
    psalm: 'Psalm 122:1-9',
    proverb: 'Proverbs 16:21-23'
  },
  {
    day: 156,
    month: 'June',
    date: 'June 5',
    oldTestament: '2 Kings 9:14-37, 10:1-31, 10:32-36',
    newTestament: 'Acts 4:1-37',
    psalm: 'Psalm 123:1-4',
    proverb: 'Proverbs 16:24'
  },
  {
    day: 157,
    month: 'June',
    date: 'June 6',
    oldTestament: '2 Kings 11:1-21, 12:1-21, 13:1-25',
    newTestament: 'Acts 5:1-42',
    psalm: 'Psalm 124:1-8',
    proverb: 'Proverbs 16:25'
  },
  {
    day: 158,
    month: 'June',
    date: 'June 7',
    oldTestament: '2 Kings 14:1-29, 15:1-38, 16:1-20',
    newTestament: 'Acts 6:1-15',
    psalm: 'Psalm 125:1-5',
    proverb: 'Proverbs 16:26-27'
  },
  {
    day: 159,
    month: 'June',
    date: 'June 8',
    oldTestament: '2 Kings 17:1-41, 18:1-12, 18:13-37',
    newTestament: 'Acts 7:1-29',
    psalm: 'Psalm 126:1-6',
    proverb: 'Proverbs 16:28-30'
  },
  {
    day: 160,
    month: 'June',
    date: 'June 9',
    oldTestament: '2 Kings 19:1-37, 20:1-21, 21:1-26',
    newTestament: 'Acts 7:30-50',
    psalm: 'Psalm 127:1-5',
    proverb: 'Proverbs 16:31-33'
  },
  {
    day: 161,
    month: 'June',
    date: 'June 10',
    oldTestament: '2 Kings 22:1-20, 23:1-30, 23:31-37',
    newTestament: 'Acts 7:51-60, 8:1-13',
    psalm: 'Psalm 128:1-6',
    proverb: 'Proverbs 17:1'
  },
  {
    day: 162,
    month: 'June',
    date: 'June 11',
    oldTestament: '2 Kings 24:1-20, 25:1-30',
    newTestament: 'Acts 8:14-40',
    psalm: 'Psalm 129:1-8',
    proverb: 'Proverbs 17:2-3'
  },
  {
    day: 163,
    month: 'June',
    date: 'June 12',
    oldTestament: '1 Chronicles 1:1-54, 2:1-17, 2:18-55',
    newTestament: 'Acts 9:1-25',
    psalm: 'Psalm 130:1-8',
    proverb: 'Proverbs 17:4-5'
  },
  {
    day: 164,
    month: 'June',
    date: 'June 13',
    oldTestament: '1 Chronicles 3:1-24, 4:1-43, 5:1-17',
    newTestament: 'Acts 9:26-43',
    psalm: 'Psalm 131:1-3',
    proverb: 'Proverbs 17:6'
  },
  {
    day: 165,
    month: 'June',
    date: 'June 14',
    oldTestament: '1 Chronicles 5:18-26, 6:1-81, 7:1-40',
    newTestament: 'Acts 10:1-23',
    psalm: 'Psalm 132:1-18',
    proverb: 'Proverbs 17:7-8'
  },
  {
    day: 166,
    month: 'June',
    date: 'June 15',
    oldTestament: '1 Chronicles 8:1-40, 9:1-44, 10:1-14',
    newTestament: 'Acts 10:23-48',
    psalm: 'Psalm 133:1-3',
    proverb: 'Proverbs 17:9-11'
  },
  {
    day: 167,
    month: 'June',
    date: 'June 16',
    oldTestament: '1 Chronicles 11:1-47, 12:1-18, 12:19-40',
    newTestament: 'Acts 11:1-30',
    psalm: 'Psalm 134:1-3',
    proverb: 'Proverbs 17:12-13'
  },
  {
    day: 168,
    month: 'June',
    date: 'June 17',
    oldTestament: '1 Chronicles 13:1-14, 14:1-17, 15:1-29',
    newTestament: 'Acts 12:1-23',
    psalm: 'Psalm 135:1-21',
    proverb: 'Proverbs 17:14-15'
  },
  {
    day: 169,
    month: 'June',
    date: 'June 18',
    oldTestament: '1 Chronicles 16:1-36, 16:37-43, 17:1-27',
    newTestament: 'Acts 12:24-25, 13:1-15',
    psalm: 'Psalm 136:1-26',
    proverb: 'Proverbs 17:16'
  },
  {
    day: 170,
    month: 'June',
    date: 'June 19',
    oldTestament: '1 Chronicles 18:1-17, 19:1-19, 20:1-8',
    newTestament: 'Acts 13:16-41',
    psalm: 'Psalm 137:1-9',
    proverb: 'Proverbs 17:17-18'
  },
  {
    day: 171,
    month: 'June',
    date: 'June 20',
    oldTestament: '1 Chronicles 21:1-30, 22:1-19, 23:1-32',
    newTestament: 'Acts 13:42-52, 14:1-7',
    psalm: 'Psalm 138:1-8',
    proverb: 'Proverbs 17:19-21'
  },
  {
    day: 172,
    month: 'June',
    date: 'June 21',
    oldTestament: '1 Chronicles 24:1-31, 25:1-31, 26:1-11',
    newTestament: 'Acts 14:8-28',
    psalm: 'Psalm 139:1-24',
    proverb: 'Proverbs 17:22'
  },
  {
    day: 173,
    month: 'June',
    date: 'June 22',
    oldTestament: '1 Chronicles 26:12-32, 27:1-34, 28:1-21',
    newTestament: 'Acts 15:1-35',
    psalm: 'Psalm 140:1-13',
    proverb: 'Proverbs 17:23'
  },
  {
    day: 174,
    month: 'June',
    date: 'June 23',
    oldTestament: '1 Chronicles 29:1-30, 2 Chronicles 1:1-17, 2:1-18',
    newTestament: 'Acts 15:36-41, 16:1-15',
    psalm: 'Psalm 141:1-10',
    proverb: 'Proverbs 17:24-25'
  },
  {
    day: 175,
    month: 'June',
    date: 'June 24',
    oldTestament: '2 Chronicles 3:1-17, 4:1-22, 5:1-14',
    newTestament: 'Acts 16:16-40',
    psalm: 'Psalm 142:1-7',
    proverb: 'Proverbs 17:26'
  },
  {
    day: 176,
    month: 'June',
    date: 'June 25',
    oldTestament: '2 Chronicles 6:1-11, 6:12-42, 7:1-22',
    newTestament: 'Acts 17:1-34',
    psalm: 'Psalm 143:1-12',
    proverb: 'Proverbs 17:27-28'
  },
  {
    day: 177,
    month: 'June',
    date: 'June 26',
    oldTestament: '2 Chronicles 8:1-10, 8:11-18, 9:1-31',
    newTestament: 'Acts 18:1-22',
    psalm: 'Psalm 144:1-15',
    proverb: 'Proverbs 18:1'
  },
    {
    day: 178,
    month: 'June',
    date: 'June 27',
    oldTestament: '2 Chronicles 10:1-19, 11:1-23, 12:1-16',
    newTestament: 'Acts 18:23-28, 19:1-12',
    psalm: 'Psalm 145:1-21',
    proverb: 'Proverbs 18:2-3'
  },
    {
    day: 179,
    month: 'June',
    date: 'June 28',
    oldTestament: '2 Chronicles 13:1-22, 14:1-15, 15:1-19',
    newTestament: 'Acts 19:13-41',
    psalm: 'Psalm 146:1-10',
    proverb: 'Proverbs 18:4-5'
  },
  {
    day: 180,
    month: 'June',
    date: 'June 29',
    oldTestament: '2 Chronicles 16:1-14, 17:1-19, 18:1-34',
    newTestament: 'Acts 20:1-38',
    psalm: 'Psalm 147:1-20',
    proverb: 'Proverbs 18:6-7'
  },
  {
    day: 181,
    month: 'June',
    date: 'June 30',
    oldTestament: '2 Chronicles 19:1-11, 20:1-37, 21:1-20',
    newTestament: 'Acts 21:1-16',
    psalm: 'Psalm 148:1-14',
    proverb: 'Proverbs 18:8'
  },

  // ===== JULY =====
  {
    day: 182,
    month: 'July',
    date: 'July 1',
    oldTestament: '2 Chronicles 22:1-12, 23:1-21, 24:1-27',
    newTestament: 'Acts 21:17-36',
    psalm: 'Psalm 149:1-9',
    proverb: 'Proverbs 18:9-10'
  },
  {
    day: 183,
    month: 'July',
    date: 'July 2',
    oldTestament: '2 Chronicles 25:1-28, 26:1-23, 27:1-9',
    newTestament: 'Acts 21:37-40, 22:1-16',
    psalm: 'Psalm 150:1-6',
    proverb: 'Proverbs 18:11-12'
  },
  {
    day: 184,
    month: 'July',
    date: 'July 3',
    oldTestament: '2 Chronicles 28:1-27, 29:1-36, 30:1-27',
    newTestament: 'Acts 22:17-30, 23:1-10',
    psalm: 'Psalm 1:1-6',
    proverb: 'Proverbs 18:13'
  },
  {
    day: 185,
    month: 'July',
    date: 'July 4',
    oldTestament: '2 Chronicles 31:1-21, 32:1-33, 33:1-13',
    newTestament: 'Acts 23:11-35',
    psalm: 'Psalm 2:1-12',
    proverb: 'Proverbs 18:14-15'
  },
  {
    day: 186,
    month: 'July',
    date: 'July 5',
    oldTestament: '2 Chronicles 33:14-25, 34:1-33, 35:1-27',
    newTestament: 'Acts 24:1-27',
    psalm: 'Psalm 3:1-8',
    proverb: 'Proverbs 18:16-18'
  },
  {
    day: 187,
    month: 'July',
    date: 'July 6',
    oldTestament: '2 Chronicles 36:1-23, Ezra 1:1-11, 2:1-70',
    newTestament: 'Acts 25:1-27',
    psalm: 'Psalm 4:1-8',
    proverb: 'Proverbs 18:19'
  },
  {
    day: 188,
    month: 'July',
    date: 'July 7',
    oldTestament: 'Ezra 3:1-13, 4:1-24, 5:1-17',
    newTestament: 'Acts 26:1-32',
    psalm: 'Psalm 5:1-12',
    proverb: 'Proverbs 18:20-21'
  },
  {
    day: 189,
    month: 'July',
    date: 'July 8',
    oldTestament: 'Ezra 6:1-22, 7:1-28, 8:1-20',
    newTestament: 'Acts 27:1-20',
    psalm: 'Psalm 6:1-10',
    proverb: 'Proverbs 18:22'
  },
  {
    day: 190,
    month: 'July',
    date: 'July 9',
    oldTestament: 'Ezra 8:21-36, 9:1-15, 10:1-44',
    newTestament: 'Acts 27:21-44',
    psalm: 'Psalm 7:1-17',
    proverb: 'Proverbs 18:23-24'
  },
  {
    day: 191,
    month: 'July',
    date: 'July 10',
    oldTestament: 'Nehemiah 1:1-11, 2:1-20, 3:1-14',
    newTestament: 'Acts 28:1-31',
    psalm: 'Psalm 8:1-9',
    proverb: 'Proverbs 19:1-3'
  },
  {
    day: 192,
    month: 'July',
    date: 'July 11',
    oldTestament: 'Nehemiah 3:15-32, 4:1-23, 5:1-13',
    newTestament: 'Romans 1:1-17',
    psalm: 'Psalm 9:1-12',
    proverb: 'Proverbs 19:4-5'
  },
  {
    day: 193,
    month: 'July',
    date: 'July 12',
    oldTestament: 'Nehemiah 5:14-19, 6:1-19, 7:1-60',
    newTestament: 'Romans 1:18-32',
    psalm: 'Psalm 9:13-20',
    proverb: 'Proverbs 19:6-7'
  },
  {
    day: 194,
    month: 'July',
    date: 'July 13',
    oldTestament: 'Nehemiah 7:61-73, 8:1-18, 9:1-21',
    newTestament: 'Romans 2:1-24',
    psalm: 'Psalm 10:1-15',
    proverb: 'Proverbs 19:8-9'
  },
  {
    day: 195,
    month: 'July',
    date: 'July 14',
    oldTestament: 'Nehemiah 9:22-38, 10:1-39, 11:1-36',
    newTestament: 'Romans 2:25-29, 3:1-8',
    psalm: 'Psalm 10:16-18',
    proverb: 'Proverbs 19:10-12'
  },
  {
    day: 196,
    month: 'July',
    date: 'July 15',
    oldTestament: 'Nehemiah 12:1-26, 12:27-47, 13:1-31',
    newTestament: 'Romans 3:9-31',
    psalm: 'Psalm 11:1-7',
    proverb: 'Proverbs 19:13-14'
  },
  {
    day: 197,
    month: 'July',
    date: 'July 16',
    oldTestament: 'Esther 1:1-22, 2:1-23, 3:1-15',
    newTestament: 'Romans 4:1-12',
    psalm: 'Psalm 12:1-8',
    proverb: 'Proverbs 19:15-16'
  },
  {
    day: 198,
    month: 'July',
    date: 'July 17',
    oldTestament: 'Esther 4:1-17, 5:1-14, 6:1-14',
    newTestament: 'Romans 4:13-25, 5:1-5',
    psalm: 'Psalm 13:1-6',
    proverb: 'Proverbs 19:17'
  },
  {
    day: 199,
    month: 'July',
    date: 'July 18',
    oldTestament: 'Esther 7:1-10, 8:1-17, 9:1-32',
    newTestament: 'Romans 5:6-21',
    psalm: 'Psalm 14:1-7',
    proverb: 'Proverbs 19:18-19'
  },
  {
    day: 200,
    month: 'July',
    date: 'July 19',
    oldTestament: 'Esther 10:1-3, Job 1:1-22, 2:1-13',
    newTestament: 'Romans 6:1-23',
    psalm: 'Psalm 15:1-5',
    proverb: 'Proverbs 19:20-21'
  },
  {
    day: 201,
    month: 'July',
    date: 'July 20',
    oldTestament: 'Job 3:1-26, 4:1-21, 5:1-27',
    newTestament: 'Romans 7:1-13',
    psalm: 'Psalm 16:1-11',
    proverb: 'Proverbs 19:22-23'
  },
  {
    day: 202,
    month: 'July',
    date: 'July 21',
    oldTestament: 'Job 6:1-30, 7:1-21, 8:1-22',
    newTestament: 'Romans 7:14-25, 8:1-7',
    psalm: 'Psalm 17:1-15',
    proverb: 'Proverbs 19:24-25'
  },
  {
    day: 203,
    month: 'July',
    date: 'July 22',
    oldTestament: 'Job 9:1-35, 10:1-22, 11:1-20',
    newTestament: 'Romans 8:8-21',
    psalm: 'Psalm 18:1-15',
    proverb: 'Proverbs 19:26'
  },
  {
    day: 204,
    month: 'July',
    date: 'July 23',
    oldTestament: 'Job 12:1-25, 13:1-28, 14:1-22',
    newTestament: 'Romans 8:22-39',
    psalm: 'Psalm 18:16-36',
    proverb: 'Proverbs 19:27-29'
  },
  {
    day: 205,
    month: 'July',
    date: 'July 24',
    oldTestament: 'Job 15:1-35, 16:1-22, 17:1-16',
    newTestament: 'Romans 9:1-21',
    psalm: 'Psalm 18:37-50',
    proverb: 'Proverbs 20:1'
  },
  {
    day: 206,
    month: 'July',
    date: 'July 25',
    oldTestament: 'Job 18:1-21, 19:1-29, 20:1-29',
    newTestament: 'Romans 9:22-33, 10:1-13',
    psalm: 'Psalm 19:1-14',
    proverb: 'Proverbs 20:2-3'
  },
  {
    day: 207,
    month: 'July',
    date: 'July 26',
    oldTestament: 'Job 21:1-34, 22:1-30, 23:1-17',
    newTestament: 'Romans 10:14-21, 11:1-12',
    psalm: 'Psalm 20:1-9',
    proverb: 'Proverbs 20:4-6'
  },
  {
    day: 208,
    month: 'July',
    date: 'July 27',
    oldTestament: 'Job 24:1-25, 25:1-6, 26:1-14',
    newTestament: 'Romans 11:13-36',
    psalm: 'Psalm 21:1-13',
    proverb: 'Proverbs 20:7'
  },
  {
    day: 209,
    month: 'July',
    date: 'July 28',
    oldTestament: 'Job 27:1-23, 28:1-28, 29:1-25',
    newTestament: 'Romans 12:1-21',
    psalm: 'Psalm 22:1-18',
    proverb: 'Proverbs 20:8-10'
  },
  {
    day: 210,
    month: 'July',
    date: 'July 29',
    oldTestament: 'Job 30:1-31, 31:1-40, 32:1-22',
    newTestament: 'Romans 13:1-14',
    psalm: 'Psalm 22:19-31',
    proverb: 'Proverbs 20:11'
  },
  {
    day: 211,
    month: 'July',
    date: 'July 30',
    oldTestament: 'Job 33:1-33, 34:1-37, 35:1-16',
    newTestament: 'Romans 14:1-23',
    psalm: 'Psalm 23:1-6',
    proverb: 'Proverbs 20:12'
  },
  {
    day: 212,
    month: 'July',
    date: 'July 31',
    oldTestament: 'Job 36:1-33, 37:1-24, 38:1-41',
    newTestament: 'Romans 15:1-22',
    psalm: 'Psalm 24:1-10',
    proverb: 'Proverbs 20:13-15'
  },

  // ===== AUGUST =====
  {
    day: 213,
    month: 'August',
    date: 'August 1',
    oldTestament: 'Job 39:1-30, 40:1-24, 41:1-34',
    newTestament: 'Romans 15:23-33, 16:1-7',
    psalm: 'Psalm 25:1-15',
    proverb: 'Proverbs 20:16-18'
  },
  {
    day: 214,
    month: 'August',
    date: 'August 2',
    oldTestament: 'Job 42:1-17, Psalm 1:1-6, 2:1-12',
    newTestament: 'Romans 16:8-27',
    psalm: 'Psalm 25:16-22',
    proverb: 'Proverbs 20:19'
  },
  {
    day: 215,
    month: 'August',
    date: 'August 3',
    oldTestament: 'Psalm 3:1-8, 4:1-8, 5:1-12',
    newTestament: '1 Corinthians 1:1-17',
    psalm: 'Psalm 26:1-12',
    proverb: 'Proverbs 20:20-21'
  },
  {
    day: 216,
    month: 'August',
    date: 'August 4',
    oldTestament: 'Psalm 6:1-10, 7:1-17, 8:1-9',
    newTestament: '1 Corinthians 1:18-31, 2:1-5',
    psalm: 'Psalm 27:1-6',
    proverb: 'Proverbs 20:22-23'
  },
  {
    day: 217,
    month: 'August',
    date: 'August 5',
    oldTestament: 'Psalm 9:1-12, 9:13-20, 10:1-15',
    newTestament: '1 Corinthians 2:6-16, 3:1-4',
    psalm: 'Psalm 27:7-14',
    proverb: 'Proverbs 20:24-25'
  },
  {
    day: 218,
    month: 'August',
    date: 'August 6',
    oldTestament: 'Psalm 10:16-18, 11:1-7, 12:1-8',
    newTestament: '1 Corinthians 3:5-23',
    psalm: 'Psalm 28:1-9',
    proverb: 'Proverbs 20:26-27'
  },
  {
    day: 219,
    month: 'August',
    date: 'August 7',
    oldTestament: 'Psalm 13:1-6, 14:1-7, 15:1-5',
    newTestament: '1 Corinthians 4:1-21',
    psalm: 'Psalm 29:1-11',
    proverb: 'Proverbs 20:28-30'
  },
  {
    day: 220,
    month: 'August',
    date: 'August 8',
    oldTestament: 'Psalm 16:1-11, 17:1-15, 18:1-15',
    newTestament: '1 Corinthians 5:1-13',
    psalm: 'Psalm 30:1-12',
    proverb: 'Proverbs 21:1-2'
  },
  {
    day: 221,
    month: 'August',
    date: 'August 9',
    oldTestament: 'Psalm 18:16-36, 18:37-50, 19:1-14',
    newTestament: '1 Corinthians 6:1-20',
    psalm: 'Psalm 31:1-8',
    proverb: 'Proverbs 21:3'
  },
  {
    day: 222,
    month: 'August',
    date: 'August 10',
    oldTestament: 'Psalm 20:1-9, 21:1-13, 22:1-18',
    newTestament: '1 Corinthians 7:1-24',
    psalm: 'Psalm 31:9-18',
    proverb: 'Proverbs 21:4'
  },
  {
    day: 223,
    month: 'August',
    date: 'August 11',
    oldTestament: 'Psalm 22:19-31, 23:1-6, 24:1-10',
    newTestament: '1 Corinthians 7:25-40',
    psalm: 'Psalm 31:19-24',
    proverb: 'Proverbs 21:5-7'
  },
  {
    day: 224,
    month: 'August',
    date: 'August 12',
    oldTestament: 'Psalm 25:1-15, 25:16-22, 26:1-12',
    newTestament: '1 Corinthians 8:1-13',
    psalm: 'Psalm 32:1-11',
    proverb: 'Proverbs 21:8-10'
  },
  {
    day: 225,
    month: 'August',
    date: 'August 13',
    oldTestament: 'Psalm 27:1-6, 27:7-14, 28:1-9',
    newTestament: '1 Corinthians 9:1-18',
    psalm: 'Psalm 33:1-11',
    proverb: 'Proverbs 21:11-12'
  },
  {
    day: 226,
    month: 'August',
    date: 'August 14',
    oldTestament: 'Psalm 29:1-11, 30:1-12, 31:1-8',
    newTestament: '1 Corinthians 9:19-27, 10:1-13',
    psalm: 'Psalm 33:12-22',
    proverb: 'Proverbs 21:13'
  },
  {
    day: 227,
    month: 'August',
    date: 'August 15',
    oldTestament: 'Psalm 31:9-18, 31:19-24, 32:1-11',
    newTestament: '1 Corinthians 10:14-33, 11:1-2',
    psalm: 'Psalm 34:1-10',
    proverb: 'Proverbs 21:14-16'
  },
  {
    day: 228,
    month: 'August',
    date: 'August 16',
    oldTestament: 'Psalm 33:1-11, 33:12-22, 34:1-10',
    newTestament: '1 Corinthians 11:3-16',
    psalm: 'Psalm 34:11-22',
    proverb: 'Proverbs 21:17-18'
  },
  {
    day: 229,
    month: 'August',
    date: 'August 17',
    oldTestament: 'Psalm 34:11-22, 35:1-16, 35:17-28',
    newTestament: '1 Corinthians 11:17-34',
    psalm: 'Psalm 35:1-6',
    proverb: 'Proverbs 21:19-20'
  },
  {
    day: 230,
    month: 'August',
    date: 'August 18',
    oldTestament: 'Psalm 36:1-12, 37:1-11, 37:12-29',
    newTestament: '1 Corinthians 12:1-26',
    psalm: 'Psalm 35:17-28',
    proverb: 'Proverbs 21:21-22'
  },
  {
    day: 231,
    month: 'August',
    date: 'August 19',
    oldTestament: 'Psalm 37:30-40, 38:1-22, 39:1-13',
    newTestament: '1 Corinthians 12:27-31, 13:1-13',
    psalm: 'Psalm 36:1-12',
    proverb: 'Proverbs 21:23-24'
  },
  {
    day: 232,
    month: 'August',
    date: 'August 20',
    oldTestament: 'Psalm 40:1-10, 40:11-17, 41:1-13',
    newTestament: '1 Corinthians 14:1-17',
    psalm: 'Psalm 37:1-11',
    proverb: 'Proverbs 21:25-26'
  },
  {
    day: 233,
    month: 'August',
    date: 'August 21',
    oldTestament: 'Psalm 42:1-11, 43:1-5, 44:1-8',
    newTestament: '1 Corinthians 14:18-40',
    psalm: 'Psalm 37:12-29',
    proverb: 'Proverbs 21:27'
  },
  {
    day: 234,
    month: 'August',
    date: 'August 22',
    oldTestament: 'Psalm 44:9-26, 45:1-17, 46:1-11',
    newTestament: '1 Corinthians 15:1-28',
    psalm: 'Psalm 37:30-40',
    proverb: 'Proverbs 21:28-29'
  },
  {
    day: 235,
    month: 'August',
    date: 'August 23',
    oldTestament: 'Psalm 47:1-9, 48:1-14, 49:1-20',
    newTestament: '1 Corinthians 15:29-58',
    psalm: 'Psalm 38:1-22',
    proverb: 'Proverbs 21:30-31'
  },
  {
    day: 236,
    month: 'August',
    date: 'August 24',
    oldTestament: 'Psalm 50:1-23, 51:1-19, 52:1-9',
    newTestament: '1 Corinthians 16:1-24',
    psalm: 'Psalm 39:1-13',
    proverb: 'Proverbs 22:1'
  },
  {
    day: 237,
    month: 'August',
    date: 'August 25',
    oldTestament: 'Psalm 53:1-6, 54:1-7, 55:1-23',
    newTestament: '2 Corinthians 1:1-11',
    psalm: 'Psalm 40:1-10',
    proverb: 'Proverbs 22:2-4'
  },
  {
    day: 238,
    month: 'August',
    date: 'August 26',
    oldTestament: 'Psalm 56:1-13, 57:1-11, 58:1-11',
    newTestament: '2 Corinthians 1:12-24, 2:1-11',
    psalm: 'Psalm 40:11-17',
    proverb: 'Proverbs 22:5-6'
  },
  {
    day: 239,
    month: 'August',
    date: 'August 27',
    oldTestament: 'Psalm 59:1-17, 60:1-12, 61:1-8',
    newTestament: '2 Corinthians 2:12-17',
    psalm: 'Psalm 41:1-13',
    proverb: 'Proverbs 22:7'
  },
  {
    day: 240,
    month: 'August',
    date: 'August 28',
    oldTestament: 'Psalm 62:1-12, 63:1-11, 64:1-10',
    newTestament: '2 Corinthians 3:1-18',
    psalm: 'Psalm 42:1-11',
    proverb: 'Proverbs 22:8-9'
  },
  {
    day: 241,
    month: 'August',
    date: 'August 29',
    oldTestament: 'Psalm 65:1-13, 66:1-20, 67:1-7',
    newTestament: '2 Corinthians 4:1-12',
    psalm: 'Psalm 43:1-5',
    proverb: 'Proverbs 22:10-12'
  },
  {
    day: 242,
    month: 'August',
    date: 'August 30',
    oldTestament: 'Psalm 68:1-18, 68:19-35, 69:1-18',
    newTestament: '2 Corinthians 4:13-18, 5:1-10',
    psalm: 'Psalm 44:1-8',
    proverb: 'Proverbs 22:13'
  },
  {
    day: 243,
    month: 'August',
    date: 'August 31',
    oldTestament: 'Psalm 69:19-36, 70:1-5, 71:1-24',
    newTestament: '2 Corinthians 5:11-21, 6:1-10',
    psalm: 'Psalm 44:9-26',
    proverb: 'Proverbs 22:14-15'
  },

  // ===== SEPTEMBER =====
  {
    day: 244,
    month: 'September',
    date: 'September 1',
    oldTestament: 'Psalm 72:1-20, 73:1-28, 74:1-23',
    newTestament: '2 Corinthians 6:11-18, 7:1-16',
    psalm: 'Psalm 45:1-17',
    proverb: 'Proverbs 22:16-17'
  },
  {
    day: 245,
    month: 'September',
    date: 'September 2',
    oldTestament: 'Psalm 75:1-10, 76:1-12, 77:1-20',
    newTestament: '2 Corinthians 8:1-24',
    psalm: 'Psalm 46:1-11',
    proverb: 'Proverbs 22:18-19'
  },
  {
    day: 246,
    month: 'September',
    date: 'September 3',
    oldTestament: 'Psalm 78:1-31, 78:32-55, 78:56-72',
    newTestament: '2 Corinthians 9:1-15',
    psalm: 'Psalm 47:1-9',
    proverb: 'Proverbs 22:20-21'
  },
  {
    day: 247,
    month: 'September',
    date: 'September 4',
    oldTestament: 'Psalm 79:1-13, 80:1-19, 81:1-16',
    newTestament: '2 Corinthians 10:1-18',
    psalm: 'Psalm 48:1-14',
    proverb: 'Proverbs 22:22-23'
  },
  {
    day: 248,
    month: 'September',
    date: 'September 5',
    oldTestament: 'Psalm 82:1-8, 83:1-18, 84:1-12',
    newTestament: '2 Corinthians 11:1-33',
    psalm: 'Psalm 49:1-20',
    proverb: 'Proverbs 22:24-25'
  },
  {
    day: 249,
    month: 'September',
    date: 'September 6',
    oldTestament: 'Psalm 85:1-13, 86:1-17, 87:1-7',
    newTestament: '2 Corinthians 12:1-21',
    psalm: 'Psalm 50:1-23',
    proverb: 'Proverbs 22:26-27'
  },
  {
    day: 250,
    month: 'September',
    date: 'September 7',
    oldTestament: 'Psalm 88:1-18, 89:1-13, 89:14-37',
    newTestament: '2 Corinthians 13:1-14',
    psalm: 'Psalm 51:1-19',
    proverb: 'Proverbs 22:28-29'
  },
  {
    day: 251,
    month: 'September',
    date: 'September 8',
    oldTestament: 'Psalm 89:38-52, 90:1-17, 91:1-16',
    newTestament: 'Galatians 1:1-24',
    psalm: 'Psalm 52:1-9',
    proverb: 'Proverbs 23:1-3'
  },
  {
    day: 252,
    month: 'September',
    date: 'September 9',
    oldTestament: 'Psalm 92:1-15, 93:1-5, 94:1-23',
    newTestament: 'Galatians 2:1-21',
    psalm: 'Psalm 53:1-6',
    proverb: 'Proverbs 23:4-5'
  },
  {
    day: 253,
    month: 'September',
    date: 'September 10',
    oldTestament: 'Psalm 95:1-11, 96:1-13, 97:1-12',
    newTestament: 'Galatians 3:1-29',
    psalm: 'Psalm 54:1-7',
    proverb: 'Proverbs 23:6-8'
  },
  {
    day: 254,
    month: 'September',
    date: 'September 11',
    oldTestament: 'Psalm 98:1-9, 99:1-9, 100:1-5',
    newTestament: 'Galatians 4:1-31',
    psalm: 'Psalm 55:1-23',
    proverb: 'Proverbs 23:9-11'
  },
  {
    day: 255,
    month: 'September',
    date: 'September 12',
    oldTestament: 'Psalm 101:1-8, 102:1-28, 103:1-22',
    newTestament: 'Galatians 5:1-26',
    psalm: 'Psalm 56:1-13',
    proverb: 'Proverbs 23:12-14'
  },
  {
    day: 256,
    month: 'September',
    date: 'September 13',
    oldTestament: 'Psalm 104:1-23, 104:24-35, 105:1-15',
    newTestament: 'Galatians 6:1-18',
    psalm: 'Psalm 57:1-11',
    proverb: 'Proverbs 23:15-18'
  },
  {
    day: 257,
    month: 'September',
    date: 'September 14',
    oldTestament: 'Psalm 105:16-36, 105:37-45, 106:1-12',
    newTestament: 'Ephesians 1:1-23',
    psalm: 'Psalm 58:1-11',
    proverb: 'Proverbs 23:19-21'
  },
  {
    day: 258,
    month: 'September',
    date: 'September 15',
    oldTestament: 'Psalm 106:13-31, 106:32-48, 107:1-43',
    newTestament: 'Ephesians 2:1-22',
    psalm: 'Psalm 59:1-17',
    proverb: 'Proverbs 23:22-25'
  },
  {
    day: 259,
    month: 'September',
    date: 'September 16',
    oldTestament: 'Psalm 108:1-13, 109:1-31, 110:1-7',
    newTestament: 'Ephesians 3:1-21',
    psalm: 'Psalm 60:1-12',
    proverb: 'Proverbs 23:26-28'
  },
  {
    day: 260,
    month: 'September',
    date: 'September 17',
    oldTestament: 'Psalm 111:1-10, 112:1-10, 113:1-9',
    newTestament: 'Ephesians 4:1-32',
    psalm: 'Psalm 61:1-8',
    proverb: 'Proverbs 23:29-35'
  },
  {
    day: 261,
    month: 'September',
    date: 'September 18',
    oldTestament: 'Psalm 114:1-8, 115:1-18, 116:1-19',
    newTestament: 'Ephesians 5:1-33',
    psalm: 'Psalm 62:1-12',
    proverb: 'Proverbs 24:1-2'
  },
  {
    day: 262,
    month: 'September',
    date: 'September 19',
    oldTestament: 'Psalm 117:1-2, 118:1-18, 118:19-29',
    newTestament: 'Ephesians 6:1-24',
    psalm: 'Psalm 63:1-11',
    proverb: 'Proverbs 24:3-4'
  },
  {
    day: 263,
    month: 'September',
    date: 'September 20',
    oldTestament: 'Psalm 119:1-16, 119:17-32, 119:33-48',
    newTestament: 'Philippians 1:1-30',
    psalm: 'Psalm 64:1-10',
    proverb: 'Proverbs 24:5-6'
  },
    {
    day: 264,
    month: 'September',
    date: 'September 21',
    oldTestament: 'Psalm 119:49-64, 119:65-80, 119:81-96',
    newTestament: 'Philippians 2:1-30',
    psalm: 'Psalm 65:1-13',
    proverb: 'Proverbs 24:7-9'
  },
  {
    day: 265,
    month: 'September',
    date: 'September 22',
    oldTestament: 'Psalm 119:97-112, 119:113-128, 119:129-152',
    newTestament: 'Philippians 3:1-21',
    psalm: 'Psalm 66:1-20',
    proverb: 'Proverbs 24:10-12'
  },
  {
    day: 266,
    month: 'September',
    date: 'September 23',
    oldTestament: 'Psalm 119:153-176, 120:1-7, 121:1-8',
    newTestament: 'Philippians 4:1-23',
    psalm: 'Psalm 67:1-7',
    proverb: 'Proverbs 24:13-14'
  },
  {
    day: 267,
    month: 'September',
    date: 'September 24',
    oldTestament: 'Psalm 122:1-9, 123:1-4, 124:1-8',
    newTestament: 'Colossians 1:1-20',
    psalm: 'Psalm 68:1-18',
    proverb: 'Proverbs 24:15-16'
  },
  {
    day: 268,
    month: 'September',
    date: 'September 25',
    oldTestament: 'Psalm 125:1-5, 126:1-6, 127:1-5',
    newTestament: 'Colossians 1:21-29, 2:1-7',
    psalm: 'Psalm 68:19-35',
    proverb: 'Proverbs 24:17-20'
  },
  {
    day: 269,
    month: 'September',
    date: 'September 26',
    oldTestament: 'Psalm 128:1-6, 129:1-8, 130:1-8',
    newTestament: 'Colossians 2:8-23',
    psalm: 'Psalm 69:1-18',
    proverb: 'Proverbs 24:21-22'
  },
  {
    day: 270,
    month: 'September',
    date: 'September 27',
    oldTestament: 'Psalm 131:1-3, 132:1-18, 133:1-3',
    newTestament: 'Colossians 3:1-25',
    psalm: 'Psalm 69:19-36',
    proverb: 'Proverbs 24:23-25'
  },
  {
    day: 271,
    month: 'September',
    date: 'September 28',
    oldTestament: 'Psalm 134:1-3, 135:1-21, 136:1-26',
    newTestament: 'Colossians 4:1-18',
    psalm: 'Psalm 70:1-5',
    proverb: 'Proverbs 24:26'
  },
  {
    day: 272,
    month: 'September',
    date: 'September 29',
    oldTestament: 'Psalm 137:1-9, 138:1-8, 139:1-24',
    newTestament: '1 Thessalonians 1:1-10, 2:1-9',
    psalm: 'Psalm 71:1-24',
    proverb: 'Proverbs 24:27'
  },
  {
    day: 273,
    month: 'September',
    date: 'September 30',
    oldTestament: 'Psalm 140:1-13, 141:1-10, 142:1-7',
    newTestament: '1 Thessalonians 2:10-20, 3:1-13',
    psalm: 'Psalm 72:1-20',
    proverb: 'Proverbs 24:28-29'
  },

  // ===== OCTOBER =====
  {
    day: 274,
    month: 'October',
    date: 'October 1',
    oldTestament: 'Psalm 143:1-12, 144:1-15, 145:1-21',
    newTestament: '1 Thessalonians 4:1-18, 5:1-3',
    psalm: 'Psalm 73:1-28',
    proverb: 'Proverbs 24:30-34'
  },
  {
    day: 275,
    month: 'October',
    date: 'October 2',
    oldTestament: 'Isaiah 66:1-24',
    newTestament: 'Philippians 3:4b-21',
    psalm: 'Psalm 74:1-23',
    proverb: 'Proverbs 24:15-16'
  },
  {
    day: 276,
    month: 'October',
    date: 'October 3',
    oldTestament: 'Jeremiah 1:1-19, 2:1-30',
    newTestament: 'Philippians 4:1-23',
    psalm: 'Psalm 75:1-10',
    proverb: 'Proverbs 24:17-20'
  },
  {
    day: 277,
    month: 'October',
    date: 'October 4',
    oldTestament: 'Jeremiah 2:31-37, 3:1-25, 4:1-18',
    newTestament: 'Colossians 1:1-20',
    psalm: 'Psalm 76:1-12',
    proverb: 'Proverbs 24:21-22'
  },
  {
    day: 278,
    month: 'October',
    date: 'October 5',
    oldTestament: 'Jeremiah 4:19-31, 5:1-31, 6:1-14',
    newTestament: 'Colossians 1:21-27',
    psalm: 'Psalm 77:1-20',
    proverb: 'Proverbs 24:23-25'
  },
  {
    day: 279,
    month: 'October',
    date: 'October 6',
    oldTestament: 'Jeremiah 6:15-30, 7:1-34',
    newTestament: 'Colossians 2:8-23',
    psalm: 'Psalm 78:1-31',
    proverb: 'Proverbs 24:26'
  },
  {
    day: 280,
    month: 'October',
    date: 'October 7',
    oldTestament: 'Jeremiah 8:8-22, 9:1-26',
    newTestament: 'Colossians 3:1-17',
    psalm: 'Psalm 78:32-55',
    proverb: 'Proverbs 24:27'
  },
  {
    day: 281,
    month: 'October',
    date: 'October 8',
    oldTestament: 'Jeremiah 10:1-25, 11:1-23',
    newTestament: 'Colossians 3:18-25, 4:1-18',
    psalm: 'Psalm 78:56-72',
    proverb: 'Proverbs 24:28-29'
  },
  {
    day: 282,
    month: 'October',
    date: 'October 9',
    oldTestament: 'Jeremiah 12:1-17, 13:1-27, 14:1-10',
    newTestament: '1 Thessalonians 1:1-10, 2:1-9',
    psalm: 'Psalm 79:1-13',
    proverb: 'Proverbs 24:30-34'
  },
  {
    day: 283,
    month: 'October',
    date: 'October 10',
    oldTestament: 'Jeremiah 14:11-22, 15:1-21, 16:1-15',
    newTestament: '1 Thessalonians 2:10-20, 3:1-13',
    psalm: 'Psalm 80:1-19',
    proverb: 'Proverbs 25:1-5'
  },
  {
    day: 284,
    month: 'October',
    date: 'October 11',
    oldTestament: 'Jeremiah 16:16-21, 17:1-27, 18:1-23',
    newTestament: '1 Thessalonians 4:1-18, 5:1-3',
    psalm: 'Psalm 81:1-16',
    proverb: 'Proverbs 25:6-7'
  },
  {
    day: 285,
    month: 'October',
    date: 'October 12',
    oldTestament: 'Jeremiah 19:1-15, 20:1-18, 21:1-14',
    newTestament: '1 Thessalonians 5:4-28',
    psalm: 'Psalm 82:1-8',
    proverb: 'Proverbs 25:8-10'
  },
  {
    day: 286,
    month: 'October',
    date: 'October 13',
    oldTestament: 'Jeremiah 22:1-30, 23:1-20',
    newTestament: '2 Thessalonians 1:1-12',
    psalm: 'Psalm 83:1-18',
    proverb: 'Proverbs 25:11-14'
  },
  {
    day: 287,
    month: 'October',
    date: 'October 14',
    oldTestament: 'Jeremiah 23:21-40, 24:1-10, 25:1-38',
    newTestament: '2 Thessalonians 2:1-17',
    psalm: 'Psalm 84:1-12',
    proverb: 'Proverbs 25:15'
  },
  {
    day: 288,
    month: 'October',
    date: 'October 15',
    oldTestament: 'Jeremiah 26:1-24, 27:1-22',
    newTestament: '2 Thessalonians 3:1-18',
    psalm: 'Psalm 85:1-13',
    proverb: 'Proverbs 25:16'
  },
  {
    day: 289,
    month: 'October',
    date: 'October 16',
    oldTestament: 'Jeremiah 28:1-17, 29:1-32',
    newTestament: '1 Timothy 1:1-20',
    psalm: 'Psalm 86:1-17',
    proverb: 'Proverbs 25:17'
  },
  {
    day: 290,
    month: 'October',
    date: 'October 17',
    oldTestament: 'Jeremiah 30:1-24, 31:1-26',
    newTestament: '1 Timothy 2:1-15',
    psalm: 'Psalm 87:1-7',
    proverb: 'Proverbs 25:18-19'
  },
  {
    day: 291,
    month: 'October',
    date: 'October 18',
    oldTestament: 'Jeremiah 31:27-40, 32:1-44',
    newTestament: '1 Timothy 3:1-16',
    psalm: 'Psalm 88:1-18',
    proverb: 'Proverbs 25:20-22'
  },
  {
    day: 292,
    month: 'October',
    date: 'October 19',
    oldTestament: 'Jeremiah 33:1-26, 34:1-22',
    newTestament: '1 Timothy 4:1-16',
    psalm: 'Psalm 89:1-13',
    proverb: 'Proverbs 25:23-24'
  },
  {
    day: 293,
    month: 'October',
    date: 'October 20',
    oldTestament: 'Jeremiah 35:1-19, 36:1-32',
    newTestament: '1 Timothy 5:1-25',
    psalm: 'Psalm 89:14-37',
    proverb: 'Proverbs 25:25-27'
  },
  {
    day: 294,
    month: 'October',
    date: 'October 21',
    oldTestament: 'Jeremiah 37:1-21, 38:1-28',
    newTestament: '1 Timothy 6:1-21',
    psalm: 'Psalm 89:38-52',
    proverb: 'Proverbs 25:28'
  },
  {
    day: 295,
    month: 'October',
    date: 'October 22',
    oldTestament: 'Jeremiah 39:1-18, 40:1-16, 41:1-18',
    newTestament: '2 Timothy 1:1-18',
    psalm: 'Psalm 90:1-17, 91:1-16',
    proverb: 'Proverbs 26:1-2'
  },
  {
    day: 296,
    month: 'October',
    date: 'October 23',
    oldTestament: 'Jeremiah 42:1-22, 43:1-13, 44:1-23',
    newTestament: '2 Timothy 2:1-21',
    psalm: 'Psalm 92:1-15, 93:1-5',
    proverb: 'Proverbs 26:3-5'
  },
  {
    day: 297,
    month: 'October',
    date: 'October 24',
    oldTestament: 'Jeremiah 44:24-30, 45:1-5, 46:1-28',
    newTestament: '2 Timothy 2:22-26, 3:1-17',
    psalm: 'Psalm 94:1-23',
    proverb: 'Proverbs 26:6-8'
  },
  {
    day: 298,
    month: 'October',
    date: 'October 25',
    oldTestament: 'Jeremiah 47:1-7, 48:1-47',
    newTestament: '2 Timothy 4:1-22',
    psalm: 'Psalm 95:1-11, 96:1-13',
    proverb: 'Proverbs 26:9-12'
  },
  {
    day: 299,
    month: 'October',
    date: 'October 26',
    oldTestament: 'Jeremiah 49:1-22, 49:23-39, 50:1-46',
    newTestament: 'Titus 1:1-16',
    psalm: 'Psalm 97:1-12, 98:1-9',
    proverb: 'Proverbs 26:13-16'
  },
  {
    day: 300,
    month: 'October',
    date: 'October 27',
    oldTestament: 'Jeremiah 51:1-53',
    newTestament: 'Titus 2:1-15',
    psalm: 'Psalm 99:1-9',
    proverb: 'Proverbs 26:17'
  },
  {
    day: 301,
    month: 'October',
    date: 'October 28',
    oldTestament: 'Jeremiah 51:54-64, 52:1-34',
    newTestament: 'Titus 3:1-15',
    psalm: 'Psalm 100:1-5',
    proverb: 'Proverbs 26:18-19'
  },
  {
    day: 302,
    month: 'October',
    date: 'October 29',
    oldTestament: 'Lamentations 1:1-22, 2:1-19',
    newTestament: 'Philemon 1:1-25',
    psalm: 'Psalm 101:1-8',
    proverb: 'Proverbs 26:20'
  },
  {
    day: 303,
    month: 'October',
    date: 'October 30',
    oldTestament: 'Lamentations 2:20-22, 3:1-66',
    newTestament: 'Hebrews 1:1-14',
    psalm: 'Psalm 102:1-28',
    proverb: 'Proverbs 26:21-22'
  },
  {
    day: 304,
    month: 'October',
    date: 'October 31',
    oldTestament: 'Lamentations 4:1-22, 5:1-22',
    newTestament: 'Hebrews 2:1-18',
    psalm: 'Psalm 103:1-22',
    proverb: 'Proverbs 26:23'
  },

  // ===== NOVEMBER =====
  {
    day: 305,
    month: 'November',
    date: 'November 1',
    oldTestament: 'Ezekiel 1:1-28, 2:1-10, 3:1-15',
    newTestament: 'Hebrews 3:1-19',
    psalm: 'Psalm 104:1-23',
    proverb: 'Proverbs 26:24-26'
  },
  {
    day: 306,
    month: 'November',
    date: 'November 2',
    oldTestament: 'Ezekiel 3:16-27, 4:1-17, 5:1-17',
    newTestament: 'Hebrews 4:1-16',
    psalm: 'Psalm 104:24-35',
    proverb: 'Proverbs 26:27'
  },
  {
    day: 307,
    month: 'November',
    date: 'November 3',
    oldTestament: 'Ezekiel 6:1-14, 7:1-27, 8:1-18',
    newTestament: 'Hebrews 5:1-14',
    psalm: 'Psalm 105:1-15',
    proverb: 'Proverbs 26:28'
  },
  {
    day: 308,
    month: 'November',
    date: 'November 4',
    oldTestament: 'Ezekiel 9:1-14, 10:1-22, 11:1-25',
    newTestament: 'Hebrews 6:1-20',
    psalm: 'Psalm 105:16-36',
    proverb: 'Proverbs 27:1-2'
  },
  {
    day: 309,
    month: 'November',
    date: 'November 5',
    oldTestament: 'Ezekiel 12:1-28, 13:1-23, 14:1-11',
    newTestament: 'Hebrews 7:1-17',
    psalm: 'Psalm 105:37-45',
    proverb: 'Proverbs 27:3'
  },
  {
    day: 310,
    month: 'November',
    date: 'November 6',
    oldTestament: 'Ezekiel 14:12-23, 15:1-8, 16:1-42',
    newTestament: 'Hebrews 7:18-28',
    psalm: 'Psalm 106:1-12',
    proverb: 'Proverbs 27:4-6'
  },
  {
    day: 311,
    month: 'November',
    date: 'November 7',
    oldTestament: 'Ezekiel 16:43-63, 17:1-24',
    newTestament: 'Hebrews 8:1-13',
    psalm: 'Psalm 106:13-31',
    proverb: 'Proverbs 27:7-9'
  },
  {
    day: 312,
    month: 'November',
    date: 'November 8',
    oldTestament: 'Ezekiel 18:1-32, 19:1-14',
    newTestament: 'Hebrews 9:1-10',
    psalm: 'Psalm 106:32-48',
    proverb: 'Proverbs 27:10'
  },
  {
    day: 313,
    month: 'November',
    date: 'November 9',
    oldTestament: 'Ezekiel 20:1-49',
    newTestament: 'Hebrews 9:11-28',
    psalm: 'Psalm 107:1-43',
    proverb: 'Proverbs 27:11'
  },
  {
    day: 314,
    month: 'November',
    date: 'November 10',
    oldTestament: 'Ezekiel 21:1-32, 22:1-31',
    newTestament: 'Hebrews 10:1-17',
    psalm: 'Psalm 108:1-13',
    proverb: 'Proverbs 27:12'
  },
  {
    day: 315,
    month: 'November',
    date: 'November 11',
    oldTestament: 'Ezekiel 23:1-49',
    newTestament: 'Hebrews 10:18-39',
    psalm: 'Psalm 109:1-31',
    proverb: 'Proverbs 27:13'
  },
  {
    day: 316,
    month: 'November',
    date: 'November 12',
    oldTestament: 'Ezekiel 24:1-27, 25:1-17, 26:1-21',
    newTestament: 'Hebrews 11:1-16',
    psalm: 'Psalm 110:1-7',
    proverb: 'Proverbs 27:14'
  },
  {
    day: 317,
    month: 'November',
    date: 'November 13',
    oldTestament: 'Ezekiel 27:1-36, 28:1-26',
    newTestament: 'Hebrews 11:17-31',
    psalm: 'Psalm 111:1-10',
    proverb: 'Proverbs 27:15-16'
  },
  {
    day: 318,
    month: 'November',
    date: 'November 14',
    oldTestament: 'Ezekiel 29:1-21, 30:1-26',
    newTestament: 'Hebrews 11:32-40, 12:1-13',
    psalm: 'Psalm 112:1-10',
    proverb: 'Proverbs 27:17'
  },
  {
    day: 319,
    month: 'November',
    date: 'November 15',
    oldTestament: 'Ezekiel 31:1-18, 32:1-32',
    newTestament: 'Hebrews 12:14-29',
    psalm: 'Psalm 113:1-9, 114:1-8',
    proverb: 'Proverbs 27:18-20'
  },
  {
    day: 320,
    month: 'November',
    date: 'November 16',
    oldTestament: 'Ezekiel 33:1-33, 34:1-31',
    newTestament: 'Hebrews 13:1-25',
    psalm: 'Psalm 115:1-18',
    proverb: 'Proverbs 27:21-22'
  },
  {
    day: 321,
    month: 'November',
    date: 'November 17',
    oldTestament: 'Ezekiel 35:1-15, 36:1-38',
    newTestament: 'James 1:1-18',
    psalm: 'Psalm 116:1-19',
    proverb: 'Proverbs 27:23-27'
  },
  {
    day: 322,
    month: 'November',
    date: 'November 18',
    oldTestament: 'Ezekiel 37:1-28, 38:1-23',
    newTestament: 'James 1:19-27, 2:1-17',
    psalm: 'Psalm 117:1-2',
    proverb: 'Proverbs 28:1'
  },
  {
    day: 323,
    month: 'November',
    date: 'November 19',
    oldTestament: 'Ezekiel 39:1-29, 40:1-27',
    newTestament: 'James 2:18-26, 3:1-18',
    psalm: 'Psalm 118:1-18',
    proverb: 'Proverbs 28:2'
  },
  {
    day: 324,
    month: 'November',
    date: 'November 20',
    oldTestament: 'Ezekiel 40:28-49, 41:1-26',
    newTestament: 'James 4:1-17',
    psalm: 'Psalm 118:19-29',
    proverb: 'Proverbs 28:3-5'
  },
  {
    day: 325,
    month: 'November',
    date: 'November 21',
    oldTestament: 'Ezekiel 42:1-20, 43:1-27',
    newTestament: 'James 5:1-20',
    psalm: 'Psalm 119:1-16',
    proverb: 'Proverbs 28:6-7'
  },
  {
    day: 326,
    month: 'November',
    date: 'November 22',
    oldTestament: 'Ezekiel 44:1-31, 45:1-12',
    newTestament: '1 Peter 1:1-12',
    psalm: 'Psalm 119:17-32',
    proverb: 'Proverbs 28:8-10'
  },
  {
    day: 327,
    month: 'November',
    date: 'November 23',
    oldTestament: 'Ezekiel 45:13-25, 46:1-24',
    newTestament: '1 Peter 1:13-25, 2:1-10',
    psalm: 'Psalm 119:33-48',
    proverb: 'Proverbs 28:11'
  },
  {
    day: 328,
    month: 'November',
    date: 'November 24',
    oldTestament: 'Ezekiel 47:1-23, 48:1-35',
    newTestament: '1 Peter 2:11-25, 3:1-7',
    psalm: 'Psalm 119:49-64',
    proverb: 'Proverbs 28:12-13'
  },
  {
    day: 329,
    month: 'November',
    date: 'November 25',
    oldTestament: 'Daniel 1:1-21, 2:1-23',
    newTestament: '1 Peter 3:8-22, 4:1-6',
    psalm: 'Psalm 119:65-80',
    proverb: 'Proverbs 28:14'
  },
  {
    day: 330,
    month: 'November',
    date: 'November 26',
    oldTestament: 'Daniel 2:24-49, 3:1-30',
    newTestament: '1 Peter 4:7-19, 5:1-14',
    psalm: 'Psalm 119:81-96',
    proverb: 'Proverbs 28:15-16'
  },
  {
    day: 331,
    month: 'November',
    date: 'November 27',
    oldTestament: 'Daniel 4:1-37',
    newTestament: '2 Peter 1:1-21',
    psalm: 'Psalm 119:97-112',
    proverb: 'Proverbs 28:17-18'
  },
  {
    day: 332,
    month: 'November',
    date: 'November 28',
    oldTestament: 'Daniel 5:1-31',
    newTestament: '2 Peter 2:1-22',
    psalm: 'Psalm 119:113-128',
    proverb: 'Proverbs 28:19-20'
  },
  {
    day: 333,
    month: 'November',
    date: 'November 29',
    oldTestament: 'Daniel 6:1-28',
    newTestament: '2 Peter 3:1-18',
    psalm: 'Psalm 119:129-152',
    proverb: 'Proverbs 28:21-22'
  },
  {
    day: 334,
    month: 'November',
    date: 'November 30',
    oldTestament: 'Daniel 7:1-28',
    newTestament: '1 John 1:1-10',
    psalm: 'Psalm 119:153-176',
    proverb: 'Proverbs 28:23-24'
  },

  // ===== DECEMBER =====
  {
    day: 335,
    month: 'December',
    date: 'December 1',
    oldTestament: 'Daniel 8:1-27, 9:1-27',
    newTestament: '1 John 2:1-17',
    psalm: 'Psalm 120:1-7',
    proverb: 'Proverbs 28:25-26'
  },
  {
    day: 336,
    month: 'December',
    date: 'December 2',
    oldTestament: 'Daniel 10:1-21, 11:1-45',
    newTestament: '1 John 2:18-29, 3:1-10',
    psalm: 'Psalm 121:1-8',
    proverb: 'Proverbs 28:27-28'
  },
  {
    day: 337,
    month: 'December',
    date: 'December 3',
    oldTestament: 'Daniel 12:1-13, Hosea 1:1-11, 2:1-23',
    newTestament: '1 John 3:11-24, 4:1-6',
    psalm: 'Psalm 122:1-9',
    proverb: 'Proverbs 29:1-3'
  },
  {
    day: 338,
    month: 'December',
    date: 'December 4',
    oldTestament: 'Hosea 3:1-5, 4:1-19, 5:1-15',
    newTestament: '1 John 4:7-21, 5:1-12',
    psalm: 'Psalm 123:1-4',
    proverb: 'Proverbs 29:4-5'
  },
  {
    day: 339,
    month: 'December',
    date: 'December 5',
    oldTestament: 'Hosea 6:1-11, 7:1-16, 8:1-14',
    newTestament: '1 John 5:13-21, 2 John 1:1-13',
    psalm: 'Psalm 124:1-8',
    proverb: 'Proverbs 29:6-8'
  },
  {
    day: 340,
    month: 'December',
    date: 'December 6',
    oldTestament: 'Hosea 9:1-17, 10:1-15, 11:1-12',
    newTestament: '3 John 1:1-15, Jude 1:1-25',
    psalm: 'Psalm 125:1-5',
    proverb: 'Proverbs 29:9-11'
  },
  {
    day: 341,
    month: 'December',
    date: 'December 7',
    oldTestament: 'Hosea 12:1-14, 13:1-16, 14:1-9',
    newTestament: 'Revelation 1:1-20',
    psalm: 'Psalm 126:1-6',
    proverb: 'Proverbs 29:12-14'
  },
  {
    day: 342,
    month: 'December',
    date: 'December 8',
    oldTestament: 'Joel 1:1-20, 2:1-32, 3:1-21',
    newTestament: 'Revelation 2:1-17',
    psalm: 'Psalm 127:1-5',
    proverb: 'Proverbs 29:15-17'
  },
  {
    day: 343,
    month: 'December',
    date: 'December 9',
    oldTestament: 'Amos 1:1-15, 2:1-16, 3:1-15',
    newTestament: 'Revelation 2:18-29, 3:1-6',
    psalm: 'Psalm 128:1-6',
    proverb: 'Proverbs 29:18-20'
  },
  {
    day: 344,
    month: 'December',
    date: 'December 10',
    oldTestament: 'Amos 4:1-13, 5:1-27, 6:1-14',
    newTestament: 'Revelation 3:7-22',
    psalm: 'Psalm 129:1-8',
    proverb: 'Proverbs 29:21-22'
  },
  {
    day: 345,
    month: 'December',
    date: 'December 11',
    oldTestament: 'Amos 7:1-17, 8:1-14, 9:1-15',
    newTestament: 'Revelation 4:1-11, 5:1-14',
    psalm: 'Psalm 130:1-8',
    proverb: 'Proverbs 29:23-24'
  },
  {
    day: 346,
    month: 'December',
    date: 'December 12',
    oldTestament: 'Obadiah 1:1-21, Jonah 1:1-17, 2:1-10',
    newTestament: 'Revelation 6:1-17, 7:1-17',
    psalm: 'Psalm 131:1-3',
    proverb: 'Proverbs 29:25-27'
  },
  {
    day: 347,
    month: 'December',
    date: 'December 13',
    oldTestament: 'Jonah 3:1-10, 4:1-11, Micah 1:1-16',
    newTestament: 'Revelation 8:1-13, 9:1-21',
    psalm: 'Psalm 132:1-18',
    proverb: 'Proverbs 30:1-4'
  },
  {
    day: 348,
    month: 'December',
    date: 'December 14',
    oldTestament: 'Micah 2:1-13, 3:1-12, 4:1-13',
    newTestament: 'Revelation 10:1-11, 11:1-19',
    psalm: 'Psalm 133:1-3',
    proverb: 'Proverbs 30:5-6'
  },
  {
    day: 349,
    month: 'December',
    date: 'December 15',
    oldTestament: 'Micah 5:1-15, 6:1-16, 7:1-20',
    newTestament: 'Revelation 12:1-17, 13:1-18',
    psalm: 'Psalm 134:1-3',
    proverb: 'Proverbs 30:7-9'
  },
  {
    day: 350,
    month: 'December',
    date: 'December 16',
    oldTestament: 'Nahum 1:1-15, 2:1-13, 3:1-19',
    newTestament: 'Revelation 14:1-20, 15:1-8',
    psalm: 'Psalm 135:1-21',
    proverb: 'Proverbs 30:10-14'
  },
  {
    day: 351,
    month: 'December',
    date: 'December 17',
    oldTestament: 'Habakkuk 1:1-17, 2:1-20, 3:1-19',
    newTestament: 'Revelation 16:1-21, 17:1-18',
    psalm: 'Psalm 136:1-26',
    proverb: 'Proverbs 30:15-20'
  },
    {
    day: 352,
    month: 'December',
    date: 'December 18',
    oldTestament: 'Zephaniah 1:1-18, 2:1-15, 3:1-20',
    newTestament: 'Revelation 18:1-24, 19:1-21',
    psalm: 'Psalm 137:1-9',
    proverb: 'Proverbs 30:21-23'
  },
  {
    day: 353,
    month: 'December',
    date: 'December 19',
    oldTestament: 'Haggai 1:1-15, 2:1-23, Zechariah 1:1-21',
    newTestament: 'Revelation 20:1-15, 21:1-8',
    psalm: 'Psalm 138:1-8',
    proverb: 'Proverbs 30:24-28'
  },
  {
    day: 354,
    month: 'December',
    date: 'December 20',
    oldTestament: 'Zechariah 2:1-13, 3:1-10, 4:1-14',
    newTestament: 'Revelation 21:9-27, 22:1-5',
    psalm: 'Psalm 139:1-24',
    proverb: 'Proverbs 30:29-31'
  },
  {
    day: 355,
    month: 'December',
    date: 'December 21',
    oldTestament: 'Zechariah 5:1-11, 6:1-15, 7:1-14',
    newTestament: 'Revelation 22:6-21',
    psalm: 'Psalm 140:1-13',
    proverb: 'Proverbs 30:32-33'
  },
  {
    day: 356,
    month: 'December',
    date: 'December 22',
    oldTestament: 'Zechariah 8:1-23, 9:1-17, 10:1-12',
    newTestament: 'Matthew 1:1-25, 2:1-12',
    psalm: 'Psalm 141:1-10',
    proverb: 'Proverbs 31:1-3'
  },
  {
    day: 357,
    month: 'December',
    date: 'December 23',
    oldTestament: 'Zechariah 11:1-17, 12:1-14, 13:1-9',
    newTestament: 'Matthew 2:13-23, 3:1-6',
    psalm: 'Psalm 142:1-7',
    proverb: 'Proverbs 31:4-5'
  },
  {
    day: 358,
    month: 'December',
    date: 'December 24',
    oldTestament: 'Zechariah 14:1-21, Malachi 1:1-14',
    newTestament: 'Matthew 3:7-17, 4:1-11',
    psalm: 'Psalm 143:1-12',
    proverb: 'Proverbs 31:6-7'
  },
  {
    day: 359,
    month: 'December',
    date: 'December 25',
    oldTestament: 'Malachi 2:1-17, 3:1-18, 4:1-6',
    newTestament: 'Matthew 4:12-25, 5:1-16',
    psalm: 'Psalm 144:1-15',
    proverb: 'Proverbs 31:8-9'
  },
  {
    day: 360,
    month: 'December',
    date: 'December 26',
    oldTestament: 'Psalm 145:1-21, 146:1-10, 147:1-20',
    newTestament: 'Matthew 5:17-48',
    psalm: 'Psalm 145:1-21',
    proverb: 'Proverbs 31:10-12'
  },
  {
    day: 361,
    month: 'December',
    date: 'December 27',
    oldTestament: 'Psalm 148:1-14, 149:1-9, 150:1-6',
    newTestament: 'Matthew 6:1-34',
    psalm: 'Psalm 146:1-10',
    proverb: 'Proverbs 31:13-15'
  },
  {
    day: 362,
    month: 'December',
    date: 'December 28',
    oldTestament: 'Proverbs 1:1-33, 2:1-22, 3:1-35',
    newTestament: 'Matthew 7:1-29',
    psalm: 'Psalm 147:1-20',
    proverb: 'Proverbs 31:16-18'
  },
  {
    day: 363,
    month: 'December',
    date: 'December 29',
    oldTestament: 'Proverbs 4:1-27, 5:1-23, 6:1-35',
    newTestament: 'Matthew 8:1-34',
    psalm: 'Psalm 148:1-14',
    proverb: 'Proverbs 31:19-21'
  },
  {
    day: 364,
    month: 'December',
    date: 'December 30',
    oldTestament: 'Proverbs 7:1-27, 8:1-36, 9:1-18',
    newTestament: 'Matthew 9:1-38',
    psalm: 'Psalm 149:1-9',
    proverb: 'Proverbs 31:22-24'
  },
  {
    day: 365,
    month: 'December',
    date: 'December 31',
    oldTestament: 'Proverbs 10:1-32, 11:1-31, 12:1-28',
    newTestament: 'Matthew 10:1-42',
    psalm: 'Psalm 150:1-6',
    proverb: 'Proverbs 31:25-31'
  }
];