// Head-turn ratio: where the nose sits between the two sides of the face.
// About 0.5 = looking straight. It moves towards 0 or 1 as the head turns.
const NOSE = 1;
const EDGE_A = 234; // one side of the face (left side of the image)
const EDGE_B = 454; // other side of the face (right side of the image)

export function headTurnRatio(landmarks) {
  const nose = landmarks[NOSE].x;
  const a = landmarks[EDGE_A].x;
  const b = landmarks[EDGE_B].x;
  return (nose - a) / (b - a);
}
