// Grab the elements from the page
const video = document.getElementById('video');
const statusText = document.getElementById('status');

async function startCamera() {
  // getUserMedia only exists on secure pages (https:// or localhost)
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    statusText.textContent = 'Camera not available. Open this page through Live Server (localhost) or https.';
    return;
  }

  try {
    // Ask the browser for the webcam (front camera on phones)
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false
    });

    // Plug the camera stream into the <video> element
    video.srcObject = stream;

    // Wait until the video has real frames before saying it's ready
    video.onloadedmetadata = () => {
      statusText.textContent = 'Camera ready';
    };
  } catch (err) {
    // Common errors: permission denied, no camera found, camera busy
    if (err.name === 'NotAllowedError') {
      statusText.textContent = 'Camera permission denied. Please allow camera access.';
    } else if (err.name === 'NotFoundError') {
      statusText.textContent = 'No camera found on this device.';
    } else if (err.name === 'NotReadableError') {
      statusText.textContent = 'Camera is being used by another app. Close it and reload.';
    } else {
      statusText.textContent = 'Could not start camera: ' + err.message;
    }
    console.error(err);
  }
}

startCamera();
