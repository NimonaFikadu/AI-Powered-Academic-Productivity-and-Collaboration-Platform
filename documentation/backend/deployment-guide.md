# Deployment Guide

This guide provides step-by-step instructions for deploying the UniHub backend to various environments, including Vercel and traditional hosting platforms.

## Prerequisites

Before deployment, ensure you have:

1. A MySQL database instance (version 8.0+)
2. Node.js (v16+) installed on your local machine
3. An OpenAI API key for RAG features
4. A Qdrant Cloud account (or self-hosted Qdrant instance)
5. All environment variables prepared

## Environment Variables

Create a `.env` file with the following variables:

```dotenv
# Database Configuration
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=24h

# CORS Configuration
FRONTEND_URL=https://your-frontend-url.com

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Qdrant Configuration
QDRANT_URL=https://your-qdrant-instance.cloud
QDRANT_API_KEY=your-qdrant-api-key

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

## Deployment to Vercel

Vercel is the recommended deployment platform for UniHub, offering serverless hosting with automatic scaling.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Configure Vercel Project

The repository includes a `vercel.json` configuration file:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 3: Prepare your project for deployment

Run the deployment script:

```bash
bash vercel-deploy.sh
```

This script:
1. Creates an `api` directory with the correct structure
2. Creates a special handler for database connections
3. Sets up the correct file structure for Vercel's serverless environment

### Step 4: Deploy to Vercel

```bash
vercel --prod
```

During deployment, Vercel will ask for environment variables. Enter the values from your `.env` file.

### Step 5: Verify Deployment

Once deployed, test the API by visiting:

```
https://your-deployment-url.vercel.app/api/status
```

## Deployment to Traditional Hosting

If you prefer a traditional hosting environment, follow these steps:

### Step 1: Build the project

```bash
npm run build
```

### Step 2: Set up a process manager

Install PM2:

```bash
npm install -g pm2
```

Create a process configuration file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'unihub-backend',
    script: './src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      // Other environment variables should be set on the server directly
    }
  }]
};
```

### Step 3: Start the application

```bash
pm2 start ecosystem.config.js
```

### Step 4: Set up a reverse proxy

For Nginx, use the following configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Migration

Before the first deployment and after each schema change, run the migration script:

```bash
# On development environment
npm run migrate

# For production deployment
NODE_ENV=production npm run migrate
```

The migration system will automatically find and execute all SQL files in the `src/migrations` directory.

## File Upload Configuration

For proper file upload handling:

1. Ensure the `uploads` directory exists and is writable
2. Set up a routine to back up uploaded files
3. For Vercel deployment, configure S3 storage for persistent file storage

## Security Considerations

1. Always use HTTPS for production
2. Set secure CORS settings
3. Keep your JWT secret secure and rotate it periodically
4. Implement rate limiting (already included in the codebase)
5. Regularly update dependencies

## Monitoring and Logging

For production environments:

1. Set up application monitoring (e.g., New Relic, Datadog)
2. Configure centralized logging
3. Set up alerts for errors and performance issues

## Scaling Considerations

The UniHub backend is designed to scale horizontally. For high-traffic scenarios:

1. Use a load balancer
2. Scale the database with read replicas
3. Consider caching frequently accessed data with Redis
4. Set up a CDN for static file delivery

## Troubleshooting Common Issues

### Database Connection Issues

1. Verify database credentials
2. Check network connectivity
3. Ensure the database user has appropriate permissions

```bash
# Test database connection
mysql -h your-db-host -u your-db-user -p -e "SELECT 1"
```

### RAG Service Issues

1. Verify OpenAI API key is valid
2. Check Qdrant connection parameters
3. Try the test script:

```bash
node test-rag.js
```

### File Upload Issues

1. Check directory permissions
2. Verify file size limits
3. Test file upload endpoint with a small file

## Post-Deployment Checklist

✅ Verify API status endpoint returns 200
✅ Test authentication endpoints
✅ Confirm database migrations have run successfully
✅ Test RAG functionality with a small document
✅ Verify CORS configuration with frontend application
✅ Check that uploaded files are properly stored and accessible 