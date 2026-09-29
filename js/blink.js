// Blink detection using the Eye Aspect Ratio (EAR)
// Soukupová & Čech (2016), "Real-Time Eye Blink Detection using Facial Landmarks"
//
//        p2   p3
//   p1            p4      EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
//        p6   p5
//
// Open eye  -> EAR around 0.25-0.35
// Closed eye -> EAR drops towards 0.1
// A photo can't blink, so its EAR stays flat.

// MediaPipe landmark numbers for [p1, p2, p3, p4, p5, p6]
const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

// Tuning values (write these down for the paper)
export const CLOSED_THRESHOLD = 0.2;  // below this, the eye counts as closed
export const OPEN_THRESHOLD = 0.25;   // above this, the eye counts as open again
const MIN_BLINK_MS = 50;              // shorter than this is noise
const MAX_BLINK_MS = 500;             // longer than this is eyes held shut, not a blink

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Landmarks are 0-1 scaled, so convert to pixels first. Otherwise a
// wide 640x480 frame squashes the ratio.
function eyeAspectRatio(landmarks, indices, width, height) {
  const p = indices.map(i => ({
    x: landmarks[i].x * width,
    y: landmarks[i].y * height
  }));
  const vertical = distance(p[1], p[5]) + distance(p[2], p[4]);
  const horizontal = distance(p[0], p[3]);
  return vertical / (2 * horizontal);
}

export class BlinkDetector {
  constructor() {
    this.blinkCount = 0;
    this.eyeClosed = false;
    this.closedAt = 0;
    this.ear = 0;
  }

  // Call once per video frame. Returns true on the frame a blink completes.
  update(landmarks, width, height, timeMs) {
    const left = eyeAspectRatio(landmarks, LEFT_EYE, width, height);
    const right = eyeAspectRatio(landmarks, RIGHT_EYE, width, height);
    this.ear = (left + right) / 2;

    if (!this.eyeClosed && this.ear < CLOSED_THRESHOLD) {
      // Eye just closed
      this.eyeClosed = true;
      this.closedAt = timeMs;
    } else if (this.eyeClosed && this.ear > OPEN_THRESHOLD) {
      // Eye just reopened: was it a real blink?
      this.eyeClosed = false;
      const duration = timeMs - this.closedAt;
      if (duration >= MIN_BLINK_MS && duration <= MAX_BLINK_MS) {
        this.blinkCount++;
        return true;
      }
    }
    return false;
  }

  reset() {
    this.blinkCount = 0;
    this.eyeClosed = false;
  }
}
