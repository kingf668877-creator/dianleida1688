// Netlify Function: API proxy for DianLeiDa
// Handles signing and forwarding requests to avoid CORS issues
// Includes retry logic for network timeouts
const crypto = require('crypto');
const https = require('https');

const APP_ID = "f973685c8aae4bde";
const APP_SECRET = "9b921e202725436ba193b4ef9812345";
const API_HOST = "open.dianleida.net";

function generateSign(params) {
  const filtered = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== "" && v !== null && v !== undefined && k !== "sign") {
      filtered[k] = v;
    }
  }
  const sortedKeys = Object.keys(filtered).sort();
  const parts = sortedKeys.map(k => {
    let val = filtered[k];
    if (Array.isArray(val) || typeof val === 'object') {
      val = JSON.stringify(val);
    }
    return `${k}=${val}`;
  });
  const paramStr = parts.join('&');
  const signStr = `appSecret=${APP_SECRET}&${paramStr}&appSecret=${APP_SECRET}`;
  return crypto.createHash('md5').update(signStr, 'utf8').digest('hex');
}

function makeRequest(path, body, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    
    const options = {
      hostname: API_HOST,
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
      rejectUnauthorized: false,
      timeout: timeoutMs,
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ code: 500, msg: 'Parse error', raw: data });
        }
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.write(bodyStr);
    req.end();
  });
}

// Retry wrapper: try up to 3 times with 1s delay
async function makeRequestWithRetry(path, body, maxRetries = 3) {
  let lastError = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await makeRequest(path, body);
      return result;
    } catch (e) {
      lastError = e;
      console.log(`Attempt ${i + 1} failed: ${e.message}`);
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  throw lastError;
}

exports.handler = async (event, context) => {
  // Set function timeout to 30s (Pro tier) or let it use default
  context.callbackWaitsForEmptyEventLoop = false;
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }
  
  try {
    const requestBody = JSON.parse(event.body || '{}');
    const { action, ...params } = requestBody;
    
    const pathMap = {
      'search': '/api/v1/product/search',
      'category': '/api/v1/category/info',
      'userinfo': '/api/v1/uesr/info',
    };
    
    const apiPath = pathMap[action];
    if (!apiPath) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid action' }),
      };
    }
    
    const nonceStr = crypto.randomBytes(16).toString('hex');
    const fullBody = {
      appId: APP_ID,
      nonceStr: nonceStr,
      ...params,
    };
    
    fullBody.sign = generateSign(fullBody);
    
    // Use retry logic for network reliability
    const result = await makeRequestWithRetry(apiPath, fullBody, 3);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ code: 500, msg: error.message }),
    };
  }
};
