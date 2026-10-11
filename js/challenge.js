// Random head-turn challenge (active liveness check)
// The system asks the user to turn LEFT or RIGHT, chosen at random.
// A printed photo can't turn, and a pre-recorded video can't know
// which way it will be asked, so it can only pass by luck (about 50%).

export const CHALLENGE_TIME_MS = 5000; // user has 5 seconds to respond
export const HOLD_MS = 500;            // must hold the turn for 0.5 s (stops noise passing it)

// Secure random choice. Math.random() is predictable, which is bad for security,
// so we use the browser's crypto random generator instead.
function randomDirection() {
  const byte = crypto.getRandomValues(new Uint8Array(1))[0];
  return byte % 2 === 0 ? 'LEFT' : 'RIGHT';
}

export class HeadTurnChallenge {
  constructor() {
    this.state = 'idle'; // 'idle' | 'running' | 'passed' | 'failed'
    this.target = null;
    this.startedAt = 0;
    this.heldSince = null;
    this.responseMs = 0; // how long the user took (useful data for the paper)
  }

  start(timeMs) {
    this.state = 'running';
    this.target = randomDirection();
    this.startedAt = timeMs;
    this.heldSince = null;
    this.responseMs = 0;
  }

  // Call every frame. direction = 'LEFT' | 'RIGHT' | 'STRAIGHT', or null if no face.
  update(direction, timeMs) {
    if (this.state !== 'running') return;

    if (direction === this.target) {
      if (this.heldSince === null) this.heldSince = timeMs;
      if (timeMs - this.heldSince >= HOLD_MS) {
        this.state = 'passed';
        this.responseMs = timeMs - this.startedAt;
        return;
      }
    } else {
      this.heldSince = null; // turned away or lost the face: start holding again
    }

    if (timeMs - this.startedAt > CHALLENGE_TIME_MS) {
      this.state = 'failed';
    }
  }

  secondsLeft(timeMs) {
    const left = (CHALLENGE_TIME_MS - (timeMs - this.startedAt)) / 1000;
    return Math.max(0, left);
  }
}
