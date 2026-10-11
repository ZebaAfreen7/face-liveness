// Head-turn ratio: where the nose sits between the two sides of the face.
// About 0.5 = looking straight. It moves towards 0 or 1 as the head turns.
// On big turns it can go past 1 or below 0 (the nose sticks out past the cheek).
const NOSE = 1;
const EDGE_A = 234; // one side of the face (left side of the image)
const EDGE_B = 454; // other side of the face (right side of the image)

// First-guess thresholds from Zeba's test (straight = 0.46-0.56,
// full left = 1.17-1.7, full right = below 0). Check with gentle turns.
export const LEFT_THRESHOLD = 0.8;   // above this = turned to the user's left
export const RIGHT_THRESHOLD = 0.2;  // below this = turned to the user's right

export function headTurnRatio(landmarks) {
  const nose = landmarks[NOSE].x;
  const a = landmarks[EDGE_A].x;
  const b = landmarks[EDGE_B].x;
  return (nose - a) / (b - a);
}

// Turn a ratio into a word
export function turnDirection(ratio) {
  if (ratio > LEFT_THRESHOLD) return 'LEFT';
  if (ratio < RIGHT_THRESHOLD) return 'RIGHT';
  return 'STRAIGHT';
}
