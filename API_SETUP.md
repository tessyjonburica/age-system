# API Setup Guide

## 🚀 Quick Start with SmartClick (Recommended)

### 1. Get Your Free API Key
- Visit: https://smartclick.ai/api/age-detector/
- Sign up for a free account
- Get 4,000 requests/month free

### 2. Configure Environment Variables
Create a `.env.local` file in your project root:

```bash
# SmartClick Age Detector API
NEXT_PUBLIC_SMARTCLICK_API_KEY=your-actual-api-key-here
```

### 3. Test the Integration
```bash
pnpm dev
```

## 🔄 Alternative APIs

### GCPAWS Vision API
- **Free Tier**: Available
- **Accuracy**: ±5 years
- **Setup**: Visit https://www.gcpaws-vision.cloud/age-estimation-api

### Zyla API Hub
- **Free Tier**: Limited usage
- **Features**: Age + Gender detection
- **Setup**: Available through Zyla API Hub

## 🛠️ Implementation Details

The project now uses the real `predictAge()` function instead of `mockPredictAge()`. 

**Key Features:**
- ✅ Automatic fallback to mock data if API fails
- ✅ Base64 image encoding for API compatibility
- ✅ Error handling and logging
- ✅ Maintains existing UI/UX

**API Response Format:**
```typescript
{
  age: number,        // Predicted age
  confidence: number  // Confidence score (0-1)
}
```

## 🔧 Troubleshooting

### Common Issues:
1. **API Key Not Working**: Check your `.env.local` file
2. **CORS Errors**: SmartClick handles CORS for web requests
3. **Rate Limits**: Free tier has 40 requests/minute limit
4. **No Face Detected**: API returns fallback data

### Debug Mode:
Check browser console for detailed error messages and API responses.

## 📊 Usage Monitoring

Monitor your API usage:
- SmartClick Dashboard: Check remaining requests
- Browser Network tab: Monitor API calls
- Console logs: Track success/failure rates
