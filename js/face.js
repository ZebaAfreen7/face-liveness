// Face tracking with MediaPipe Face Landmarker (478 points per face)
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs';
import { BlinkDetector } from './blink.js';

const blinkDetector = new BlinkDetector();
const blinkCountText = document.getElementById('blink-count');
const earText = document.getElementById('ear-value');
const eyeStateText = document.getElementById('eye-state');

const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status');

let faceLandmarker;
let lastVideoTime = -1;

// 1. Load the pre-trained model (Google trained it, we just use it)
async function loadModel() {
  statusText.textContent = 'Loading face model...';

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU' // uses the graphics chip if available, falls back to CPU
    },
    runningMode: 'VIDEO',
    numFaces: 1
  });
}

// 2. Run the model on every new video frame and draw the points
function detectLoop() {
  // Only process a frame if the video has moved on
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;

    const now = performance.now();
    const results = faceLandmarker.detectForVideo(video, now);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.faceLandmarks.length > 0) {
      const landmarks = results.faceLandmarks[0]; // 478 {x, y, z} points, 0-1 scale
      drawFace(landmarks);
      statusText.textContent = `Face detected (${landmarks.length} points)`;
      updateBlink(landmarks, now);
    } else {
      statusText.textContent = 'No face detected. Look at the camera.';
    }
  }

  requestAnimationFrame(detectLoop);
}

// Run blink detection on this frame and show the numbers
function updateBlink(landmarks, now) {
  const blinked = blinkDetector.update(landmarks, canvas.width, canvas.height, now);

  earText.textContent = blinkDetector.ear.toFixed(3);
  eyeStateText.textContent = blinkDetector.eyeClosed ? 'closed' : 'open';
  blinkCountText.textContent = blinkDetector.blinkCount;

  if (blinked) {
    // Flash the counter green for a moment
    blinkCountText.classList.add('blink-flash');
    setTimeout(() => blinkCountText.classList.remove('blink-flash'), 300);
  }
}

// Draw the face mesh, with the eyes highlighted (we'll use them for blink detection)
function drawFace(landmarks) {
  const draw = new DrawingUtils(ctx);

  draw.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
    color: 'rgba(255, 255, 255, 0.25)',
    lineWidth: 0.5
  });
  draw.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, {
    color: '#4fc3f7',
    lineWidth: 1.5
  });
  draw.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
    color: '#66ff99',
    lineWidth: 1.5
  });
  draw.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, {
    color: '#66ff99',
    lineWidth: 1.5
  });
}

// 3. Start once both the model and the camera are ready
async function start() {
  try {
    await loadModel();
  } catch (err) {
    statusText.textContent = 'Could not load face model: ' + err.message;
    console.error(err);
    return;
  }

  const begin = () => {
    // Match the canvas to the real camera resolution so dots line up
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    detectLoop();
  };

  if (video.readyState >= 2) {
    begin();
  } else {
    video.addEventListener('loadeddata', begin, { once: true });
  }
}

start();
