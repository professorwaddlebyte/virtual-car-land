import quizScoring from '../../../../lib/quizScoring';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  try {
    const { nationality } = req.query;
    
    if (!nationality) {
      return res.status(400).json({
        success: false,
        error: 'Nationality parameter is required'
      });
    }
    
    // Normalize nationality parameter (capitalize first letter of each word)
    const normalizedNationality = typeof nationality === 'string' 
      ? nationality
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      : nationality;
    
    const culturalData = quizScoring.CULTURAL_PREFERENCES[normalizedNationality];
    
    if (!culturalData) {
      return res.status(404).json({
        success: false,
        error: `Cultural preferences not found for nationality: ${normalizedNationality}`,
        availableNationalities: Object.keys(quizScoring.CULTURAL_PREFERENCES)
      });
    }
    
    return res.status(200).json({
      success: true,
      nationality: normalizedNationality,
      preferences: culturalData,
      sampleSize: culturalData.sampleSize || 0,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cultural preferences error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch cultural preferences',
      message: error.message
    });
  }
}