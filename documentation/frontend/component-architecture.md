# Frontend Component Architecture

This document describes the component architecture of the UniHub frontend application.

## Overview

The UniHub frontend follows a component-based architecture using Next.js and React. The application is structured with a focus on reusability, maintainability, and performance.

## Directory Structure

```
Frontend/
├── app/                     # Next.js app directory - pages and routing
│   ├── (with-layout)/       # Routes that use the main layout
│   ├── sign-in/             # Authentication - sign in
│   ├── sign-up/             # Authentication - sign up
│   ├── topics/              # Topic management
│   ├── notes-materials/     # Notes and study materials
│   ├── tests-quizfetch/     # Quizzes and tests
│   ├── note-summary/            # Tutoring services
│   ├── calendar/            # Calendar and scheduling
│   ├── assistance/          # AI assistant
│   ├── insights/            # Analytics and insights
│   ├── page.tsx             # Root page
│   ├── layout.tsx           # Root layout
│   └── providers.tsx        # App-wide providers
├── components/              # Reusable UI components
│   ├── ui/                  # Basic UI components
│   ├── header/              # Header components
│   ├── modals/              # Modal dialogs
│   ├── chatComponents/      # Chat-related components
│   ├── providers/           # Context providers
│   ├── Header.tsx           # Main header component
│   ├── MainSidebar.tsx      # Main sidebar navigation
│   ├── ChatBox.tsx          # Chat interface component
│   └── ThemeSwitch.tsx      # Theme toggle component
├── hooks/                   # Custom React hooks
├── stores/                  # State management
├── public/                  # Static assets
└── config/                  # Configuration files
```

## Component Hierarchy

```
┌─ RootLayout (app/layout.tsx)
│  ├─ Providers (app/providers.tsx)
│  │  ├─ ThemeProvider
│  │  ├─ AuthProvider
│  │  └─ OtherProviders...
│  │
│  └─ Content Pages
│     ├─ MainLayout ((with-layout)/layout.tsx)
│     │  ├─ Header
│     │  ├─ MainSidebar
│     │  └─ Page Content (varies)
│     │
│     └─ Auth Pages (sign-in, sign-up)
│        └─ AuthForm
```

## Key Components

### Layout Components

#### `RootLayout` (app/layout.tsx)
- The top-level layout component
- Wraps the entire application
- Includes global providers and styles

#### `MainLayout` ((with-layout)/layout.tsx)
- Layout for authenticated pages
- Includes header, sidebar, and main content area

### UI Components

#### `Header` (components/Header.tsx)
- Main application header
- Contains navigation, user profile, and actions
- Adapts to different screen sizes

#### `MainSidebar` (components/MainSidebar.tsx)
- Main navigation sidebar
- Provides access to different sections of the app
- Collapsible on mobile devices

#### `ChatBox` (components/ChatBox.tsx)
- Reusable chat interface component
- Used for AI assistant and tutoring features

### Page Components

Each feature has its own page component that composes smaller components:

#### `TopicsPage` (app/topics/page.tsx)
- Displays and manages academic topics
- Composed of topic list, topic details, and topic actions

#### `NotesPage` (app/notes-materials/page.tsx)
- Manages notes and study materials
- Includes note editor, note list, and file upload components

#### `QuizPage` (app/tests-quizfetch/page.tsx)
- Displays quizzes and allows taking/creating quizzes
- Includes quiz list, quiz creator, and quiz player components



#### `TutorPage` (app/note-summary/page.tsx)
- Facilitates tutoring sessions
- Includes tutor list, session scheduler, and chat components

#### `CalendarPage` (app/calendar/page.tsx)
- Displays and manages calendar events
- Includes calendar view, event creator, and reminder components

#### `AssistancePage` (app/assistance/page.tsx)
- AI assistant interface
- Includes chat interface and response components

## Component Types

### 1. UI Components

Stateless, reusable components focused on presentation:

- Buttons, inputs, cards, modals
- Typography elements
- Icons and visual elements

Located in: `components/ui/`

### 2. Layout Components

Components that define the structure of the application:

- Page layouts
- Sidebar, header, footer
- Navigation elements

Located in: `app/` (layouts) and `components/` (root)

### 3. Feature Components

Components specific to particular features:

- Topic browser
- Note editor
- Quiz creator/player
- Calendar view
- Tutoring interface

Located in their respective feature directories

### 4. Provider Components

Components that provide context to the application:

- Theme provider
- Authentication provider
- State providers

Located in: `components/providers/` and `app/providers.tsx`

## Component Communication

### 1. Props

- Primary method for parent-to-child communication
- Used for passing data and callbacks
- TypeScript interfaces define prop shapes

### 2. Context API

- Used for global or feature-wide state
- Authentication context for user data
- Theme context for appearance settings

### 3. Custom Hooks

- Extract stateful logic from components
- Share behavior between components
- Handle API calls and data fetching

## Component Design Principles

### 1. Composition Over Inheritance

Components are composed from smaller, more focused components rather than using inheritance hierarchies.

### 2. Single Responsibility

Each component focuses on doing one thing well, rather than handling multiple concerns.

### 3. Reusability

Common UI elements are abstracted into reusable components to maintain consistency and reduce duplication.

### 4. Responsive Design

Components adapt to different screen sizes and device types using Tailwind CSS's responsive utilities.

### 5. Accessibility

Components follow accessibility best practices, including proper ARIA attributes, keyboard navigation, and focus management.

## State Management

State is managed at different levels:

- **Local Component State**: For component-specific state
- **Context API**: For shared state across a feature
- **Custom Hooks**: For reusable stateful logic

## Styling Approach

UniHub uses Tailwind CSS for styling with these conventions:

- Utility classes for most styling needs
- Component-specific styles when needed
- Theme variables for consistent colors and spacing
- Dark mode support via Tailwind's dark mode utilities

## Performance Considerations

- Components use `React.memo()` for expensive renders
- Dynamic imports for code splitting
- Image optimization with Next.js Image component
- Server components for data fetching
- Client components for interactive elements 