# UniHub Architecture

## Overview

UniHub follows a modern web application architecture, designed for scalability, maintainability, and extensibility. The system is built using a client-server model with a clean separation of concerns between the frontend and backend, with special emphasis on the Retrieval-Augmented Generation (RAG) architecture for AI-powered features.

## High-Level Architecture

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│              │     │               │     │              │
│    Client    │◄───►│  API Server   │◄───►│   Database   │
│  (Next.js)   │     │  (Node.js)    │     │   (MySQL)    │
│              │     │               │     │              │
└──────────────┘     └───────┬───────┘     └──────────────┘
                             │
                     ┌───────┼───────┐
                     │               │
          ┌──────────▼──────┐ ┌──────▼──────────┐
          │                 │ │                 │
          │ Vector Database │ │ OpenAI Services │
          │    (Qdrant)     │ │                 │
          │                 │ │                 │
          └─────────────────┘ └─────────────────┘
```

## Architecture Components

### 1. Frontend (Client)

The frontend of UniHub is built using Next.js, a React framework that provides server-side rendering, routing, and other performance optimizations.

Key aspects of the frontend architecture:

- **Component-Based Structure**: Organized around reusable UI components
- **Page-Based Routing**: Using Next.js file-based routing system
- **State Management**: Utilizing React context and hooks for state management
- **API Integration**: Communicating with the backend via RESTful API calls
- **Responsive Design**: Supporting various device sizes through responsive layouts
- **Data Visualization**: Charts and graphs for statistics and progress tracking

### 2. Backend (API Server)

The backend is built using Node.js with Express.js, providing a RESTful API for the frontend to consume.

Key aspects of the backend architecture:

- **Feature-Based Structure**: Organized around feature-specific controllers, routes, and services
- **RESTful API Design**: Following REST principles for API endpoints
- **Authentication System**: JWT-based authentication with refresh token rotation
- **SQL Database Operations**: Direct SQL queries with prepared statements for data access
- **Input Validation**: Validating all input data for security and consistency
- **Error Handling**: Comprehensive error handling and logging
- **RAG Service**: Sophisticated Retrieval-Augmented Generation system for AI features

### 3. Database

UniHub uses MySQL as its primary database, with a relational schema designed to support all features.

Key aspects of the database architecture:

- **Relational Schema**: Normalized database design with appropriate relationships
- **JSON Fields**: Using MySQL's JSON type for flexible data structures (like quiz questions)
- **SQL Migrations**: SQL script-based migrations for database schema management
- **Foreign Key Constraints**: Maintaining data integrity across related tables
- **Indexing**: Optimized for common query patterns and performance

### 4. Vector Database (Qdrant)

Qdrant is used as the vector database for similarity search in the RAG architecture.

Key aspects of the vector database:

- **Collection Organization**: Collections organized by user and topic using the naming pattern `user_{userId}_topic_{topicId}`
- **Vector Embeddings**: 1536-dimensional vectors from OpenAI's embedding model (text-embedding-ada-002)
- **Similarity Search**: Cosine similarity for finding semantically related content (default threshold: 0.7)
- **Metadata Storage**: Document metadata stored alongside vectors for retrieval

### 5. AI Services (OpenAI)

OpenAI services are used for embedding generation and content creation.

Key aspects of the AI integration:

- **Embedding Generation**: Converting text to vector embeddings using OpenAI's embedding API
- **Content Generation**: Creating educational content with context from retrieved documents
- **Prompt Engineering**: Carefully designed prompts for educational content generation
- **Error Handling**: Fallback mechanisms and timeouts for API failures
- **Rate Limiting**: Exponential backoff for handling API throttling

## RAG Architecture in Detail

UniHub implements a sophisticated RAG (Retrieval-Augmented Generation) architecture that enhances large language models with context from user-uploaded materials.

### Document Processing Pipeline

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │               │     │              │     │              │
│  File Upload │────►│Text Extraction│────►│   Chunking   │────►│  Embedding   │
│              │     │               │     │              │     │  Generation  │
│              │     │               │     │              │     │              │
└──────────────┘     └───────────────┘     └──────────────┘     └──────┬───────┘
                                                                        │
                                                                        ▼
                                                               ┌──────────────┐
                                                               │              │
                                                               │ Vector Store │
                                                               │              │
                                                               └──────────────┘
```

