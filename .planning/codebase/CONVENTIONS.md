# Conventions

## Python (Backend)
- **Style**: PEP 8 compliance.
- **Async**: Extensive use of `async/await` for API endpoints and I/O.
- **Type Hinting**: Required for all function signatures.
- **Error Handling**: Use of custom exception classes and centralized logging.
- **API Versioning**: Enforced via `/api/v1/` prefix.

## TypeScript/React (Frontend)
- **Framework**: App Router (Next.js 14+).
- **Styling**: Utility-first CSS via Tailwind.
- **Components**: Functional components with hooks.
- **Auth**: Middleware-based route protection at the Edge.

## General
- **Naming**: `snake_case` for Python, `camelCase` for JS/TS variables, `PascalCase` for React components.
- **Documentation**: Markdown-first for technical specs at the root.
- **Security**: Zero secrets in code; all keys managed via environment variables.
- **Webhooks**: Always verify HMAC signatures before processing.
