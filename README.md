# NoteSync

A full-stack note synchronization application with a three-pane layout similar to Apple Notes, featuring hierarchical organization, real-time collaboration, and shareable links.

## Features

- **Hierarchical Note Organization**: Organize notes in folders with unlimited nesting levels
- **Rich Text Editor**: Full-featured editor with formatting options and content management
- **Real-time Synchronization**: Notes sync across sessions with optimistic updates
- **Shareable Links**: Create public links to notes with customizable permissions and expiration
- **Search Functionality**: Full-text search across all notes and folders
- **Dark Theme**: Apple Notes-inspired dark interface with modern design
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **User Authentication**: Secure authentication via Replit OAuth

## Tech Stack

### Frontend
- **React 18** with TypeScript and Vite
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing

### Backend
- **Node.js** with Express.js framework
- **PostgreSQL** database with Neon serverless driver
- **Drizzle ORM** for type-safe database operations
- **Authentication**: OpenID Connect with Replit OAuth
- **Session Storage**: PostgreSQL-backed sessions

### Development
- **Full-stack TypeScript** with shared schemas
- **Hot Module Replacement** in development
- **Type-safe APIs** with Zod validation
- **Database Migrations** with Drizzle Kit

## Development Commands

### Core Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run start` - Run production server
- `npm run check` - Run TypeScript type checking

### Database Operations
- `npm run db:push` - Push schema changes to database
- Database schema is defined in `shared/schema.ts`

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and configurations
│   │   └── pages/          # Page components
├── server/                 # Express.js backend
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database abstraction layer
│   └── replitAuth.ts       # Authentication setup
├── shared/                 # Shared TypeScript schemas
│   └── schema.ts           # Database schema and types
└── migrations/             # Database migration files
```

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user profile

### Folders
- `GET /api/folders` - List folders (supports `?parentId=` query)
- `POST /api/folders` - Create new folder
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder

### Notes
- `GET /api/notes` - List notes (supports `?folderId=`, `?search=`, `?parentId=` queries)
- `GET /api/notes/:id` - Get specific note
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `PUT /api/notes/:id/hierarchy` - Update note parent/child relationships

### Share Links
- `GET /api/share/:url` - Access shared note via public URL
- `POST /api/notes/:id/share` - Create share link for note
- `GET /api/notes/:id/shares` - List share links for note
- `DELETE /api/shares/:id` - Delete share link

## Database Schema

The application uses a hierarchical data structure:

- **Users**: User profiles with authentication data
- **Folders**: Hierarchical folder structure with parent/child relationships
- **Notes**: Rich text notes with folder association and metadata
- **Share Links**: Public URLs for notes with permissions and expiration

All tables include automatic timestamps and use UUIDs for primary keys.

## Architecture Highlights

- **Full-stack Type Safety**: Shared schemas ensure consistency between frontend and backend
- **Storage Abstraction**: Database operations abstracted through a clean interface
- **Component Architecture**: Reusable UI components with Radix primitives
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- **Performance**: Optimistic updates and efficient data fetching with React Query

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run type checking: `npm run check`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

MIT License - see LICENSE file for details