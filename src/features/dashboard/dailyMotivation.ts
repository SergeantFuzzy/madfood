const inspirationalQuotes = [
  "Small daily improvements lead to remarkable results.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Discipline is choosing what you want most over what you want now.",
  "Start where you are. Use what you have. Do what you can.",
  "Progress is progress, no matter how small.",
  "Consistency beats intensity when building lasting habits.",
  "A little progress each day adds up to big outcomes.",
  "You do not have to be perfect to make meaningful progress.",
  "The best time to build momentum is today.",
  "Your future self will thank you for what you do today.",
  "The secret to getting ahead is getting started.",
  "One thoughtful choice today can change your week."
];

const encouragingStatements = [
  "You are building something solid, one day at a time.",
  "Your effort today matters more than yesterday's mistakes.",
  "Keep going. You are closer than you think.",
  "Done is better than delayed. Keep moving.",
  "You have enough to make today a good day.",
  "Every small win counts. Stack them up.",
  "Your consistency is your superpower.",
  "The hard days still count. Show up anyway.",
  "You are capable of more than you feel right now.",
  "Keep the promise you made to yourself today.",
  "Momentum starts with one focused action.",
  "You are doing better than you think. Keep at it."
];

const getDayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 1);
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = current.getTime() - start.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
};

export const getDailyMotivation = (date = new Date()) => {
  const seed = getDayOfYear(date);
  const quote = inspirationalQuotes[seed % inspirationalQuotes.length];
  const encouragement = encouragingStatements[(seed * 3 + 1) % encouragingStatements.length];

  return {
    quote,
    encouragement
  };
};
