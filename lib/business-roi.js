const WEEKS_PER_MONTH = 4.33;
const DEFAULT_SAVED_SHARE = 0.5;

function finiteInRange(value, name, min, max) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be a finite number between ${min} and ${max}`);
  }
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateBusinessRoi({ weeklyTasks, minutesPerTask, hourlyValue, savedShare = DEFAULT_SAVED_SHARE }) {
  finiteInRange(weeklyTasks, 'weeklyTasks', 0, 10000);
  finiteInRange(minutesPerTask, 'minutesPerTask', 1, 600);
  finiteInRange(hourlyValue, 'hourlyValue', 0, 1000000);
  finiteInRange(savedShare, 'savedShare', 0, 1);

  const weeklyHours = weeklyTasks * minutesPerTask / 60;
  const monthlyHours = weeklyHours * WEEKS_PER_MONTH;
  const savedHours = monthlyHours * savedShare;
  return {
    weeklyHours: round2(weeklyHours),
    monthlyHours: round2(monthlyHours),
    savedHours: round2(savedHours),
    monthlyValue: Math.round(savedHours * hourlyValue),
    savedShare
  };
}