1. **File Upload**: User uploads learning materials (PDF, DOCX, etc.)
2. **Text Extraction**: System extracts text from various file formats using pdf-parse for PDFs and mammoth for DOCX
3. **Chunking**: Long texts are split into manageable chunks with overlap (default: 1000 chars with 200 char overlap)
4. **Embedding Generation**: Each chunk is converted to a 1536-dimensional vector embedding using OpenAI's API
5. **Vector Storage**: Embeddings are stored in Qdrant with metadata about source material, chunk position, and content

### Content Generation Process

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐     ┌──────────────┐
│ User Request │     │ Query Embedding│     │  Similarity  │     │    Content   │
│  for Content │────►│   Generation   │────►│    Search    │────►│  Generation  │
│              │     │               │     │              │     │              │
└──────────────┘     └───────────────┘     └──────────────┘     └──────────────┘
```

1. **User Request**: User requests AI-generated content (notes, quiz, chat)
2. **Query Embedding**: User's query/goal is converted to a vector embedding
3. **Similarity Search**: System finds relevant chunks from vector store using cosine similarity
4. **Content Generation**: Retrieved context is sent to OpenAI's GPT-3.5 Turbo to generate content

## Data Flow

### Authentication Flow

1. User submits credentials (email/password)
2. Backend validates credentials against stored hash
3. If valid, backend generates access token and refresh token
4. Tokens are returned to frontend
5. Frontend stores tokens in local storage
6. Access token is included in Authorization header for requests
7. When access token expires, refresh token is used to get a new pair

### Material Processing and Indexing Flow

1. User uploads material to a topic
2. System extracts text from material based on file type
3. Text is split into chunks with overlap
4. Each chunk is converted to vector embedding
5. Embeddings are stored in Qdrant collection named `user_{userId}_topic_{topicId}`
6. Material is now available for RAG operations

### RAG Note Generation Flow

1. User requests an AI-generated note with specific learning goal
2. System generates embedding for user's goal
3. System searches for relevant chunks in vector database
4. Retrieved chunks are combined with structured prompt
5. OpenAI generates comprehensive note based on context
6. Note is stored in database and returned to user

### RAG Quiz Generation Flow

1. User requests quiz generation for a topic with difficulty level
2. System retrieves relevant context from vector store
3. Context and quiz specifications (difficulty, number of questions) are sent to OpenAI
4. AI generates structured quiz with questions, options, and correct answers
5. Quiz is stored in database with questions as JSON
6. User can take the quiz, with attempt scoring and statistics tracking

## System Boundaries

The UniHub system has several external integration points:

- **Browser Environment**: Where the client application runs
- **MySQL Database**: Where structured data is stored
- **Qdrant Vector Database**: Where vector embeddings are stored
- **OpenAI API**: Where embeddings and content are generated
- **File Storage**: Where user-uploaded files are stored

## Security Architecture

Security is implemented at multiple levels:

- **Authentication**: JWT-based user authentication with refresh tokens
- **Authorization**: User-based access control for resources
- **Data Validation**: Input validation on both client and server sides
- **HTTPS**: All communications encrypted in production
- **Password Hashing**: Bcrypt for secure password storage
- **CORS**: Configured Cross-Origin Resource Sharing
- **Rate Limiting**: Protection against excessive requests (100 requests per minute per IP)

## Deployment Architecture

UniHub uses a modern cloud deployment approach:

- **Frontend**: Deployed on Vercel for optimal Next.js hosting
- **Backend**: Deployed on Vercel serverless functions
- **Database**: Cloud-hosted MySQL instance
- **Vector Database**: Qdrant Cloud instance
- **CI/CD**: Automated deployment pipelines with custom scripts

## Scalability Considerations

The architecture is designed to scale in several ways:

- **Horizontal Scaling**: API server can be scaled horizontally
- **Batch Processing**: Document processing handled in batches to prevent system overload
- **Timeouts and Retries**: Graceful handling of service unavailability with exponential backoff
- **Mock Fallbacks**: System can operate with reduced functionality if external services fail
- **Collection Partitioning**: Vector collections separated by user/topic for better scaling
- **Chunk Limitation**: Limits on processed chunks per file to prevent excessive API usage 