# NoteSync

## Overview

NoteSync is a full-stack note synchronization application that provides a centralized interface for managing notes across multiple cloud providers (iCloud, Google, Exchange). The application features a three-pane layout similar to Apple Notes, with a sidebar for navigation, middle pane for note lists, and a main editor for note content. It's built with React/TypeScript on the frontend, Express.js on the backend, and uses PostgreSQL with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite for build tooling
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Theme**: Dark mode by default with Apple Notes-inspired color scheme

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured error handling and logging middleware
- **Development**: Hot reload with Vite integration in development mode
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development

### Data Storage
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Hierarchical structure supporting providers, folders, notes, and share links
- **Migrations**: Drizzle Kit for schema management and migrations
- **Local Storage**: Client-side persistence utilities for offline functionality

### Authentication and Authorization
- **Mock Authentication**: Simulated OAuth flows for iCloud, Google, and Exchange
- **Session Management**: Local storage-based authentication state
- **Guest Mode**: Available for demo purposes without provider integration

### Key Design Patterns
- **Separation of Concerns**: Clear separation between client, server, and shared code
- **Type Safety**: Shared TypeScript schemas between frontend and backend
- **Component Composition**: Reusable UI components with consistent design system
- **Error Boundaries**: Comprehensive error handling with user-friendly messages
- **Responsive Design**: Mobile-first approach with adaptive layouts

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **express**: Web application framework for Node.js
- **vite**: Frontend build tool and development server

### UI Component Libraries
- **@radix-ui/***: Headless UI primitives for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library
- **react-icons**: Additional icon sets (Google icons)

### Development and Build Tools
- **typescript**: Static type checking
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **drizzle-kit**: Database schema management
- **wouter**: Lightweight React router

### Form and Validation
- **@hookform/resolvers**: Form validation integration
- **zod**: Runtime type validation and schema definition
- **drizzle-zod**: Integration between Drizzle ORM and Zod schemas

### Additional Features
- **date-fns**: Date manipulation and formatting
- **cmdk**: Command palette component
- **embla-carousel-react**: Carousel/slider functionality
- **nanoid**: Unique ID generation