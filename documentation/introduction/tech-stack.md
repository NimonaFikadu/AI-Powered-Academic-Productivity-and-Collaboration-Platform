# UniHub Technology Stack

UniHub leverages modern, robust technologies across its stack to deliver a high-quality educational platform.

## Frontend Technologies

### Core Framework and Libraries

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework with SSR, routing, and optimizations |
| React | 18.x | UI library for building component-based interfaces |
| TypeScript | 5.x | Static typing for JavaScript, improving code quality |
| TailwindCSS | 3.x | Utility-first CSS framework for styling |

### State Management and Data Fetching

| Technology | Version | Purpose |
|------------|---------|---------|
| React Context API | - | Global state management |
| React Query | 5.x | Data fetching, caching, and state management |
| Axios | 1.x | HTTP client for API requests |

### UI Components and Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| Shadcn/ui | - | UI component collection based on Radix UI |
| Radix UI | 2.x | Unstyled, accessible UI components |
| Framer Motion | 10.x | Animation library |

### Data Visualization

| Technology | Version | Purpose |
|------------|---------|---------|
| Chart.js | 4.x | Charting library for statistics visualization |
| react-markdown | 9.x | Markdown rendering for notes and content |

### Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| Jest | 29.x | Testing framework |
| React Testing Library | 14.x | Testing utilities for React components |

## Backend Technologies

### Core Framework and Libraries

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18.x | JavaScript runtime |
| Express | 4.x | Web application framework |
| MySQL | 8.x | Relational database with JSON support |

### Database Access

| Technology | Version | Purpose |
|------------|---------|---------|
| mysql2 | 3.x | MySQL client for Node.js |
| Custom SQL | - | Direct SQL queries with prepared statements |

### Authentication and Security

| Technology | Version | Purpose |
|------------|---------|---------|
| JSON Web Tokens (JWT) | - | Token-based authentication with refresh tokens |
| bcrypt | 5.x | Password hashing for secure storage |
| Helmet | 7.x | HTTP security headers |
| Express-validator | 7.x | Input validation and sanitization |
| Rate limiting | - | Protection against excessive requests |

### File Handling

| Technology | Version | Purpose |
|------------|---------|---------|
| Multer | 1.4.x | File upload handling and storage |
| pdf-parse | 2.x | PDF text extraction for RAG pipeline |
| mammoth | 1.x | DOCX text extraction for RAG pipeline |

### RAG Architecture Components

| Technology | Version | Purpose |
|------------|---------|---------|
| OpenAI API | 4.x | Embeddings generation and content generation |
| @qdrant/js-client-rest | 1.x | Vector database client for similarity search |
| uuid | 9.x | Unique identifier generation |

### API Documentation

| Technology | Version | Purpose |
|------------|---------|---------|
| Swagger UI | 5.x | API documentation UI |
| Swagger JSDoc | 6.x | API documentation generation |

### Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| Jest | 29.x | Testing framework |
| Supertest | 6.x | HTTP assertions for API testing |

## RAG System Components

### Document Processing

| Component | Implementation | Purpose |
|-----------|---------------|---------|
| Text Extraction | pdf-parse, mammoth | Extract text from PDFs and DOCX files |
| Chunking | Custom paragraph-based algorithm | Split documents into manageable chunks with overlap (default: 1000 chars with 200 char overlap) |
| Embedding Generation | OpenAI embeddings API (text-embedding-ada-002) | Generate 1536-dimensional vector representations of text |
| Metadata Management | Custom implementation | Track document metadata through processing pipeline |

### Vector Storage

| Component | Implementation | Purpose |
|-----------|---------------|---------|
| Vector Database | Qdrant Cloud | Store and query vector embeddings |
| Collection Management | `user_{userId}_topic_{topicId}` | Organize embeddings by user and topic |
| Similarity Search | Cosine similarity (default threshold: 0.7) | Find semantically similar content |
| Metadata Storage | Document metadata alongside vectors | Maintain context for retrieval |

### Content Generation

| Component | Implementation | Purpose |
|-----------|---------------|---------|
| Note Generation | OpenAI Chat API (GPT-3.5 Turbo) | Generate educational notes from retrieved context |
| Quiz Generation | OpenAI Chat API | Create quizzes with custom difficulty levels |
| Contextual Chat | OpenAI Chat API | Chat with context from learning materials |
| Error Handling | Fallback mechanisms and timeout protection | Handle API failures gracefully |

## DevOps and Infrastructure

### Hosting and Deployment

| Technology | Purpose |
|------------|---------|
| Vercel | Frontend hosting and serverless backend functions |
| MySQL Cloud | Database hosting |
| Qdrant Cloud | Vector database hosting |

### Version Control and Collaboration

| Technology | Purpose |
|------------|---------|
| Git | Version control |
| GitHub | Code repository and collaboration |

### CI/CD

| Technology | Purpose |
|------------|---------|
| Vercel CI/CD | Automated build and deployment |
| Custom deployment scripts | Additional deployment capabilities |

## Development Tools

### Development Environment

| Technology | Purpose |
|------------|---------|
| VS Code | Primary IDE |
| ESLint | Code linting |
| Prettier | Code formatting |
| Cursor | AI-assisted coding |

### Package Management

| Technology | Purpose |
|------------|---------|
| npm | Node.js package manager |

## System Requirements

### Frontend Development

- Node.js 18.x or higher
- npm 8.x or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Backend Development

- Node.js 18.x or higher
- npm 8.x or higher
- MySQL 8.x
- OpenAI API key
- Qdrant instance (cloud or self-hosted)

### Deployment

- Vercel account
- MySQL database
- OpenAI API key
- Qdrant Cloud account 