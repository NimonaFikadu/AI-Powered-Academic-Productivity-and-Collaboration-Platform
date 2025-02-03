# Environment Variables

This document provides a comprehensive reference for all environment variables used in the UniHub platform.

## Configuration File

Environment variables are loaded using the `dotenv` package. Create a `.env` file in the root directory of each project with the appropriate variables.

Example:
```
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=strongpassword
DB_NAME=unihub_db
```

## Backend Environment Variables

### Core Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `development` | No |
| `PORT` | Server port | `3000` | No |
| `API_PREFIX` | API route prefix | `/api` | No |
| `CORS_ORIGIN` | Allowed CORS origin | `*` | No |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:5173` | Yes |

### Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | Database host | `localhost` | Yes |
| `DB_PORT` | Database port | `3306` | No |
| `DB_USER` | Database username | - | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `DB_NAME` | Database name | `unihub_db` | Yes |
| `DB_POOL_MIN` | Minimum connection pool size | `2` | No |
| `DB_POOL_MAX` | Maximum connection pool size | `10` | No |

### Authentication

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT signing | - | Yes |
| `JWT_EXPIRY` | JWT token expiry time | `24h` | No |
| `REFRESH_TOKEN_EXPIRY` | Refresh token expiry time | `7d` | No |
| `PASSWORD_SALT_ROUNDS` | Salt rounds for password hashing | `10` | No |

### File Upload

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `UPLOAD_DIR` | Directory for file uploads | `uploads` | No |
| `MAX_FILE_SIZE` | Maximum file size in bytes | `10485760` (10MB) | No |
| `ALLOWED_FILE_TYPES` | Comma-separated list of allowed file types | `pdf,docx,doc,pptx,ppt,txt,jpg,jpeg,png` | No |

### AI Services

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | - | Yes* |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-3.5-turbo` | No |
| `OPENAI_EMBEDDING_MODEL` | OpenAI embedding model | `text-embedding-ada-002` | No |
| `AI_REQUEST_TIMEOUT` | Timeout for AI requests in ms | `30000` | No |

*Required for AI features

### Vector Database (Qdrant)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `QDRANT_URL` | Qdrant server URL | - | Yes* |
| `QDRANT_API_KEY` | Qdrant API key | - | Yes* |
| `QDRANT_COLLECTION_SHARD_NUMBER` | Number of shards per collection | `1` | No |
| `QDRANT_TIMEOUT` | Timeout for Qdrant operations in ms | `10000` | No |

*Required for RAG features

### Logging

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Log level (error, warn, info, debug) | `info` | No |
| `LOG_FORMAT` | Log format (json, text) | `text` | No |
| `LOG_FILE` | Log file path | - | No |

### Rate Limiting

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `60000` | No |
| `RATE_LIMIT_MAX_REQUESTS` | Maximum requests per window | `100` | No |

## Frontend Environment Variables

The frontend project uses Vite for building, which loads variables from a `.env` file with the prefix `VITE_`.

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000/api` | Yes |
| `VITE_APP_TITLE` | Application title | `UniHub` | No |
| `VITE_AUTH_STORAGE_KEY` | Local storage key for auth data | `unihub_auth` | No |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | `false` | No |

## Using Environment Variables

### In Node.js Backend

Environment variables are loaded automatically in the application's entry point using:

```javascript
require('dotenv').config();
```

Then, they can be accessed via `process.env`:

```javascript
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};
```

### In React Frontend

Environment variables are loaded by Vite and can be accessed via `import.meta.env`:

```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Security Considerations

1. **Never commit `.env` files** to version control. Always add them to `.gitignore`.
2. **Use different values** for development, testing, and production environments.
3. **Limit sensitive variables** to only the necessary services.
4. **Rotate API keys** periodically, especially in production.
5. **Use secrets management** in production environments (e.g., AWS Secrets Manager, Vault).

## Environment Templates

### Backend `.env.example`

```
# Core
NODE_ENV=development
PORT=3000
API_PREFIX=/api
FRONTEND_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=unihub_db

# Authentication
JWT_SECRET=your_jwt_secret_change_this_in_production
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# AI Services
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo

# Qdrant
QDRANT_URL=https://your-qdrant-instance.cloud
QDRANT_API_KEY=your_qdrant_api_key

# Logging
LOG_LEVEL=info
```

### Frontend `.env.example`

```
VITE_API_URL=http://localhost:3000/api
VITE_APP_TITLE=UniHub
VITE_AUTH_STORAGE_KEY=unihub_auth
VITE_ENABLE_ANALYTICS=false
```

## Deployment Configurations

Different deployment environments require different environment configurations.

### Development

For development, create a `.env.development` file with:
- Local database credentials
- Debug logging enabled
- Faster token expiry for testing

### Testing

For automated testing, create a `.env.test` file with:
- Test database credentials (separate from development)
- Minimal logging
- In-memory storage where possible

### Production

For production, create a `.env.production` file with:
- Production database credentials
- Error-only logging
- Longer token expiry
- Strict security settings

## Troubleshooting

Common issues related to environment variables:

1. **Variable not found**: Check if the variable is correctly named in the `.env` file and if the file is in the root directory.
2. **Changes not applied**: Restart the server after changing environment variables.
3. **Type issues**: All environment variables are strings. Convert to numbers or booleans as needed:
   ```javascript
   const port = parseInt(process.env.PORT, 10) || 3000;
   const isProduction = process.env.NODE_ENV === 'production';
   ```
4. **Case sensitivity**: Environment variable names are case-sensitive. 