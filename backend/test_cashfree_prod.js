const axios = require('axios');

async function testCashfree() {
  const CF_APP_ID = '1302560b81fea66557f6bec6fba0652031';
  const CF_SECRET_KEY = 'cfsk_ma_prod_97271c870189cd7f542c8d9f503ca10f_4b82bf37';
  const CF_BASE_URL = 'https://api.cashfree.com/pg';
  
  const cfPayload = {
    order_id:       `TEST_ORDER_${Date.now()}`,
    order_amount:   1,
    order_currency: 'INR',
    customer_details: {
      customer_id:    'test_123',
      customer_name:  'Customer',
      customer_email: 'customer@paperprints.in',
      customer_phone: '9999999999',
    },
    order_meta: {
      return_url: `https://paperprints.in/payment/return?order_id=test_123`,
    },
  };

  try {
    const response = await axios.post(`${CF_BASE_URL}/orders`, cfPayload, {
      headers: {
        'x-client-id': CF_APP_ID,
        'x-client-secret': CF_SECRET_KEY,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
      }
    });
    console.log("SUCCESS:");
    console.log(response.data);
  } catch (error) {
    console.log("ERROR:");
    console.log(error.response?.data || error.message);
  }
}

testCashfree();
