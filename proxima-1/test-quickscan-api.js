// Test Quick Scan API directly
const testQuickScan = async () => {
  const API_URL = 'https://web-production-945c4.up.railway.app/api/quick-scan';
  
  const testData = {
    body_part: 'Head',
    form_data: {
      symptoms: 'Headache and dizziness',
      painType: ['sharp', 'throbbing'],
      painLevel: 7,
      duration: 'days',
      dailyImpact: ['work', 'sleep'],
      frequency: 'first',
      whatTried: 'ibuprofen',
      didItHelp: 'temporarily',
      associatedSymptoms: 'nausea'
    },
    user_id: null
  };

  console.log('Sending request to:', API_URL);
  console.log('Request data:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const text = await response.text();
    console.log('Raw response:', text);

    try {
      const data = JSON.parse(text);
      console.log('Parsed response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
};

testQuickScan();