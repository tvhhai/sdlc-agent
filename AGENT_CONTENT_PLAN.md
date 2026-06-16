# Agent Content Plan & Attribution Ledger

> Tài liệu làm việc (working doc) — theo dõi việc hoàn thiện nội dung 6 MVP agents.
> **Mọi lần copy / adapt / lấy ý tưởng từ nguồn ngoài đều PHẢI ghi một dòng vào Attribution Ledger (mục 6)** — đây là cơ chế để chủ dự án kiểm soát những gì AI assistant đã làm.
> File này không thuộc hệ thống docs/ (không cần HTML viewer). Cập nhật liên tục trong quá trình làm.

Cập nhật lần cuối: 2026-06-16

---

## 1. Mục tiêu & nguyên tắc

**Mục tiêu:** 6 agents (`requirement-analyst`, `planner`, `solution-architect`, `coder`, `test-generator`, `code-reviewer`) đủ sâu để 1 team pilot dùng thật trong 1 sprint.

**Nguyên tắc đã thống nhất:**

1. **KHÔNG mở rộng engine** (không wizard, không patch overrides, không adapter mới) cho đến khi có pilot user.
2. **Artifact chain trước, prompt sau** — định nghĩa chuỗi PRD → plan → ADR → code → tests → review report với contract input/output rõ ràng, rồi prompt từng agent mới viết theo chain.
3. **Tham khảo nguồn có sẵn thay vì tự viết** — copy tay + adapt, ghi attribution. KHÔNG build cơ chế `imports` của engine (Phase 2).
4. **Dogfood** — dùng chính 6 agents để phát triển repo này; mỗi lần chạy thật = 1 golden case.

---

## 2. Việc cần làm (checklist)

### Bước 1 — Artifact chain & templates ✅ (2026-06-12)
- [x] Vẽ artifact chain: file gì, section nào bắt buộc, agent nào đọc/ghi (ghi vào mục 5)
- [x] Cập nhật `templates/prd.md` — cấu trúc section của mattpocock `to-prd` + marker `[NEEDS CLARIFICATION]` + P1/P2/P3 + FR/SC numbering của Spec Kit
- [x] Cập nhật `templates/plan.md` — superpowers `writing-plans` (file-structure-first, bite-sized TDD steps, no-placeholders, self-review) + vertical slices của `to-issues` + story-file của BMAD (Context self-contained)
- [x] Cập nhật `templates/hld.md` — ADR Nygard format (consequences cả negative) + Delta section cho brownfield (OpenSpec)
- [x] Cập nhật `templates/test-plan.md` (behaviours-not-functions, risk-prioritized, coverage decisions), `templates/review-report.md` (checklists-run, not-reviewed, severity rules)
- [x] Mỗi template có HTML comment đầu file: **ARTIFACT CHAIN CONTRACT** (written by / reads / consumed by / rule) + Attribution

### Bước 2 — Nâng cấp 6 agents (theo bảng mục 4) ✅ (2026-06-12, version 1.0.0 → 1.1.0)
- [x] `requirement-analyst` — explore-codebase-first, interview 1 câu/lần, NEEDS CLARIFICATION thay vì đoán, FR/SC, handoff
- [x] `planner` — từ chối plan khi PRD còn marker mở, file-structure-first, vertical slices, task self-contained, self-review
- [x] `solution-architect` — drivers trích từ FR/SC, ≥2 options, ADR consequences âm/dương, Delta brownfield
- [x] `coder` — iron law (xóa code viết trước test), vertical slices (1 test → 1 impl), watch-it-fail-right
- [x] `test-generator` — behaviours not functions, risk-prioritized, coverage decisions minh bạch
- [x] `code-reviewer` — review against declared requirements, severity discipline, not-reviewed honesty
- [x] `pnpm sdlc validate` OK · `pnpm sdlc build` 20 files · `pnpm test` 124/124 pass

