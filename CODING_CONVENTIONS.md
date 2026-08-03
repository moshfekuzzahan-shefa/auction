# Coding Conventions & Project Guidelines

## General Philosophy
- **Feature-based architecture**: Group files by feature (e.g., `auth/`, `users/`, `auction/`) rather than by type (`controllers/`, `routes/`, etc.). This improves scalability and modularity.
- **Strict Typing**: Use TypeScript rigorously. Avoid `any` where possible. Use `Zod` for runtime validation at the boundary (API routes, WebSockets).
- **Single Responsibility**: Each function or module should have a single responsibility.
- **Fail Fast**: Validate inputs and state early in a function. Return errors immediately.

## Backend (Node.js/Express)
1. **Routing**: All API routes should go through a feature router and be mounted in `src/modules/index.ts`.
2. **Controllers**: Controllers should only handle HTTP concerns (extracting body/params, sending responses). Business logic MUST live in service layers (`src/modules/<feature>/<feature>.service.ts`).
3. **Database**: Use Prisma Client for database operations. Do not write raw SQL unless absolutely necessary for performance reasons.
4. **Validation**: Use Zod schemas to validate incoming request bodies, query params, and route params. This occurs in a validation middleware before the controller.
5. **Errors**: Always throw operational errors or pass them to `next(err)`. Do not handle random errors with `console.log`. Use Winston for logging (`logger.error`).
6. **Sockets**: WebSocket events should be namespaced. Emit events clearly and document payloads in types.

## Frontend (React/Vite)
1. **State Management**:
   - **Local UI State**: `useState` or `useReducer`.
   - **Server State (API)**: Use `React Query` (TanStack Query) for fetching, caching, and mutations.
   - **Global Client State**: Use `Redux Toolkit` only for complex global state (like active auction configurations or user session).
2. **Routing**: Use `React Router` for page navigation. Protect private routes with a wrapper component.
3. **Styling**: Use `TailwindCSS` (v4). Group related components and extract generic UI elements to `src/components/ui/`.
4. **File Structure**:
   - `pages/`: Page-level components.
   - `features/`: Feature-specific components and logic.
   - `components/`: Generic UI components (Buttons, Inputs).
   - `services/`: API calls with Axios.
5. **Axios**: Use an interceptor to attach JWT tokens and handle 401 Unauthorized errors globally.

## Version Control & Naming
- **Files/Folders**: Use `kebab-case` for folder and file names (e.g., `error.middleware.ts`, `user-profile.tsx`).
- **Variables/Functions**: Use `camelCase`.
- **Classes/Interfaces**: Use `PascalCase`.
- **Commits**: Use conventional commits (e.g., `feat: setup auth middleware`, `fix: handle socket disconnect`).
