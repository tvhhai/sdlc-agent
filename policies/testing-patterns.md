# Testing Patterns

Reference for writing tests across the stack. Use alongside the test-generator
workflow. Adapt the syntax to the project's actual framework (Vitest, Jest,
pytest, …) and follow prior art already in the codebase over these defaults.

## Test Structure — Arrange / Act / Assert

```typescript
it("describes expected behaviour", () => {
  // Arrange: set up data and preconditions
  const input = { title: "Test Task", priority: "high" };
  // Act: perform the action under test
  const result = createTask(input);
  // Assert: verify the outcome
  expect(result.title).toBe("Test Task");
  expect(result.status).toBe("pending");
});
```

## Naming — `[unit] [expected behaviour] [condition]`

```typescript
describe("TaskService.createTask", () => {
  it("creates a task with default pending status", () => {});
  it("throws ValidationError when title is empty", () => {});
  it("trims whitespace from title", () => {});
});
```

A test name should read like a sentence from the spec. If you cannot name the
behaviour clearly, you do not yet understand what you are testing.

## Common Assertions

```typescript
expect(result).toEqual(expected);        // deep equality (objects/arrays)
expect(result).toBe(expected);           // strict equality (===)
expect(value).toBeGreaterThan(5);
expect(value).toBeCloseTo(0.3, 5);       // floating point
expect(text).toMatch(/pattern/);
expect(array).toHaveLength(3);
expect(obj).toHaveProperty("key", "value");
expect(() => fn()).toThrow(ValidationError);
await expect(asyncFn()).resolves.toBe(value);
await expect(asyncFn()).rejects.toThrow(Error);
```

## Mock at Boundaries Only

```
Mock these:                     Don't mock these:
├── Database calls              ├── Internal utility functions
├── HTTP / external API calls   ├── Business logic
├── File system operations      ├── Data transformations / validation
└── Time / randomness           └── Pure functions
```

Mocking internal logic tests the mock, not the system. A test that breaks on a
pure refactor (no behaviour change) is a defect of the test.

## Component Testing (e.g. Testing Library)

Find elements by accessible role/label, not test IDs. Assert on what the user
sees and on the callbacks/outputs your component promises — not on internal state.

## API / Integration Testing

Exercise the real route through the public surface: assert status code, response
shape (`toMatchObject` with `expect.any(String)` for generated ids), and the
auth/error paths (401 without auth, 422 on invalid input), not just the happy path.

## E2E (Playwright/Cypress)

Drive the app the way a user does — navigate, fill, click, assert visible state.
Keep E2E for critical user journeys; push edge-case coverage down to unit tests
where it is cheaper and faster.

## Test Anti-Patterns

| Anti-Pattern | Problem | Better Approach |
|---|---|---|
| Testing implementation details | Breaks on refactor | Test inputs/outputs |
| Snapshot everything | No one reviews snapshot diffs | Assert specific values |
| Shared mutable state | Tests pollute each other | Setup/teardown per test |
| Testing third-party code | Wastes time, not your bug | Mock the boundary |
| `test.skip` left permanently | Dead code hides bugs | Remove or fix it |
| Overly broad assertions | Misses regressions | Be specific |
| No `await` on async tests | Swallowed errors, false passes | Always await async tests |
