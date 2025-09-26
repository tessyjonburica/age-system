"use client"

import React, { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { predictAge } from "@/lib/api"
import type { PredictionResult } from "@/app/page"

interface WebcamCaptureProps {
  onPrediction: (result: PredictionResult) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
}

const CameraIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const SquareIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
  </svg>
)

const LoaderIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
)

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
    <line x1="12" y1="8" x2="12" y2="12" strokeWidth={2} />
    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth={2} />
  </svg>
)

export default function WebcamCapture({ onPrediction, isProcessing, setIsProcessing }: WebcamCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Log environment info on component mount
  React.useEffect(() => {
    console.log("[v0] WebcamCapture mounted")
    console.log("[v0] Location:", location.href)
    console.log("[v0] Protocol:", location.protocol)
    console.log("[v0] Navigator.mediaDevices:", !!navigator.mediaDevices)
    console.log("[v0] Navigator.getUserMedia:", !!navigator.mediaDevices?.getUserMedia)
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      console.log("[v0] Starting camera access...")
      console.log("[v0] Navigator:", navigator)
      console.log("[v0] MediaDevices:", navigator.mediaDevices)

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser")
      }

      // Check if we're on HTTPS or localhost
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error("Camera requires HTTPS or localhost")
      }

      // Try with simpler constraints first
      let mediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
        console.log("[v0] Basic camera access successful")
      } catch (basicError) {
        console.log("[v0] Basic access failed, trying with constraints:", basicError)
        // Try with specific constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, min: 320 },
            height: { ideal: 480, min: 240 },
            facingMode: "user",
            frameRate: { ideal: 30, min: 15 },
          },
          audio: false,
        })
      }

      console.log("[v0] Camera stream obtained:", mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        // Add event listeners for better debugging
        videoRef.current.onloadedmetadata = () => {
          console.log("[v0] Video metadata loaded, dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight)
          videoRef.current?.play().then(() => {
            console.log("[v0] Video play started successfully")
          }).catch(err => {
            console.error("[v0] Video play error:", err)
            setError("Failed to start video playback")
          })
        }
        
        videoRef.current.oncanplay = () => {
          console.log("[v0] Video can play, setting streaming to true")
          setIsStreaming(true)
        }
        
        videoRef.current.onplay = () => {
          console.log("[v0] Video is playing")
          setIsStreaming(true)
        }
        
        videoRef.current.onerror = (err) => {
          console.error("[v0] Video error:", err)
          setError("Video playback error")
        }

        // Force play after a short delay
        setTimeout(() => {
          if (videoRef.current && videoRef.current.paused) {
            console.log("[v0] Forcing video play after timeout")
            videoRef.current.play().catch(err => {
              console.error("[v0] Forced play failed:", err)
            })
          }
        }, 1000)
      }

      setStream(mediaStream)
    } catch (err) {
      console.error("[v0] Camera access error:", err)
      let errorMessage = "Failed to access camera. "
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage += "Please allow camera permissions and try again."
        } else if (err.name === "NotFoundError") {
          errorMessage += "No camera found. Please connect a camera and try again."
        } else if (err.name === "NotReadableError") {
          errorMessage += "Camera is being used by another application."
        } else {
          errorMessage += err.message
        }
      }
      
      setError(errorMessage)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      setIsStreaming(false)
    }
  }, [stream])

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) {
      console.log("[v0] Cannot capture: missing refs or already processing")
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) {
      console.error("[v0] Cannot get canvas context")
      setError("Failed to get canvas context")
      return
    }

    // Check if video is ready
    if (video.readyState < 2) {
      console.log("[v0] Video not ready, readyState:", video.readyState)
      setError("Video not ready. Please wait for camera to load.")
      return
    }

    console.log("[v0] Capturing photo... Video dimensions:", video.videoWidth, "x", video.videoHeight)

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      console.log("[v0] Frame drawn to canvas")
    } catch (err) {
      console.error("[v0] Error drawing to canvas:", err)
      setError("Failed to capture frame from video")
      return
    }

    // Convert canvas to blob
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          console.error("[v0] Failed to create blob from canvas")
          setError("Failed to create image from capture")
          return
        }

        console.log("[v0] Blob created, size:", blob.size, "bytes")

        try {
          setIsProcessing(true)
          setError(null)
          console.log("[v0] Processing image...")

          // Convert blob to File
          const file = new File([blob], "capture.jpg", { type: "image/jpeg" })
          console.log("[v0] File created:", file.name, file.size, "bytes")

          // Call age prediction API
          const result = await predictAge(file)
          console.log("[v0] Age prediction result:", result)

          // Create image URL for display
          const imageUrl = URL.createObjectURL(blob)

          // Create prediction result
          const prediction: PredictionResult = {
            id: Date.now().toString(),
            age: result.age,
            confidence: result.confidence,
            timestamp: new Date(),
            imageUrl,
          }

          onPrediction(prediction)
        } catch (err) {
          console.error("[v0] Processing error:", err)
          setError(err instanceof Error ? err.message : "Failed to process image")
        } finally {
          setIsProcessing(false)
        }
      },
      "image/jpeg",
      0.8,
    )
  }, [isProcessing, onPrediction, setIsProcessing])

  return (
    <div className="space-y-4">
      {/* Video Preview */}
      <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
        {isStreaming ? (
          <video 
            ref={videoRef} 
            className="h-full w-full object-cover" 
            autoPlay 
            playsInline 
            muted 
            controls={false}
            style={{ transform: 'scaleX(-1)' }} // Mirror the video for better UX
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <CameraIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Camera not active</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for capturing frames */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex gap-2">
        {!isStreaming ? (
          <>
            <Button onClick={startCamera} className="flex-1 text-xs">
              <CameraIcon className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
            <Button 
              onClick={() => {
                console.log("[v0] Manual debug - checking video ref:", videoRef.current)
                console.log("[v0] Manual debug - checking stream:", stream)
                console.log("[v0] Manual debug - checking isStreaming:", isStreaming)
                if (videoRef.current) {
                  console.log("[v0] Manual debug - video paused:", videoRef.current.paused)
                  console.log("[v0] Manual debug - video readyState:", videoRef.current.readyState)
                  videoRef.current.play().catch(console.error)
                }
              }} 
              variant="outline" 
              className="text-xs"
            >
              Debug
            </Button>
          </>
        ) : (
          <>
            <Button onClick={capturePhoto} disabled={isProcessing} className="flex-1 text-xs">
              {isProcessing ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CameraIcon className="mr-2 h-4 w-4" />
                  Capture & Analyze
                </>
              )}
            </Button>
            <Button onClick={stopCamera} variant="outline" disabled={isProcessing} className="text-xs bg-transparent">
              <SquareIcon className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertIcon className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <Alert>
          <LoaderIcon className="h-4 w-4 animate-spin" />
          <AlertDescription className="text-xs">Analyzing image for age prediction...</AlertDescription>
        </Alert>
      )}

      {/* Debug Info */}
      {isStreaming && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Camera Status: {isStreaming ? "Active" : "Inactive"}</div>
          {videoRef.current && (
            <>
              <div>Video Ready: {videoRef.current.readyState >= 2 ? "Yes" : "No"}</div>
              <div>Dimensions: {videoRef.current.videoWidth}x{videoRef.current.videoHeight}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
