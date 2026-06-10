# Coding Conventions

## Naming
- Functions and variables: `camelCase`
- Classes and types: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts`

## Functions
- Max 40 lines per function; extract helpers otherwise
- Prefer pure functions; isolate side effects to the edge of the module
- Early-return over deep nesting

## Error Handling
- Never swallow errors silently (`catch (e) {}` without re-throw or log is a warning)
- Use typed error classes for domain errors; `Error` for unexpected conditions

## Tests
- Every new public function must have at least 1 happy-path test
- Bug fixes must include a regression test

## TypeScript
- No `any` unless justified by a comment
- Prefer `unknown` over `any` for external data boundaries
