# UniHub Technical Documentation

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black)](https://nextjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-orange)](https://www.mysql.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-lightgreen)](https://openai.com/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-purple)](https://qdrant.tech/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC)](https://tailwindcss.com/)

Welcome to the technical documentation for UniHub - an Educational Platform designed to enhance the learning experience through various integrated tools and services. This documentation provides comprehensive information about the architecture, components, and implementation details of the UniHub platform.

## Table of Contents

### 1. Introduction
- [Project Overview](./introduction/project-overview.md)
- [Architecture](./introduction/architecture.md)
- [Technology Stack](./introduction/tech-stack.md)
- [Environment Variables](./introduction/environment-variables.md)

### 2. Backend Documentation
- [Backend README](./backend/README.md)
- [API Overview](./backend/api-overview.md)
- [Authentication and Authorization](./backend/auth.md)
- [Database Schema](./backend/database-schema.md)
- [RAG Architecture](./backend/rag-architecture.md)
- [Statistics API](./backend/statistics-api.md)
- [Deployment Guide](./backend/deployment-guide.md)


### 3. Frontend Documentation
- [Component Architecture](./frontend/component-architecture.md)


### Key Features

#### Retrieval-Augmented Generation (RAG)
UniHub implements a sophisticated RAG architecture that enhances large language models by providing them with context from a user's learning materials:

- **Document Processing**: Extract text from PDFs and DOCXs, create chunks, and generate embeddings
- **Semantic Search**: Find relevant information from your materials using natural language queries
- **AI-Generated Notes**: Create comprehensive educational notes based on your learning goals
- **AI-Generated Quizzes**: Generate custom assessments with different difficulty levels
- **Contextual Chat**: Interact with your learning materials through a chat interface

#### Study Management
- **Topic Organization**: Structured approach to manage study materials
- **Progress Tracking**: Monitor study time and performance
- **Statistics**: Visual insights into learning patterns

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm 8.x or higher
- MySQL 8.x
- OpenAI API key
- Qdrant vector database instance

### Quick Start
1. Clone the repository
2. Set up environment variables using the [Environment Variables](./introduction/environment-variables.md) guide
3. Install dependencies for both frontend and backend
4. Run the backend and frontend development servers
5. Access the application at `http://localhost:3000`

For detailed setup instructions, refer to the [Backend Deployment Guide](./backend/deployment-guide.md).

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details. 