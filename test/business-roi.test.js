import assert from 'node:assert/strict';
import { calculateBusinessRoi } from '../lib/business-roi.js';

assert.deepEqual(calculateBusinessRoi({ weeklyTasks: 10, minutesPerTask: 6, hourlyValue: 300 }), {
  weeklyHours: 1,
  monthlyHours: 4.33,
  savedHours: 2.17,
  monthlyValue: 650,
  savedShare: 0.5
});
assert.equal(calculateBusinessRoi({ weeklyTasks: 0, minutesPerTask: 5, hourlyValue: 200 }).monthlyValue, 0);
assert.throws(() => calculateBusinessRoi({ weeklyTasks: -1, minutesPerTask: 5, hourlyValue: 200 }), RangeError);
assert.throws(() => calculateBusinessRoi({ weeklyTasks: 10, minutesPerTask: 0, hourlyValue: 200 }), RangeError);
assert.throws(() => calculateBusinessRoi({ weeklyTasks: 10, minutesPerTask: 5, hourlyValue: Infinity }), RangeError);
console.log('business-roi: 5 assertions passed');
