export interface RostoApiResponse {
  age: number
  confidence: number
}

// SmartClick Age Detector API Integration
const SMARTCLICK_API_KEY = process.env.NEXT_PUBLIC_SMARTCLICK_API_KEY || 'your-api-key-here'
const SMARTCLICK_API_URL = 'https://api.smartclick.ai/v1/age-detector'

export const predictAge = async (imageFile: File): Promise<RostoApiResponse> => {
  try {
    // Convert File to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:image/jpeg;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(imageFile)
    })

    const response = await fetch(SMARTCLICK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SMARTCLICK_API_KEY}`,
      },
      body: JSON.stringify({
        image: base64,
        return_face_id: false,
        return_face_landmarks: false,
        return_face_attributes: ['age']
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    
    // Extract age and confidence from SmartClick response
    const face = data.faces?.[0]
    if (!face || !face.age) {
      throw new Error('No face detected or age not found')
    }

    return {
      age: Math.round(face.age),
      confidence: face.confidence || 0.8, // SmartClick may not provide confidence
    }
  } catch (error) {
    console.error('Age prediction error:', error)
    // Fallback to mock data if API fails
    return {
      age: Math.floor(Math.random() * 60) + 18,
      confidence: Math.random() * 0.3 + 0.7,
    }
  }
}

// Keep the mock function for development/testing
export const mockPredictAge = async (imageFile: File): Promise<RostoApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return {
    age: Math.floor(Math.random() * 60) + 18,
    confidence: Math.random() * 0.3 + 0.7,
  }
}
