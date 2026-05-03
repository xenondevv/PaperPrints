const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/vendors/register', {
      ownerName: 'Test',
      shopName: 'Test Shop',
      phone: '1234567890',
      address: '123 Test St',
      email: 'test@example.com'
    }, {
      headers: {
        // Need a valid token to test, but we can just see if it fails due to auth or something else
      }
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
