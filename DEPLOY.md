# Deployment Instructions for Render

## Setup Process

1. Push this repository to GitHub (already done)
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" and select "Web Service"
4. Connect your GitHub account and select this repository
5. Configure the service:
   - Name: quickbooks-oauth (or your preferred name)
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`

## Important: Environment Variables Setup

You **must** set up the following environment variables in your Render Dashboard:

- `QUICKBOOKS_CLIENT_ID`: Your QuickBooks client ID
- `QUICKBOOKS_CLIENT_SECRET`: Your QuickBooks client secret
- `QUICKBOOKS_ENVIRONMENT`: Set to `production` or `sandbox`

## Troubleshooting "Exited with status 1" Error

If your deployment fails with "Exited with status 1 while building your code", check:

1. Make sure you have set up all required environment variables in the Render Dashboard
2. Check the build logs for specific error messages
3. Verify that your node version is compatible (Node 14 or higher is required)
4. Make sure there are no syntax errors in your code

## After Deployment

After successful deployment, you will need to:

1. Go to your Intuit Developer account
2. Update the redirect URI to match your Render deployment URL
3. The URI should be: `https://your-app-name.onrender.com/oauth/callback`
