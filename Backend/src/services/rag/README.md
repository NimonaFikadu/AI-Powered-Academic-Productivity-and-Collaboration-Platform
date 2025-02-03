# RAG Service for UniHub

The Retrieval-Augmented Generation (RAG) service provides AI-powered functionality to the UniHub platform, enabling contextual note generation and chat capabilities based on user-uploaded learning materials.

## Features

### 1. Note Generation
Automatically generates educational notes based on user-uploaded study materials for a topic.

### 2. Material Indexing
- **Automatic Indexing**: Whenever a material is uploaded to a topic, it is automatically indexed for RAG retrieval
- **Manual Indexing**: Users can force re-indexing through the `/rag/index/:topicId` endpoint
- **Index Management**: Users can delete indexed materials for a topic using `/rag/index/:topicId` (DELETE)

### 3. Material Search
Semantic search through materials for a specific topic based on user queries.

### 4. Chat Conversations
Chat with an AI tutor with context from your learning materials:
- **Fast Response Time**: Optimized for quick responses
- **Conversation History**: Maintains context from previous messages
- **Academic Formatting**: Responses use Markdown formatting for code, formulas, and structured content
- **Academic Tone**: Detailed, precise explanations in an academic style

## API Endpoints

### Note Generation
```
POST /rag/notes
```

### Material Indexing
```
POST /rag/index/:topicId
DELETE /rag/index/:topicId
```

### Material Search
```
GET /rag/search?query=<search_term>&topicId=<topic_id>
```

### Chat Conversation
```
POST /rag/chat
```
Body:
```json
{
  "message": "Your message here",
  "context": {
    "topicId": "your-topic-id",
    "previousMessages": [
      {
        "role": "user",
        "content": "Previous user message"
      },
      {
        "role": "assistant",
        "content": "Previous assistant response"
      }
    ]
  }
}
```

Response:
```json
{
  "message": "Assistant response in markdown format",
  "topicId": "your-topic-id",
  "topicTitle": "Your Topic Title",
  "timestamp": "2023-01-01T12:00:00Z"
}
```

## Architecture

The RAG service uses the following components:

1. **Document Processor** - Extracts text from uploaded files and chunks it into manageable pieces
2. **Vector Database** - Stores embeddings of document chunks for semantic retrieval
3. **LLM Integration** - Generates responses based on retrieved context

## Performance Optimizations

1. **Automatic Indexing**: Materials are indexed immediately on upload
2. **Fast Vector Search**: Optimized vector search for quick response times
3. **Caching**: Collection creation is optimized to reuse existing collections
4. **Timeout Protection**: All operations have timeout protection to prevent hanging requests
5. **Batched Processing**: Large operations are processed in batches to maintain performance

## Overview

RAG (Retrieval-Augmented Generation) combines traditional information retrieval with generative AI to produce more accurate, relevant, and fact-based outputs. The UniHub RAG service enables:

1. **Smart Note Generation**: Automatically generate comprehensive educational notes based on learning materials.
2. **Semantic Search**: Search through learning materials using natural language queries.
3. **Vector Storage**: Index and retrieve educational content using vector embeddings.

## Architecture

The RAG service consists of the following components:

```
rag/
├── models/
│   └── noteGenerator.js    # Note generation using RAG
├── utils/
│   ├── documentProcessor.js # Document processing and embedding generation
│   └── vectorStore.js      # Vector storage using Qdrant
└── index.js                # Main entry point for the RAG service
```

## Key Components

### Vector Store (Qdrant)

The service uses [Qdrant](https://qdrant.tech/), a vector similarity search engine, for storing and retrieving embeddings. The implementation:

- Creates collections for each user's topic materials
- Stores document chunks with metadata
- Performs similarity search with filtering

### Document Processing

The document processor handles:

- Extracting text from various file formats (PDF, DOCX, etc.)
- Chunking text into manageable segments
- Generating embeddings using OpenAI's embedding API

### Note Generation

The note generator:

- Indexes learning materials for specific users and topics
- Retrieves relevant content based on the user's query
- Uses OpenAI to generate comprehensive notes with proper structure

## Usage

The RAG service is exposed through the `/api/rag` endpoint with the following routes:

- `POST /api/rag/notes`: Generate a note using RAG
- `GET /api/rag/search`: Search materials for a topic
- `POST /api/rag/index/:topicId`: Index materials for a topic
- `DELETE /api/rag/index/:topicId`: Delete indexed materials for a topic
- `GET /api/rag/indexed-topics`: List all indexed topics for a user
- `GET /api/rag/extract/:materialId`: Extract text from a material

## Testing

Run the test script to verify the RAG service is working correctly:

```bash
node test-rag.js
``` 