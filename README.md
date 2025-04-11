# QuickBooks OAuth Integration

This is a Node.js application for integrating with QuickBooks OAuth2.

## Setup and Credentials

### Environment Variables

This application uses environment variables for configuration. For local development, create a `.env` file with the following variables:

```
# QuickBooks API Credentials
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret
QUICKBOOKS_ENVIRONMENT=sandbox or production
```

### Sensitive Files

The following files contain sensitive information and are included in `.gitignore` to prevent them from being committed to the repository:

- `credentials.json` - Google API credentials
- `token.json` - OAuth tokens
- `quickbooks_credentials.json` - QuickBooks API credentials

Template files are provided for reference:
- `credentials.json.template`
- `token.json.template`
- `quickbooks_credentials.json.template`

If you need to use these files locally (instead of environment variables), copy the template files and remove the `.template` extension, then fill in your actual credentials.

## Deployment to Render

### Option 1: Deploy via GitHub

1. Push this repository to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" and select "Web Service"
4. Connect your GitHub account and select this repository
5. Configure the service:
   - Name: quickbooks-oauth (or your preferred name)
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Add the environment variables:
   - `QUICKBOOKS_CLIENT_ID`: Your QuickBooks client ID
   - `QUICKBOOKS_CLIENT_SECRET`: Your QuickBooks client secret
   - `QUICKBOOKS_ENVIRONMENT`: Set to `production` or `sandbox`
7. Click "Create Web Service"

### Option 2: Deploy via render.yaml

1. Push this repository to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" and select "Blueprint"
4. Connect your GitHub account and select this repository
5. Render will automatically detect the `render.yaml` file and set up the service
6. You'll still need to configure environment variables in the Render dashboard

## Important Notes

After deployment, you'll need to:

1. Go to your Intuit Developer account
2. Update the redirect URI to match your Render deployment URL
3. The URI should be: `https://your-app-name.onrender.com/oauth/callback`

## Local Development

1. Clone the repository
2. Run `npm install`
3. Create a `.env` file with your credentials (see above)
4. Run `node server.js`
5. Access at `http://localhost:3000`

## Security Considerations

- Never commit sensitive credentials or tokens to your repository
- Use environment variables for all sensitive information
- The application temporarily stores tokens in memory for demo purposes - in production, you should use a secure database 