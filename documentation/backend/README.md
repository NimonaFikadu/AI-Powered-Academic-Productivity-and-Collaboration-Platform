# UniHub Backend API

A robust Node.js backend API for the UniHub educational platform, built with clean architecture principles. The platform provides tools for students to organize their learning materials, create topics, generate AI-powered notes and quizzes, and track their study progress.

## Core Features

- **Clean Architecture**: Separation of concerns with clear layers
- **JWT Authentication**: Secure user authentication
- **MySQL Database**: Robust relational data storage
- **Swagger API Documentation**: Interactive API documentation
- **RAG-Powered Learning Tools**: Retrieval-Augmented Generation for notes and quizzes
- **Comprehensive Study Materials Management**: Notes, quizzes, and learning materials
- **Progress Tracking**: Statistics and progress monitoring
- **Automatic Database Migrations**: SQL-based schema management

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn
- OpenAI API key (for AI features)
- Qdrant vector database (free cloud tier available)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update all values:
   ```bash
   cp .env.example .env
   ```
4. Create the database:
   ```bash
   mysql -u root -p
   CREATE DATABASE unihub_db;
   ```
5. Run migrations:
   ```bash
   npm run migrate
   ```

## Running the Application

Development mode with auto-restart:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Documentation

Once the server is running, visit:
```
http://localhost:3000/api-docs
```

## Core Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Topics
- `GET /api/topics` - Get all topics
- `POST /api/topics` - Create a new topic
- `GET /api/topics/:id` - Get topic details

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create a note (AI-generated if topicId is provided)
- `GET /api/notes/:id` - Get note details

### Quizzes
- `GET /api/quizzes` - Get all quizzes
- `POST /api/quizzes` - Create a regular quiz
- `POST /api/quizzes/rag` - Generate AI quiz for a topic
- `GET /api/quizzes/:id` - Get quiz details
- `POST /api/quizzes/:id/attempt` - Submit a quiz attempt

### Materials
- `GET /api/materials` - Get all learning materials
- `POST /api/materials` - Upload a new material
- `GET /api/materials/:id` - Get material details

### Statistics
- `GET /api/statistics` - Get user learning statistics
- `POST /api/statistics/study-sessions` - Log a study session

### RAG (Retrieval-Augmented Generation)
- `POST /api/rag/index/:topicId` - Index materials for a topic
- `GET /api/rag/search` - Search through indexed materials
- `POST /api/rag/chat` - Chat with your learning materials
- `POST /api/rag/notes` - Generate notes from materials

## Project Structure

```
src/
├── config/         # Configuration files and database setup
├── controllers/    # Request handlers for each route
├── middleware/     # Authentication and validation middleware
├── migrations/     # Database schema migration files
├── models/         # Database models
├── routes/         # API route definitions
├── services/       # Business logic, including RAG service
│   └── rag/        # Retrieval-Augmented Generation components
│       ├── models/ # AI model interfaces (notes, quizzes)
│       └── utils/  # Vector storage and document processing
└── app.js          # Application entry point
```

## Database Migrations

The application uses SQL migration files to manage database schema:

```bash
# Run migrations
npm run migrate
```

Key database tables include:
- `users` - User accounts and authentication
- `topics` - Learning topics and categories
- `notes` - User notes and AI-generated notes
- `quizzes` - Quizzes with questions 
- `quiz_attempts` - User quiz attempt history with answers
- `materials` - Uploaded learning materials
- `statistics` - User learning progress data

## RAG Service

The Retrieval-Augmented Generation (RAG) service powers the intelligent learning features:

- **Document Processing**: Extract text from various file formats
- **Vector Embeddings**: Store and retrieve content semantically
- **AI-Generated Notes**: Create comprehensive notes from materials
- **AI-Generated Quizzes**: Create assessments based on learning materials
- **Contextual Chat**: Interact with learning materials conversationally

See [rag-architecture.md](./rag-architecture.md) for detailed information on the RAG implementation.

## Testing

Run the RAG service test:
```bash
node test-rag.js
```

## Deployment

See [deployment-guide.md](./deployment-guide.md) for detailed deployment instructions.

## Environment Variables

Key environment variables:

```
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=unihub_db

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h

# OpenAI (for AI features)
OPENAI_API_KEY=your_openai_api_key

# Qdrant (vector database)
QDRANT_URL=https://your-qdrant-instance.cloud
QDRANT_API_KEY=your_qdrant_api_key
```

See [environment-variables.md](../environment-variables.md) for a complete list.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 