const WORLD_LIMIT_METERS = 10;
const MAX_COMMANDS = 20;
const MAX_STEP_METERS = 1;
const MAX_TURN_DEGREES = 90;

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeHeading(degrees) {
  return ((degrees % 360) + 360) % 360;
}

/**
 * Deterministic 2D robot simulator. This module never connects to hardware.
 * Coordinates are metres; heading 0° points along +X.
 */
export function simulateRobotCommands(input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw Object.assign(new Error('commands dizisi boş olamaz.'), { status: 400 });
  }
  if (input.length > MAX_COMMANDS) {
    throw Object.assign(new Error(`En fazla ${MAX_COMMANDS} komut gönderilebilir.`), { status: 400 });
  }

  const state = { x: 0, y: 0, headingDeg: 0, halted: false };
  const trace = [];

  for (let index = 0; index < input.length; index += 1) {
    const command = input[index];
    if (!command || typeof command !== 'object' || Array.isArray(command)) {
      throw Object.assign(new Error(`commands[${index}] nesne olmalı.`), { status: 400 });
    }
    const type = String(command.type || '');
    if (state.halted && type !== 'stop' && type !== 'emergency_stop') {
      trace.push({ index, type, outcome: 'rejected_halted' });
      break;
    }

    if (type === 'move') {
      const distance = command.distance;
      if (!finiteNumber(distance) || distance === 0 || Math.abs(distance) > MAX_STEP_METERS) {
        throw Object.assign(new Error(`commands[${index}].distance -1 ile 1 metre arasında, sıfırdan farklı olmalı.`), { status: 400 });
      }
      const radians = state.headingDeg * Math.PI / 180;
      const nextX = state.x + Math.cos(radians) * distance;
      const nextY = state.y + Math.sin(radians) * distance;
      if (Math.abs(nextX) > WORLD_LIMIT_METERS || Math.abs(nextY) > WORLD_LIMIT_METERS) {
        state.halted = true;
        trace.push({ index, type, outcome: 'blocked_world_boundary' });
        break;
      }
      state.x = Number(nextX.toFixed(4));
      state.y = Number(nextY.toFixed(4));
      trace.push({ index, type, outcome: 'simulated', distance, position: { x: state.x, y: state.y } });
      continue;
    }

    if (type === 'turn') {
      const degrees = command.degrees;
      if (!finiteNumber(degrees) || degrees === 0 || Math.abs(degrees) > MAX_TURN_DEGREES) {
        throw Object.assign(new Error(`commands[${index}].degrees -90 ile 90 arasında, sıfırdan farklı olmalı.`), { status: 400 });
      }
      state.headingDeg = normalizeHeading(state.headingDeg + degrees);
      trace.push({ index, type, outcome: 'simulated', headingDeg: state.headingDeg });
      continue;
    }

    if (type === 'stop' || type === 'emergency_stop') {
      state.halted = true;
      trace.push({ index, type, outcome: type === 'emergency_stop' ? 'emergency_stopped' : 'stopped' });
      continue;
    }

    throw Object.assign(new Error(`commands[${index}].type desteklenmiyor.`), { status: 400 });
  }

  return {
    mode: 'simulation_only',
    hardwareConnected: false,
    physicalActuation: false,
    units: 'metres_and_degrees',
    limits: { worldBoundaryMeters: WORLD_LIMIT_METERS, maxStepMeters: MAX_STEP_METERS, maxTurnDegrees: MAX_TURN_DEGREES, maxCommands: MAX_COMMANDS },
    state,
    trace
  };
}
