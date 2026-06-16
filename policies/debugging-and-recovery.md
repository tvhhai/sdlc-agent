# Debugging & Error Recovery

Use this when a test fails for an unexpected reason, the suite breaks, or runtime
behaviour contradicts the spec. The goal is to **prove** the fix, not to make the
red go away. Resist the urge to change code at random until it passes — that hides
the bug instead of removing it.

## The Loop

1. **Reproduce reliably.** Get a deterministic repro — the exact command, input,
   and environment that triggers the failure. An intermittent bug you cannot
   reproduce is a bug you cannot verify you fixed.
2. **Read the actual error.** The full message and stack trace, top frame first.
   Do not guess from the symptom; let the error point at the line. Confirm the
   test is failing for the RIGHT reason (real assertion / real exception), not a
   typo, a stale build, or a mis-wired fixture.
3. **Isolate before hypothesising.** Narrow to the smallest failing unit (one
   test, one input, bisect the change). Form ONE hypothesis about the cause and
   state how you would confirm it — then confirm it (log, breakpoint, assertion)
   before editing anything.
4. **Fix the cause, minimally.** Change the root cause, not the symptom. No
   broad rewrites, no swallowing the error, no loosening the assertion to pass.
5. **Verify green for the right reason.** Re-run the failing case and the full
   suite. The test that was red must now be green *because the behaviour is
   correct*, not because it stopped exercising the code.
6. **Check for siblings.** The same bug class usually appears elsewhere — search
   for the pattern and fix or flag the other occurrences.

## Red Flags (stop and rethink)

- [ ] Changing code without a confirmed hypothesis ("let me try this")
- [ ] Weakening/deleting an assertion to make a test pass
- [ ] `try/catch` that swallows the error to silence the failure
- [ ] "It passes now" without knowing *why* it was failing
- [ ] Marking a test `.skip` instead of diagnosing it
- [ ] Reproduction only "sometimes" — you have not isolated the cause yet

## Escalation

If the cause sits outside the current task (a real source bug, a flawed plan
assumption, a missing dependency), **stop and report it** to the upstream agent
(coder → planner, test-generator → coder) instead of papering over it inside the
test. Honest escalation beats a green suite that lies.
