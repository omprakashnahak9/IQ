import { useEffect, useRef, useState } from 'react'
import { Camera, X, Check, AlertCircle } from 'lucide-react'

export default function CameraCapture({ onComplete, onCancel }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [capturedImages, setCapturedImages] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)

  const captureSteps = [
    { title: 'Front View', instruction: 'Look straight at camera', icon: '👤' },
    { title: 'Turn Left', instruction: 'Turn head slightly left', icon: '↖️' },
    { title: 'Turn Right', instruction: 'Turn head slightly right', icon: '↗️' },
    { title: 'Neutral', instruction: 'Relax your face', icon: '😐' },
    { title: 'Smile', instruction: 'Give a gentle smile', icon: '🙂' }
  ]

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          setIsReady(true)
        }
        streamRef.current = stream
      }
    } catch (err) {
      console.error('Camera error:', err)
      setError('Unable to access camera. Please allow camera permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !isReady) return

    setIsCapturing(true)
    
    setTimeout(() => {
      const video = videoRef.current
      const canvas = canvasRef.current

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = canvas.toDataURL('image/jpeg', 0.95)
      const newImages = [...capturedImages, imageData]
      setCapturedImages(newImages)

      if (currentStep < captureSteps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        // All images captured
        setTimeout(() => {
          stopCamera()
          onComplete(newImages)
        }, 300)
      }
      
      setIsCapturing(false)
    }, 100)
  }

  const handleDone = () => {
    if (capturedImages.length >= 3) {
      stopCamera()
      onComplete(capturedImages)
    }
  }

  const handleCancel = () => {
    stopCamera()
    onCancel()
  }

  const currentStepData = captureSteps[currentStep]

  return (
    <div className="camera-modal-overlay">
      <div className="camera-modal">
        {/* Header */}
        <div className="camera-modal-header">
          <div>
            <h3>Capture Face Images</h3>
            <p>Step {currentStep + 1} of {captureSteps.length}</p>
          </div>
          <button onClick={handleCancel} className="camera-close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Camera Feed */}
        <div className="camera-modal-body">
          {error ? (
            <div className="camera-error-box">
              <AlertCircle size={48} />
              <p>{error}</p>
              <button onClick={startCamera} className="btn-primary">
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="camera-feed-box">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video-feed"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Instruction Overlay */}
                <div className="camera-instruction-overlay">
                  <div className="instruction-badge">
                    <span className="instruction-icon">{currentStepData.icon}</span>
                    <div>
                      <div className="instruction-title">{currentStepData.title}</div>
                      <div className="instruction-text">{currentStepData.instruction}</div>
                    </div>
                  </div>
                </div>

                {/* Face Guide Circle */}
                <div className="face-guide-circle"></div>

                {/* Capture Flash */}
                {isCapturing && <div className="capture-flash"></div>}

                {/* Loading */}
                {!isReady && (
                  <div className="camera-loading-overlay">
                    <div className="spinner"></div>
                    <p>Starting camera...</p>
                  </div>
                )}
              </div>

              {/* Captured Images Preview */}
              {capturedImages.length > 0 && (
                <div className="captured-preview-bar">
                  <span>Captured: {capturedImages.length}/5</span>
                  <div className="preview-thumbnails">
                    {capturedImages.map((img, index) => (
                      <div key={index} className="preview-thumb">
                        <img src={img} alt={`${index + 1}`} />
                        <div className="thumb-check"><Check size={12} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Capture Button */}
        <div className="camera-modal-footer">
          <button onClick={handleCancel} className="btn-secondary">
            Cancel
          </button>
          
          {capturedImages.length >= 3 && currentStep < captureSteps.length - 1 && (
            <button onClick={handleDone} className="btn-secondary">
              Done ({capturedImages.length} images)
            </button>
          )}

          <button
            onClick={captureImage}
            disabled={!isReady || isCapturing}
            className="btn-capture-main"
          >
            <Camera size={24} />
            {isCapturing ? 'Capturing...' : 'Capture Photo'}
          </button>
        </div>
      </div>
    </div>
  )
}
