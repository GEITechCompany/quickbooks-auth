const express = require('express');
const axios = require('axios');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Function to get the consistent redirect URI
// This ensures we always use the same URI regardless of deployment
function getConsistentRedirectUri() {
  // Check for Render deployment and use its URL if available
  if (process.env.RENDER_EXTERNAL_URL) {
    return `${process.env.RENDER_EXTERNAL_URL}/oauth/callback`;
  }
  
  // Fallback to hardcoded Vercel URL if RENDER_EXTERNAL_URL is not available
  return 'https://pool-agent-gei-tech.vercel.app/oauth/callback';
}

// Function to get the QuickBooks API credentials
function getCredentials() {
  // For Vercel deployment, use environment variables
  if (process.env.QUICKBOOKS_CLIENT_ID) {
    console.log("Using environment variables for credentials");
    return {
      clientId: process.env.QUICKBOOKS_CLIENT_ID,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
      // Use the consistent redirect URI instead of reading from env
      redirectUri: getConsistentRedirectUri(),
      environment: process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox',
    };
  }
  
  // Fallback to local file
  try {
    console.log("Using local file for credentials");
    const credentialsPath = path.join(__dirname, 'quickbooks_credentials.json');
    const credentialsData = fs.readFileSync(credentialsPath, 'utf8');
    const credentials = JSON.parse(credentialsData);
    return {
      clientId: credentials.client_id,
      clientSecret: credentials.client_secret,
      // Use the consistent redirect URI instead of reading from file
      redirectUri: getConsistentRedirectUri(),
      environment: credentials.environment || 'sandbox',
    };
  } catch (error) {
    console.error('Error reading credentials file:', error);
    return null;
  }
}

// Store tokens in memory (for demo purposes only)
// In production, store these securely in a database
const tokenStore = {};

// GET route to handle OAuth2 redirects
app.get('/oauth/callback', async (req, res) => {
  try {
    // Capture the `code` and `state` query parameters
    const { code, state, realmId } = req.query;
    console.log(`Code: ${code}, State: ${state}, RealmId: ${realmId}`);
    
    if (!code) {
      return res.status(400).send('<html><body><h1>Error: Missing authorization code</h1></body></html>');
    }

    // Get credentials
    const credentials = getCredentials();
    if (!credentials) {
      return res.status(500).send('<html><body><h1>Error: Could not retrieve API credentials</h1></body></html>');
    }

    // Verify that our redirect URI matches what's expected
    const redirectUri = getConsistentRedirectUri();
    console.log(`Using redirect URI for token exchange: ${redirectUri}`);
    
    // Both sandbox and production use the same token endpoint
    const tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
      
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    console.log("Token exchange parameters:", {
      grantType: 'authorization_code',
      code: code,
      redirectUri: redirectUri,
      tokenEndpoint: tokenEndpoint,
      environment: credentials.environment
    });

    const authHeader = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64');
    
    try {
      const tokenResponse = await axios.post(tokenEndpoint, params, {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('Token exchange successful');
      
      // Store the tokens (in memory for this demo)
      // In production, store these securely in a database
      tokenStore[realmId] = {
        accessToken: tokenResponse.data.access_token,
        refreshToken: tokenResponse.data.refresh_token,
        expiresAt: Date.now() + (tokenResponse.data.expires_in * 1000),
        realmId
      };
      
      console.log(`Tokens stored for company ID: ${realmId}`);
      
      // Redirect to the main page with success information
      res.redirect(`/?oauth_success=true&realmId=${realmId}`);
      
    } catch (error) {
      console.error('Token exchange error:', error.response?.data || error.message);
      res.status(500).send(`
        <html>
          <head>
            <title>Authorization Failed</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #c62828; }
              p { line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>QuickBooks Authorization Failed</h1>
              <p>There was a problem connecting to your QuickBooks account.</p>
              <p>Error: ${error.response?.data?.error_description || error.message}</p>
              <p>Please try again later or contact support.</p>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).send('<html><body><h1>An unexpected error occurred</h1></body></html>');
  }
});

// Endpoint to get the authorization URL
app.get('/api/auth-url', (req, res) => {
  const credentials = getCredentials();
  if (!credentials) {
    return res.status(500).json({ error: 'Could not retrieve API credentials' });
  }
  
  // Log all credential info (except secret) for debugging
  console.log("Credentials being used:", {
    clientId: credentials.clientId,
    redirectUri: credentials.redirectUri,
    environment: credentials.environment
  });
  
  // Generate a random state value for security
  const state = Math.random().toString(36).substring(2, 15);
  
  // Both sandbox and production environments use the same base URL
  const authUrl = 'https://appcenter.intuit.com/connect/oauth2';
    
  // Define scope based on environment
  const scope = 'com.intuit.quickbooks.accounting';
    
  // Get the redirect URI using the consistent function
  const redirectUri = getConsistentRedirectUri();
  
  const url = `${authUrl}?client_id=${credentials.clientId}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  
  console.log("Generated authorization URL:", url);
  console.log("Environment:", credentials.environment);
  console.log("Redirect URI:", redirectUri);
  
  res.json({ url, state });
});

// Test route to verify the server is working
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is working correctly!',
    timestamp: new Date().toISOString()
  });
});

// Endpoint to check token status
app.get('/api/token-status', (req, res) => {
  const { realmId } = req.query;
  
  if (!realmId) {
    return res.status(400).json({ error: 'RealmId is required' });
  }
  
  const tokenData = tokenStore[realmId];
  
  if (!tokenData) {
    return res.json({ connected: false });
  }
  
  const isValid = tokenData.expiresAt > Date.now();
  
  res.json({
    connected: true,
    isValid,
    expiresAt: new Date(tokenData.expiresAt).toISOString()
  });
});

// Direct route for QuickBooks authorization with hardcoded redirect
app.get('/connect-to-quickbooks', (req, res) => {
  const credentials = getCredentials();
  if (!credentials) {
    return res.status(500).send('<html><body><h1>Error: Could not retrieve API credentials</h1></body></html>');
  }
  
  const redirectUri = getConsistentRedirectUri();
  const scope = 'com.intuit.quickbooks.accounting';
  const state = 'direct' + Math.random().toString(36).substring(2, 10);
  
  // Log for debugging
  console.log('Direct authorization route accessed');
  console.log('Using redirect URI:', redirectUri);
  
  // Construct the URL
  const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${credentials.clientId}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  
  // Redirect directly to QuickBooks
  res.redirect(authUrl);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Note: In a production environment, you should use a database to store tokens
// and implement refresh token mechanics to maintain long-term access. 