### Bước 2.1 — Vòng làm sâu thứ 2 ✅ (2026-06-16, version 1.1.0 → 1.2.0)
> Phát sinh sau khi phát hiện repo [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) (S7) — đối chiếu thấy 2 lỗ hổng (slash-command, VERIFY nông) + thiếu policy depth.
- [x] **Slash commands** (ROI #1): claude-code adapter render thêm `.claude/commands/<id>.md` — mỗi command là entry point do user gọi (`/coder …`), dispatch tới subagent cùng tên. 1 thay đổi adapter, sinh tự động từ 6 agent. `.gitignore` mở exception `!.claude/commands/`.
- [x] **Policy depth** (ROI #2): thêm `policies/performance-checklist.md` + `policies/testing-patterns.md`; làm giàu `policies/security-checklist.md` (Threat Modeling, AI/LLM Security, OWASP). Reference từ `code-reviewer` (performance) + `test-generator` (testing-patterns).
- [x] **Vá VERIFY** (ROI #3): thêm `policies/debugging-and-recovery.md` (loop reproduce→isolate→fix→verify); reference từ `coder` + `test-generator`; bước "watch-it-fail → diagnose → recover" thay cho "chỉ fix test bug".
- [x] `pnpm sdlc validate` OK · `pnpm sdlc build` 26 files (claude-code 12) · `pnpm test` 136/136 · typecheck + lint sạch

### Bước 3 — Dogfood & golden cases
- [ ] Chọn 1 feature thật của repo này, chạy đủ chuỗi 6 agents
- [ ] Lưu mỗi cặp input/output thật vào `examples/golden/<agent-id>/` (≥ 1 case/agent)
- [ ] Ghi lại chỗ prompt yếu → sửa → chạy lại

### Bước 4 — Pilot
- [ ] Đưa cho 1–2 team/người ngoài dùng thử 1 sprint
- [ ] Tiêu chí dừng: sau 4–6 tuần không ai dùng tuần thứ 2 → dừng đầu tư mở rộng

---

## 3. Nguồn tham khảo đã chọn

| # | Nguồn | License | Lấy gì | Lưu ý |
|---|-------|---------|--------|-------|
| S1 | [obra/superpowers](https://github.com/obra/superpowers) | Kiểm tra license trước khi copy nguyên văn | Workflow: `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `brainstorming`, `requesting-code-review`, `receiving-code-review` | Có trong Anthropic marketplace; đã được battle-test |
| S2 | [mattpocock/skills](https://github.com/mattpocock/skills) | MIT | `to-prd` (template PRD 8 section), `grill-me` (elicitation), `to-issues` (breakdown), `tdd`, `diagnose`, `handoff` (nén context khi chuyển agent), `zoom-out` | MIT — sạch để vendor |
| S3 | [anthropics/skills](https://github.com/anthropics/skills) | Kiểm tra per-skill | Document skills (nếu cần cho output template) | Chính chủ Anthropic |
| S4 | [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) (v6, 46.7k★) | MIT | **Cơ chế story-file** (mỗi task tự chứa context: requirements trích đoạn + architecture trích đoạn + AC), file-based handoff giữa agents, elicitation techniques của agent Analyst, checklists của agent QA/PO | KHÔNG học cấu trúc persona/party-mode — hệ sinh thái khép kín của họ. v6 có "Cross Platform Agent Team" — đáng đọc cách họ render đa tool |
| S5 | [github/spec-kit](https://github.com/github/spec-kit) (90k★) | MIT | `constitution.md` (nguyên tắc dự án → map vào policy layer), marker `[NEEDS CLARIFICATION]`, gated progression (specify → plan → tasks → implement), cấu trúc template spec/plan | Đọc thư mục `templates/` của họ kỹ hơn đọc prompt |
| S6 | [OpenSpec](https://github.com/Fission-AI/OpenSpec) (52k★, 06/2026) | Kiểm tra | Proposal-centered workflow + **delta markers** cho brownfield (chỉ spec phần thay đổi) | MỚI PHÁT HIỆN 06/2026 — SA doc chưa có. Phù hợp cho agent `solution-architect` xử lý thay đổi trên codebase có sẵn |
| S7 | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | MIT | `references/performance-checklist.md`, `references/testing-patterns.md`, `references/security-checklist.md` (phần Threat Modeling + AI/LLM + OWASP); ý tưởng `debugging-and-error-recovery` skill; mô hình 6-pha DEFINE→…→SHIP (xác nhận hướng + lấp pha SHIP) | MỚI PHÁT HIỆN 2026-06-16. Cùng concept với set này (6-pha SDLC cho agent), kế thừa DNA superpowers (anti-rationalization tables, red flags). Đầy đủ hơn ở pha SHIP. KHÔNG copy persona/multi-tool folder (engine của ta làm tốt hơn) |

### Quy tắc khi tham khảo

1. **Trước khi copy nguyên văn:** kiểm tra license của repo + file cụ thể. MIT/Apache-2.0 → OK kèm attribution. License khác → chỉ "lấy ý tưởng" (viết lại bằng lời mình).
2. **Pin nguồn:** ghi commit hash hoặc tag của repo tại thời điểm tham khảo vào ledger.
3. **Review nội dung import** trước khi đưa vào agent (rủi ro R7 trong SA doc — prompt injection qua skill: URL lạ, lệnh shell ẩn).
4. **Attribution tập trung:** ledger trong file này (mục 6) là nơi DUY NHẤT ghi nguồn — không ghi comment attribution trong từng file đích (quyết định chủ dự án 2026-06-12). Hợp lệ license vì không copy nguyên văn (toàn adapt/idea).

---

## 4. Bảng mapping: agent nào lấy gì từ nguồn nào

| Agent | Nguồn chính | Phần cụ thể lấy | File đích |
|-------|------------|-----------------|-----------|
| `requirement-analyst` | S2 `to-prd`, `grill-me` + S5 marker + S4 elicitation | Cấu trúc PRD 8-section; kỹ thuật hỏi ngược; `[NEEDS CLARIFICATION]` khi mơ hồ thay vì đoán | `agents/requirement-analyst.yaml` (workflow), `templates/prd.md` |
| `planner` | S1 `writing-plans` + S4 story-file + S2 `to-issues` | Mỗi task có: context tự chứa, bước verify, definition of done; breakdown thành task độc lập "grabbable" | `agents/planner.yaml`, `templates/plan.md` |
| `solution-architect` | S5 constitution + ADR pattern + S6 delta markers | So sánh ≥ 2 options bắt buộc; consequences section; brownfield: chỉ spec phần thay đổi | `agents/solution-architect.yaml`, `templates/hld.md` |
| `coder` | S1 `test-driven-development` + S2 `tdd` | Vòng lặp RED → GREEN → REFACTOR nghiêm ngặt; cấm viết code trước test; so sánh 2 bản TDD và merge bản tốt hơn | `agents/coder.yaml` |
| `test-generator` | S1 `test-driven-development` (phần test design) + S4 QA checklists | Ma trận test (happy/edge/error); tiêu chí coverage theo risk | `agents/test-generator.yaml`, `templates/test-plan.md` |
| `code-reviewer` | S1 `requesting/receiving-code-review` + policy layer riêng | Quy trình review 2 chiều; severity tagging; đối chiếu `policies/security-checklist.md` + `policies/conventions.md` (phần RIÊNG của mình — không nguồn nào có) | `agents/code-reviewer.yaml`, `templates/review-report.md` |
| **Cross-cutting** | S2 `handoff` | Cách nén context khi chuyển artifact giữa 2 agents — đưa vào cuối workflow của MỌI agent ("kết thúc bằng handoff block cho agent kế tiếp") | tất cả `agents/*.yaml` |
| `code-reviewer` (v1.2.0) | S7 performance + security checklist | Checklist hiệu năng (N+1, unbounded query, main-thread blocking); làm giàu security (Threat Modeling, AI/LLM, OWASP) | `policies/performance-checklist.md`, `policies/security-checklist.md`; `agents/code-reviewer.yaml` step 5 + policies |
| `test-generator` (v1.2.0) | S7 testing-patterns + debugging skill | Patterns AAA/naming/mock-at-boundary/anti-patterns; loop diagnose→recover khi test fail | `policies/testing-patterns.md`, `policies/debugging-and-recovery.md`; `agents/test-generator.yaml` steps 6–7 + policies |
| `coder` (v1.2.0) | S1 systematic-debugging + S7 debugging skill (idea) | Khi test fail sai lý do / suite vỡ: reproduce→hypothesis→minimal fix→verify | `policies/debugging-and-recovery.md`; `agents/coder.yaml` step 5 + policies |
| **Slash commands** | S7 mô hình `/spec /plan /build…` (idea) | Entry point do user gọi, hiển thị; render tự động 1 command/agent dispatch tới subagent | claude-code adapter `renderCommand()`; output `.claude/commands/<id>.md` |

---

## 5. Artifact chain (điền ở Bước 1)

```
raw idea ──► requirement-analyst ──► docs/work/prd-<feature>.md
                                          │ (sections bắt buộc: Problem, User Stories, AC-Gherkin, Out of Scope, NEEDS-CLARIFICATION list)
                                          ▼
             planner ──────────────► docs/work/plan-<feature>.md
                                          │ (mỗi task: context tự chứa + verification + DoD)
                                          ▼
             solution-architect ───► docs/work/hld-<feature>.md (khi cần ADR)
                                          ▼
             coder ────────────────► code + tests (TDD)
                                          ▼
             test-generator ───────► test plan + test code bổ sung
                                          ▼
             code-reviewer ────────► review report (severity-tagged)
```

**Đã chốt (2026-06-12):**
- Vị trí artifact khi dogfood: `docs/work/<feature>/` — **commit** (làm golden cases, theo Q1).
- Section bắt buộc của từng artifact: xem HTML comment "ARTIFACT CHAIN CONTRACT" ở đầu mỗi file `templates/*.md`.
- Handoff block format: section cuối mỗi template — `Handoff → <agent kế tiếp>`: next agent / inputs to provide / blocking items. Mọi agent kết thúc workflow bằng bước viết handoff block.
- Gate giữa các phase: planner từ chối nhận PRD còn `[NEEDS CLARIFICATION]` mở; coder dừng và báo planner khi Task block không self-contained; review "Needs changes" quay về coder với fix order Critical → Warning.

---

## 6. ATTRIBUTION LEDGER

> **Bảng kiểm soát.** Mỗi dòng = một lần lấy nội dung từ nguồn ngoài. Ghi NGAY khi thực hiện, không ghi gộp cuối ngày.
>
> **Mức độ:** `copy` = copy nguyên văn (cần license MIT/Apache) · `adapt` = sửa đổi đáng kể từ nguồn · `idea` = chỉ lấy ý tưởng/cấu trúc, tự viết lời

**Pin các nguồn (lấy 2026-06-12):** mattpocock/skills@`694fa30311e0` · obra/superpowers@`6fd450765978` (MIT, đã verify LICENSE) · github/spec-kit@`1b0556c711b6` (MIT)
**Pin bổ sung (lấy 2026-06-16):** addyosmani/agent-skills@`a5f0b176381e` (MIT)

| Ngày | Nguồn (repo@ref, đường dẫn file nguồn) | Mức độ | Phần lấy | Áp dụng tại (file : dòng/section) | Ghi chú |
|------|----------------------------------------|--------|----------|-----------------------------------|---------|
| 06-12 | mattpocock/skills@694fa30 `skills/engineering/to-prd/SKILL.md` | adapt | Cấu trúc section PRD (Problem/Solution/User Stories/Implementation Decisions/Testing Decisions/Out of Scope/Further Notes); rule "NO file paths or code snippets — they go stale" | `templates/prd.md` toàn bộ skeleton section; `agents/requirement-analyst.yaml` workflow step 7 | MIT. Bỏ phần publish-to-issue-tracker (ngoài scope) |
| 06-12 | github/spec-kit@1b0556c `templates/spec-template.md` | adapt | Marker `[NEEDS CLARIFICATION: …]`; story priority P1/P2/P3 + "Independent test" + "P1 alone must be viable"; numbering FR-001/SC-001; Success Criteria technology-agnostic; Assumptions section | `templates/prd.md` sections User Stories / FR / SC / Assumptions / Open Clarifications; `agents/requirement-analyst.yaml` steps 3–6; `agents/planner.yaml` step 1 (gate); `agents/solution-architect.yaml` step 8 | MIT |
| 06-12 | mattpocock/skills@694fa30 `skills/productivity/grill-me/SKILL.md` | adapt | Interview 1 câu/lần; "nếu codebase trả lời được thì explore codebase thay vì hỏi"; kèm recommended answer cho mỗi câu hỏi | `agents/requirement-analyst.yaml` workflow steps 1–3 | MIT |
| 06-12 | obra/superpowers@6fd4507 `skills/writing-plans/SKILL.md` | adapt | File-structure-first; bite-sized steps (mỗi step 1 hành động, theo thứ tự TDD); exact paths; danh sách "plan failures" (TBD/TODO/handle edge cases/similar to Task N); Self-Review 3 bước; plan header Goal/Architecture/Tech Stack | `templates/plan.md` sections File Structure / Task / Steps / Plan Self-Review + header; `agents/planner.yaml` steps 3, 5, 8 | MIT |
| 06-12 | mattpocock/skills@694fa30 `skills/engineering/to-issues/SKILL.md` | adapt | Vertical slices / tracer bullets (cắt qua mọi layer, demoable độc lập, nhiều slice mỏng hơn ít slice dày); "Covers: story ids"; "Blocked by" | `templates/plan.md` Task Breakdown comment + fields Covers/Depends on; `agents/planner.yaml` step 4 | MIT |
| 06-12 | bmad-code-org/BMAD-METHOD (concept story file, không copy text) | idea | Task tự chứa context: trích đoạn AC + decision liên quan ngay trong task để coder không cần đọc PRD đầy đủ | `templates/plan.md` field "Context (self-contained)"; `agents/planner.yaml` step 5; `agents/coder.yaml` step 1 | MIT. Chỉ lấy ý tưởng, tự viết lời |
| 06-12 | obra/superpowers@6fd4507 `skills/test-driven-development/SKILL.md` | adapt | Iron law "NO production code without a failing test first"; "viết code trước test → DELETE, không giữ làm reference"; "watch it fail for the RIGHT reason" | `agents/coder.yaml` steps 2, 4–5 | MIT |
| 06-12 | mattpocock/skills@694fa30 `skills/engineering/tdd/SKILL.md` | adapt | Anti-pattern horizontal slices (1 test → 1 impl, không viết hết test trước); behaviour-over-implementation ("test breaks on refactor without behaviour change = bad test"); test qua public interface; "you can't test everything — prioritize by risk"; prior art trong codebase | `agents/coder.yaml` steps 3–4; `agents/test-generator.yaml` steps 1–3, 6; `templates/test-plan.md` contract rule + Behaviours/Coverage Decisions | MIT |
| 06-12 | obra/superpowers@6fd4507 `skills/requesting-code-review/SKILL.md` | adapt | Review against declared requirements (không phải session history); severity discipline: Critical fix ngay/block merge, Important trước khi tiếp tục, Minor ghi chú; re-request review sau khi fix | `agents/code-reviewer.yaml` steps 1, 7, 9; `templates/review-report.md` severity rules + Handoff | MIT |
| 06-12 | Nygard ADR format (qua spec-kit + mattpocock `grill-with-docs/ADR-FORMAT.md`) | idea | ADR Context/Decision/Consequences — consequences bắt buộc có negative ("every decision has costs") + follow-ups | `templates/hld.md` section ADR; `agents/solution-architect.yaml` step 5 | Chuẩn công khai, tự viết lời |
| 06-12 | Fission-AI/OpenSpec (concept, không copy text) | idea | Delta-spec cho brownfield: chỉ spec phần ADDED/MODIFIED/REMOVED, không re-spec phần không đổi; "keep current design" là 1 option hợp lệ | `templates/hld.md` section Delta; `agents/solution-architect.yaml` steps 3, 6 | Chỉ lấy ý tưởng |
| 06-12 | mattpocock/skills@694fa30 `skills/productivity/handoff/SKILL.md` | idea | Artifact kết thúc bằng handoff block cho agent kế tiếp; không lặp lại nội dung đã có trong artifact khác — reference bằng path | Section "Handoff →" cuối cả 5 `templates/*.md`; bước cuối workflow của cả 6 `agents/*.yaml` | MIT. Lấy ý tưởng, format tự thiết kế |
| 06-16 | addyosmani/agent-skills@a5f0b17 `references/performance-checklist.md` | adapt | Core Web Vitals targets, TTFB diagnosis, frontend/backend checklist (N+1, unbounded query, indexes, bundle/INP), anti-pattern table | `policies/performance-checklist.md` (toàn bộ); `agents/code-reviewer.yaml` step 5 | MIT. Trim font micro-items, thêm câu "apply sections relevant to the change" |
| 06-16 | addyosmani/agent-skills@a5f0b17 `references/testing-patterns.md` | adapt | AAA structure, naming convention, common assertions, mock-at-boundary, anti-pattern table | `policies/testing-patterns.md` (toàn bộ); `agents/test-generator.yaml` step 6 | MIT. Bỏ code-block dài React/Playwright, giữ nguyên tắc |
| 06-16 | addyosmani/agent-skills@a5f0b17 `references/security-checklist.md` | adapt | Threat Modeling, AI/LLM Security (model output untrusted, prompt injection, scope tool perms), OWASP Top 10 cross-check | `policies/security-checklist.md` (các section thêm vào sau "Logging") | MIT. Giữ nguyên phần security gốc của dự án, chỉ APPEND phần sâu hơn |
| 06-16 | obra/superpowers@6fd4507 `skills/systematic-debugging` + addyosmani `skills/debugging-and-error-recovery` (concept) | idea | Loop reproduce → read real error → isolate/one-hypothesis → minimal fix → verify-for-right-reason → check siblings; red flags (swallow error, weaken assertion, permanent skip); escalation | `policies/debugging-and-recovery.md` (toàn bộ); `agents/coder.yaml` step 5; `agents/test-generator.yaml` step 7 | MIT cả 2. Chỉ lấy ý tưởng loop, tự viết lời |
| 06-16 | addyosmani/agent-skills@a5f0b17 (mô hình slash command `/spec /plan /build …`) | idea | Có entry point do user gọi (hiển thị) song song với auto-routing; 1 command/agent | claude-code adapter `packages/adapters/claude-code/src/index.ts` `renderCommand()`; output `.claude/commands/<id>.md` | MIT. Tự thiết kế nội dung command (dispatch tới subagent), không copy text |

---

## 7. Khảo sát thị trường bổ sung (2026-06-12) — công cụ SA doc đã bỏ sót

Khảo sát lại để trả lời câu hỏi "có bỏ sót công cụ nào không". Kết quả: **CÓ, 3 nhóm.**

### 7.1 Nhóm "sync config đa tool" — cạnh tranh TRỰC TIẾP với build engine (SA doc hoàn toàn không nhắc)

| Tool | Mô tả | Ý nghĩa |
|------|-------|---------|
| [rulesync](https://github.com/dyoshikawa/rulesync) | 1 nguồn `.rulesync/` → sinh config cho 20+ tools (rules, skills, commands, subagents) | Làm đúng việc của engine này, trưởng thành hơn |
| [ruler](https://github.com/intellectronica/ruler) | "Apply the same rules to all coding agents" | Cùng loại |
| [agent_sync](https://github.com/yelmuratoff/agent_sync) | `.ai/src/` → 11 tools | Cùng loại |
| [ai-rules-sync](https://github.com/lbb00/ai-rules-sync) | Sync rules/skills/commands/subagents đa tool | Cùng loại |

**Kết luận:** tầng engine đã bị commoditize hơn cả đánh giá trước đó. Càng khẳng định: **giá trị duy nhất còn lại là nội dung agent + artifact chain + policy layer**, không phải engine.

### 7.2 Chuẩn SKILL.md đã thắng cuộc đua format (12/2025 – 03/2026)

- Anthropic công bố spec Agent Skills 18/12/2025; đến 03/2026 đã có **32 tools** đọc cùng format SKILL.md (Codex, Cursor, Gemini CLI, VS Code, Kiro, Goose...). Hệ sinh thái 40.000+ skills công khai (02/2026).
- **Hệ quả cho dự án:** premise "mỗi tool một format" đã yếu đi đáng kể. Adapter `skill-md` (output SKILL.md) nên được **nâng độ ưu tiên** từ "Phase 2 bonus" lên "adapter đáng làm nhất tiếp theo" — 1 adapter phủ 32 tools, hơn cả universal tier hiện tại. (Vẫn KHÔNG làm trước khi xong nội dung 6 agents.)

### 7.3 Nhóm spec-driven & SDLC framework — cập nhật trạng thái 06/2026

| Tool | Trạng thái 06/2026 | Bỏ sót? |
|------|--------------------|---------|
| [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | v6.6 (04/2026), 46.7k★, có Cross Platform Agent Team + Skills Architecture | SA doc không nhắc — đối thủ gần nhất về concept |
| [GitHub Spec Kit](https://github.com/github/spec-kit) | 90k★ | SA doc không nhắc |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | 52k★, proposal-centered, mạnh cho brownfield | Bỏ sót — đáng tham khảo cho solution-architect |
| AWS Kiro | Agentic IDE, EARS syntax, đọc được SKILL.md | Biết rồi, không cần adapter riêng |
| Tessl | Spec Registry 10k+ specs (cách dùng đúng thư viện OSS) | Hướng khác (spec-as-source), theo dõi thôi |
| GSD | Xuất hiện trong các bảng so sánh 2026 | Theo dõi, chưa cần hành động |

Nguồn khảo sát: [MarkTechPost 05/2026](https://www.marktechpost.com/2026/05/08/9-best-ai-tools-for-spec-driven-development-in-2026-kiro-bmad-gsd-and-more-compare/), [martinfowler.com SDD tools](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html), [spec-compare](https://github.com/cameronsjo/spec-compare), [Agent Skills standard](https://www.paperclipped.de/en/blog/agent-skills-open-standard-interoperability/), [Codex skills docs](https://developers.openai.com/codex/skills), [Cursor skills docs](https://cursor.com/docs/skills).

---

## 8. Quyết định chờ chủ dự án

| # | Câu hỏi | Đề xuất của AI | Quyết định |
|---|---------|----------------|------------|
| Q1 | Artifact khi dogfood lưu ở `docs/work/` — commit hay gitignore? | Commit (làm golden cases + bằng chứng pilot) | ✅ theo đề xuất (2026-06-12) |
| Q2 | Adapter `skill-md` (SKILL.md, phủ 32 tools) — làm ngay sau khi xong 6 agents, hay chờ pilot? | Chờ pilot xong mới làm | ✅ theo đề xuất (2026-06-12) |
| Q3 | superpowers license — nếu không phải MIT thì chỉ `idea`, không `copy`? | Đúng vậy, check trước khi vendor | ✅ Đã verify: superpowers là MIT → adapt OK (2026-06-12) |
| Q4 | Output language của artifact khi dogfood: en hay vi? | en (khớp `sdlc.config.yaml` hiện tại) | ✅ theo đề xuất (2026-06-12) |
| Q5 | Có thêm output slash-command cho claude-code không? | Có — ROI cao nhất, sinh tự động từ engine | ✅ Đã làm (2026-06-16) |
| Q6 | Pha SHIP (deploy/ci-cd/release/observability) — thêm agent hay out-of-scope? | Out-of-scope hiện tại, nhưng thiết kế để thêm dễ; chờ team discuss | ✅ theo đề xuất: hoãn, đã viết hướng dẫn thêm (mục 9) (2026-06-16) |

---

## 9. Phụ lục — Thêm pha SHIP sau này (để team discuss)

> **Trạng thái hiện tại:** vòng đời 6 agent dừng ở `review`. SHIP (deploy, CI/CD, release, migration, observability) **chưa có**, là **out-of-scope có chủ đích** (Q6). Đối thủ gần nhất [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) có đủ SHIP — đây là khoảng cách lớn nhất nếu định vị sản phẩm là "design → production" thay vì "spec → tested-code có kiểm toán".
>
> SA_DESIGN đã phác sẵn SHIP trong tầm nhìn: **Phase 5 `release-manager`** (release notes, deployment checklist, rollback plan) và **Phase 6 Operate & Maintain**. Phần dưới là hướng dẫn thực thi cụ thể khi team quyết định bật.

### 9.1 Vì sao thêm được "dễ" — kiến trúc đã sẵn sàng

Engine tách nguồn (YAML) khỏi output (render). Thêm 1 agent SHIP = thêm 1 file YAML + policy, **không đụng engine**. Tất cả 3 adapter (universal, claude-code, copilot) tự render agent + command mới; slash-command `/release-manager` sinh tự động. Đây là lợi thế so với addyosmani (họ phải viết tay command cho từng tool).

### 9.2 Phương án — chọn 1 trong 2

| | A. Một agent `release-manager` (gộp) | B. Nhiều agent SHIP (tách) |
|---|---|---|
| Phạm vi | 1 agent lo release notes + deploy checklist + rollback | `release-manager` + `ci-cd-engineer` + `observability-engineer` + `migration-planner` |
| Phase enum | dùng lại `review` HOẶC thêm `release`/`operate` | bắt buộc thêm phase mới |
| Ưu | nhỏ, đúng tinh thần "không phình"; đủ cho đa số team | phủ sâu, sát addyosmani |
| Nhược | nông ở từng mảng | 4 file, dễ trùng lặp, khó audit |
| **Đề xuất** | ✅ **Bắt đầu bằng A**, tách sau nếu pilot cần | chỉ khi định vị "ship đầy đủ" |

### 9.3 Checklist thực thi phương án A (ước lượng ~0.5 ngày)

1. **Schema — thêm phase enum.** `packages/core/src/schema.ts`: enum hiện là `requirement|planning|architecture|coding|testing|review`. Thêm `release` (và `operate` nếu làm Phase 6). ⚠️ Đây là thay đổi schema → cập nhật mọi test giả định 6 phase/6 agent (`real-agents.test.ts` `EXPECTED_IDS` & counts, `model-map.test.ts` PHASES list).
2. **Model map.** `release-manager` thiên về tổng hợp/checklist → `model_hint: balanced` (Sonnet). Adapter claude-code map sẵn, không cần sửa.
3. **Agent YAML.** Tạo `agents/release-manager.yaml`: workflow gồm — đọc PRD/plan/review report đã merge → sinh release notes (theo Conventional Commits/changelog) → deployment checklist (env vars, migrations, feature flags, smoke test) → rollback triggers + plan → handoff. `inputs`: merged_changes, version, target_env. `output_template: templates/release-plan.md`.
4. **Template mới.** `templates/release-plan.md` với ARTIFACT CHAIN CONTRACT (reads: review report + plan; consumed by: người deploy/CI). Tham khảo S7 `references/` + skill `ci-cd-and-automation`, `deprecation-and-migration`, `shipping-and-launch`.
5. **Policy mới.** `policies/deploy-checklist.md` (pre-deploy gate: CI xanh, approvals, migration reversible, rollback documented, observability ready) + `policies/release-safety.md`. Có thể adapt từ S7 (MIT) + skill `engineering:deploy-checklist`.
6. **Artifact chain.** Nối: `code-reviewer` (review report) → `release-manager` (release plan). Cập nhật sơ đồ mục 5 + handoff block của `code-reviewer` trỏ tới `release-manager`.
7. **Validate + build + test.** `pnpm sdlc validate && pnpm sdlc build && pnpm test` — sửa các count test (7 agent, claude-code 14 files…).
8. **Docs.** SA_DESIGN: tích Phase 5 checkbox; AGENT_CONTENT_PLAN: ledger rows cho nội dung lấy từ S7; nếu thêm phase enum → ghi rõ breaking change.

### 9.4 Điểm cần team quyết trước khi làm

- **Định vị sản phẩm:** "spec → tested-code (audit)" hay "design → production"? Quyết định này mới là gốc, không phải việc thêm agent.
- **Phase enum:** dùng lại `review` hay thêm `release`/`operate`? (thêm enum = breaking cho test + manifest, nhưng đúng ngữ nghĩa hơn).
- **CI/CD có thuộc agent không**, hay là tài liệu/checklist tĩnh? (deploy thật chạm hạ tầng — rủi ro cao, có thể chỉ nên sinh checklist + plan, KHÔNG để agent tự deploy).

> Khi chốt, mở lại file này, thêm S-source cho nội dung copy và ledger rows tương ứng trước khi code.
