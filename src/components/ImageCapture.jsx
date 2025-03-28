import React, { useState, useRef, useCallback } from 'react';

function ImageCapture({ onImageCaptured }) {
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false); // For camera stream
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Function to read file as Data URL
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFileChange = async (event) => {
    setError(null);
    stopCameraStream(); // Stop camera if it was running
    const file = event.target.files[0];
    if (file) {
      // Basic validation (can be expanded)
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid file type. Please select JPEG, PNG, or PDF.`);
        setImageDataUrl(null);
        if (onImageCaptured) onImageCaptured(null, file.type); // Notify parent of invalid type
        return;
      }

      try {
        const dataUrl = await readFileAsDataURL(file);
        setImageDataUrl(dataUrl);
        if (onImageCaptured) onImageCaptured(dataUrl, file.type); // Pass base64 data and type
      } catch (err) {
        console.error('Error reading file:', err);
        setError('Failed to read the selected file.');
        setImageDataUrl(null);
        if (onImageCaptured) onImageCaptured(null, file.type);
      }
    }
     // Reset file input to allow selecting the same file again
     if (fileInputRef.current) {
        fileInputRef.current.value = '';
     }
  };

  // Start camera stream
  const startCamera = async () => {
    setError(null);
    setImageDataUrl(null); // Clear previous image
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setIsCapturing(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError(`Could not access camera: ${err.message}`);
        setIsCapturing(false);
      }
    } else {
      setError('Camera access not supported by this browser/environment.');
    }
  };

  // Stop camera stream
  const stopCameraStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  }, []);

  // Capture frame from video stream
  const captureFrame = () => {
    setError(null);
    if (videoRef.current && canvasRef.current && isCapturing) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg'); // Capture as JPEG
      setImageDataUrl(dataUrl);
      stopCameraStream(); // Stop camera after capture
      if (onImageCaptured) onImageCaptured(dataUrl, 'image/jpeg'); // Pass base64 data and type
    } else {
        setError('Cannot capture frame. Camera not active or elements not ready.');
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);


  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem' }}>
      <h4>Capture/Select Receipt</h4>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Camera Section */}
      {isCapturing && (
        <div style={{ marginBottom: '1rem' }}>
          <video ref={videoRef} autoPlay playsInline style={{ maxWidth: '100%', border: '1px solid black' }}></video>
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas> {/* Hidden canvas for capture */}
          <button type="button" onClick={captureFrame} style={{ marginRight: '0.5rem' }}>Capture Photo</button>
          <button type="button" onClick={stopCameraStream}>Cancel Camera</button>
        </div>
      )}

      {/* Action Buttons */}
      {!isCapturing && (
        <div style={{ marginBottom: '1rem' }}>
          <button type="button" onClick={startCamera} style={{ marginRight: '0.5rem' }}>Use Camera</button>
          <button type="button" onClick={triggerFileInput}>Select File (JPG, PNG, PDF)</button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,application/pdf"
            style={{ display: 'none' }} // Hide the default input
          />
        </div>
      )}

      {/* Image Preview */}
      {imageDataUrl && !isCapturing && (
        <div>
          <h5>Preview:</h5>
          {imageDataUrl.startsWith('data:image') ? (
             <img src={imageDataUrl} alt="Receipt Preview" style={{ maxWidth: '100%', maxHeight: '300px', border: '1px solid #eee' }} />
          ) : imageDataUrl.startsWith('data:application/pdf') ? (
             <p>PDF selected. Preview not available, but file is ready.</p>
             // Optionally embed PDF viewer here if needed, but might be complex
          ) : null}

        </div>
      )}
    </div>
  );
}

export default ImageCapture;