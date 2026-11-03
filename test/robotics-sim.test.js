import assert from 'node:assert/strict';
import { simulateRobotCommands } from '../lib/robotics-sim.js';

const result = simulateRobotCommands([
  { type: 'move', distance: 0.5 },
  { type: 'turn', degrees: 90 },
  { type: 'move', distance: 0.25 }
]);
assert.equal(result.mode, 'simulation_only');
assert.equal(result.hardwareConnected, false);
assert.equal(result.physicalActuation, false);
assert.equal(result.state.x, 0.5);
assert.equal(result.state.y, 0.25);
assert.equal(result.state.headingDeg, 90);
assert.equal(result.trace.length, 3);

const stopped = simulateRobotCommands([
  { type: 'move', distance: 0.5 },
  { type: 'emergency_stop' },
  { type: 'move', distance: 0.5 }
]);
assert.equal(stopped.state.halted, true);
assert.equal(stopped.state.x, 0.5);
assert.equal(stopped.trace[2].outcome, 'rejected_halted');

assert.throws(() => simulateRobotCommands([{ type: 'move', distance: 2 }]), /-1 ile 1 metre/);
assert.throws(() => simulateRobotCommands([{ type: 'turn', degrees: 120 }]), /-90 ile 90/);
assert.throws(() => simulateRobotCommands([{ type: 'fly' }]), /desteklenmiyor/);
assert.throws(() => simulateRobotCommands([]), /boş olamaz/);
assert.throws(() => simulateRobotCommands(Array.from({ length: 21 }, () => ({ type: 'stop' }))), /En fazla 20/);

console.log('PROJECT Ω robotics simulator tests passed.');
