const axios = require('axios');
const baseUrl = process.env.TEST_URL || 'http://localhost:3000';
async function runTests() {
  console.log(`Testing server at ${baseUrl}`);
  try {
    const response = await axios.get(`${baseUrl}/test`);
    console.log('Server is working:', response.data);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}
runTests();
