const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const CF_APP_ID     = process.env.CASHFREE_APP_ID;
const CF_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CF_ENV        = (process.env.CASHFREE_ENV || 'TEST').toUpperCase();

const CF_BASE_URL = CF_ENV === 'PRODUCTION'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const CF_API_VERSION = '2023-08-01';

function cfHeaders() {
  return {
    'x-client-id':     CF_APP_ID,
    'x-client-secret': CF_SECRET_KEY,
    'x-api-version':   CF_API_VERSION,
    'Content-Type':    'application/json',
  };
}

async function test() {
  const cfPayload = {
    order_id:       `PP_TEST_${Date.now()}`,
    order_amount:   10,
    order_currency: 'INR',
    customer_details: {
      customer_id:    '123e4567-e89b-12d3-a456-426614174000',
      customer_name:  'Customer',
      customer_email: 'customer@paperprints.in',
      customer_phone: '9999999999',
    },
    order_meta: {
      return_url: `https://paperprints.in/payment/return?order_id=TEST`,
    },
  };

  try {
    const cfResponse = await axios.post(`${CF_BASE_URL}/orders`, cfPayload, {
      headers: cfHeaders(),
    });
    console.log("SUCCESS:", cfResponse.data);
  } catch (err) {
    console.error("ERROR:", err.response?.data || err.message);
  }
}

test();
