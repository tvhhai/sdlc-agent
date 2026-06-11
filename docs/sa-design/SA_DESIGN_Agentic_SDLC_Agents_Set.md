# Agentic SDLC Agents Set — Solution Architecture Document

| | |
|---|---|
| **Tên sản phẩm** | Agentic SDLC Agents Set |
| **Loại sản phẩm** | Library (bộ agent definitions tái sử dụng, đa nền tảng) |
| **Phiên bản tài liệu** | 0.1 (Draft) |
| **Ngày** | 2026-06-10 |
| **Tác giả** | SA Team |
| **Trạng thái** | Đang thiết kế — chờ review |

---

## 1. Executive Summary

**Agentic SDLC Agents Set** là một **bộ AI Agent được đặc tả sẵn** (agent definitions, prompts, workflows, skills) cho từng giai đoạn của vòng đời phát triển phần mềm (SDLC), được đóng gói theo chiến lược **Hybrid**:

1. **Builder core:** giữ một nguồn chuẩn trong `agents/*.yaml`, validate bằng schema, rồi build ra nhiều format qua adapter.
2. **Installer UX:** cung cấp trải nghiệm cài đặt tương tự `npx skills` / `create-vue`: hỏi người dùng đang dùng tool nào, muốn bật agents nào, scope project hay user, language/team variables là gì, sau đó tự generate config và output.

Cơ chế runtime vẫn là **universal-first**: luôn build `AGENTS.md` + `.sdlc/agents/` để mọi AI tool đọc được, cộng thêm **native adapter** cho tool nào có format riêng mạnh hơn như Claude Code hoặc GitHub Copilot.

**Giá trị cốt lõi:**
- Team mới chỉ cần `install` bộ agents là có ngay quy trình SDLC chuẩn có AI hỗ trợ — không phải tự viết prompt/agent từ đầu.
- Chuẩn hoá chất lượng output AI giữa các team (cùng coding convention, cùng template tài liệu, cùng quy trình review).
- Một nguồn maintain duy nhất (single source of truth) → build ra nhiều format cho từng tool.

**Analogy:** giống như "Terraform modules" + "`npx create-*` wizard" cho AI agents — viết một lần, validate/test được, rồi cài đặt/generate thân thiện theo tool người dùng đang có.

### 1.1 Định hướng Hybrid so với Agent Skills CLI

Agent Skills CLI (`npx skills`, `gh skill`) giải rất tốt bài toán **discover/install**: chọn skill, detect agent host, rồi copy vào `.claude/skills/`, `.cursor/skills/`, `.github/skills/`... Dự án này không nên thay thế hoàn toàn bằng mô hình đó, vì bài toán chính rộng hơn một skill đơn lẻ: chuẩn hóa một **agent catalog SDLC có phase, template, policy, adapter contract, generated manifest và test suite**.

Định hướng chốt:

- Không pivot khỏi canonical YAML/build engine.
- Thêm wizard installer để onboarding ngắn như Agent Skills CLI.
- Có thể thêm output target dạng Agent Skills (`SKILL.md`) trong Phase 2 để tương thích ecosystem, nhưng vẫn giữ `agents/*.yaml` là source of truth.
- Tách rõ command cho user cuối (`npx sdlc-agents init`) và command cho maintainer (`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm sdlc validate`, `pnpm sdlc build`).

Trade-off:

| Hướng | Ưu | Nhược |
|---|---|---|
| Build engine hiện tại | Deterministic, test được, source of truth rõ, adapter output đồng nhất | UX cài đặt dài, giống dev tool hơn consumer tool |
| Agent Skills CLI thuần | UX cực ngắn, hợp ecosystem, detect host tốt | Khó biểu diễn đầy đủ SDLC catalog + template/policy/build contract nếu chỉ copy skill files |
| Hybrid | Giữ nền kỹ thuật chắc và có UX cài đặt tốt | Cần thêm wizard, host detection, install scope, update/pin flow |

---

## 2. Problem Statement

### 2.1 Hiện trạng
- Mỗi developer/team tự viết prompt, custom instructions, agent config riêng → chất lượng không đồng đều, trùng lặp công sức.
- Mỗi AI tool có format cấu hình riêng:
  - Claude Code: `CLAUDE.md`, `.claude/agents/*.md`, `.claude/skills/`, slash commands, hooks, MCP
  - GitHub Copilot: `.github/copilot-instructions.md`, `.github/prompts/*.prompt.md`, custom agents
  - Codex CLI: `AGENTS.md`
  - Cursor: `.cursorrules`, `.cursor/rules/*.mdc`
  - Gemini CLI: `GEMINI.md`
- Kiến thức nghiệp vụ/quy trình của công ty (coding standard, review checklist, định dạng tài liệu) không được nhúng nhất quán vào AI workflow.
- Không có cơ chế versioning, testing, phân phối cho prompt/agent.

### 2.2 Bài toán cần giải
> Làm sao để **viết agent một lần**, **dùng được trên mọi AI tool**, **phủ đủ các phase SDLC**, và **phân phối/cập nhật dễ dàng** cho nhiều team?

---

## 3. Goals & Non-Goals

### 3.1 Goals (MVP → v1.0)
| # | Goal | Đo lường |
|---|------|----------|
| G1 | Bộ agent phủ tối thiểu 6 phase SDLC (Requirement → Maintain) | ≥ 12 agents hoạt động được |
| G2 | **Universal-first**: build ra chuẩn mở AGENTS.md chạy được trên MỌI AI agent (Codex, Cursor, Windsurf, Gemini, Antigravity, Zed, Cline...) + native adapter cho tool có format riêng mạnh hơn (Claude Code, Copilot...) | Tầng Universal phủ 100% tools; thêm native adapter mới < 1 tuần |
| G3 | Cài đặt 1 lệnh qua interactive wizard | `npx sdlc-agents init` xong < 2 phút; người dùng không phải nhớ `validate`/`build` |
| G4 | Cho phép customize ở mọi cấp độ (override prompt, workflow, template, thêm agent riêng) mà không fork toàn bộ | Customization model 4 cấp (mục 7) |
| G5 | Versioning + changelog + update mechanism | Semantic versioning, `update` command |

### 3.2 Non-Goals (phase đầu KHÔNG làm)
- ❌ Không build AI model riêng / fine-tune model.
- ❌ Không build IDE plugin/extension riêng (tận dụng tool sẵn có).
- ❌ Không làm orchestration platform chạy multi-agent tự động 24/7 (đó là sản phẩm khác — có thể là phase 3).
- ❌ Không xử lý billing/license của các AI tool bên dưới.

---

## 4. Personas & Use Cases

| Persona | Nhu cầu | Use case ví dụ |
|---------|---------|----------------|
| **Developer** | Code nhanh, đúng convention | Gọi `@code-agent` để implement feature theo plan, tự chạy TDD workflow |
| **Tech Lead / SA** | Chuẩn hoá thiết kế, review | `@design-agent` sinh ADR/HLD theo template công ty; `@review-agent` review PR theo checklist |
| **BA / PO** | Viết requirement chuẩn | `@requirement-agent` chuyển ý tưởng thô → user story + acceptance criteria |
| **QA Engineer** | Sinh test case/test script | `@test-agent` sinh test plan, unit/integration test từ spec |
| **DevOps** | CI/CD, release | `@devops-agent` sinh pipeline config, release notes, rollback plan |
| **Engineering Manager** | Áp quy trình cho nhiều team | Cài bộ agents chung, customize theo từng team qua config |

---

## 5. Product Scope — Agent Catalog

Bộ agents được tổ chức theo phase SDLC. Mỗi agent gồm: **system prompt, workflow (các bước bắt buộc), input/output template, checklist, ví dụ few-shot**.

### Phase 1 — Planning & Requirement
| Agent | Chức năng |
|-------|-----------|
| `requirement-analyst` | Phỏng vấn user, làm rõ yêu cầu mơ hồ → BRD/PRD, user stories, acceptance criteria (Gherkin) |
| `estimation-agent` | Break down epic → tasks, ước lượng effort, identify dependency & risk |

### Phase 2 — Design
| Agent | Chức năng |
|-------|-----------|
| `solution-architect` | Sinh HLD/LLD, ADR (Architecture Decision Record), so sánh trade-off công nghệ |
| `api-designer` | Thiết kế API contract (OpenAPI/Protobuf), data model, ERD |
| `ux-reviewer` | Review wireframe/flow theo heuristics (optional, phase sau) |

### Phase 3 — Implementation
| Agent | Chức năng |
|-------|-----------|
| `planner` | Đọc spec → sinh implementation plan chia phase, mỗi bước có verify criteria |
| `coder` | Implement theo plan, tuân thủ convention được inject từ config, TDD-first |
| `refactor-agent` | Phát hiện code smell, đề xuất & thực hiện refactor an toàn |

### Phase 4 — Testing
| Agent | Chức năng |
|-------|-----------|
| `test-strategist` | Sinh test plan, test matrix, coverage strategy |
| `test-generator` | Sinh unit/integration/E2E test code từ source + spec |
| `bug-triager` | Phân tích bug report, reproduce, root-cause analysis (systematic debugging workflow) |

### Phase 5 — Review & Release
| Agent | Chức năng |
|-------|-----------|
| `code-reviewer` | Review PR theo checklist công ty: security, performance, correctness, convention |
| `security-auditor` | Quét OWASP top 10, secrets, dependency vulnerabilities |
| `release-manager` | Sinh release notes, deploy checklist, rollback plan |

### Phase 6 — Operate & Maintain
| Agent | Chức năng |
|-------|-----------|
| `incident-responder` | Hướng dẫn triage incident, viết postmortem blameless |
| `doc-writer` | Sinh/cập nhật README, runbook, API docs, onboarding guide |
| `tech-debt-auditor` | Quét và ưu tiên hoá technical debt |

> **MVP scope đề xuất:** `requirement-analyst`, `solution-architect`, `planner`, `coder`, `test-generator`, `code-reviewer` (6 agents, đủ một vòng SDLC tối thiểu).

---

## 6. System Architecture

### 6.1 Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────┐
│                  CANONICAL LAYER (source of truth)       │
│  agents/*.yaml  — định nghĩa agent tool-agnostic         │
│  skills/*.md    — workflow/quy trình chi tiết            │
│  templates/*.md — template output (ADR, PRD, test plan)  │
│  policies/*.yaml — convention, checklist của org/team    │
└────────────────────────┬────────────────────────────────┘
                         │
                ┌────────▼────────┐
                │   BUILD ENGINE  │  (CLI: compile + validate)
                │  - schema check │
                │  - lint prompts │
                │  - render       │
                └────────┬────────┘
                         │
      ┌──────────────────┴───────────────────────┐
      ▼                                          ▼
┌─────────────────────────┐   ┌─────────────────────────────────────┐
│ TẦNG 0: UNIVERSAL       │   │ TẦNG 1: NATIVE ADAPTERS (optional)  │
│ (luôn build, mọi tool)  │   │                                     │
│                         │   │ claude-code  copilot  cursor        │
│ AGENTS.md + .sdlc/      │   │ windsurf     gemini   cline/roo ... │
└────────────┬────────────┘   └────────┬────────────────────────────┘
             ▼                         ▼
  Codex, Windsurf, Antigravity,   .claude/agents/  .github/prompts/
  Zed, Amp, Gemini CLI, Jules,    .cursor/rules/   .windsurf/rules/
  Devin, + mọi tool tương lai     GEMINI.md        ...
```

### 6.2 Thành phần chính

**1. Canonical Agent Definition (DSL)** — file YAML/Markdown frontmatter, ví dụ:

```yaml
# agents/code-reviewer.yaml
id: code-reviewer
version: 1.2.0
phase: review
description: Review PR theo checklist bảo mật, hiệu năng, convention
model_hint: high-reasoning        # adapter tự map sang model của tool
model_variants:                   # (optional) tinh chỉnh prompt theo từng model/agent
  claude: { prompt_append: "Dùng extended thinking cho bước phân tích." }
  gemini: { prompt_append: "Trình bày kết luận trước, chi tiết sau." }
tools_required: [read_file, grep, git_diff]
inputs:
  - name: pr_diff
    required: true
workflow:
  - step: Đọc toàn bộ diff, phân loại file thay đổi
  - step: Chạy checklist security (ref: policies/security-checklist.yaml)
  - step: Chạy checklist convention (ref: policies/{{team}}/conventions.yaml)
  - step: Output theo template templates/review-report.md
output_template: templates/review-report.md
policies: [security-checklist, conventions]
```

**2. Build Engine (CLI)** — trách nhiệm:
- Validate schema (JSON Schema cho agent definition).
- Resolve references (policies, templates, skills).
- Merge config nhiều lớp **base → org → team → project → local** (5 lớp, xem mục 7.3).
- Render ra format từng tool qua adapter.
- Lint prompt (độ dài, từ cấm, placeholder chưa resolve).

**2b. Installer / Wizard UX** — trách nhiệm:
- Detect hoặc hỏi người dùng đang dùng AI host nào: Claude Code, Cursor, Copilot, Codex, Windsurf, Gemini...
- Cho chọn preset agents: full SDLC, planning+coding, review+testing, hoặc custom.
- Cho chọn scope: project-local generated files hay user-global skills/prompts nếu host hỗ trợ.
- Sinh `sdlc.config.yaml`, chạy validation và build lần đầu.
- Giữ các lệnh dev (`validate`, `build`, `test`, `typecheck`, `lint`) cho maintainer, không bắt user cuối chạy từng lệnh.

**3. Adapters — chiến lược 2 tầng: Universal baseline + Progressive enhancement**

> **Nguyên tắc:** mọi tool đều dùng được ngay qua tầng Universal; tool nào có format native mạnh hơn thì adapter riêng "nâng cấp" trải nghiệm. Tool mới ra mắt → tự động được hỗ trợ ở tầng Universal mà không cần code thêm.

**Tầng 0 — Universal Adapter (`universal`) — LUÔN được build, là ưu tiên số 1:**

Dựa trên chuẩn mở **AGENTS.md** (https://agents.md) — chuẩn de-facto đã được OpenAI Codex, Cursor, Windsurf, Gemini CLI, Google Antigravity, Zed, Amp, Roo Code, Cline, Jules, Devin, Factory... cùng hỗ trợ:

```
AGENTS.md                      # entry point chuẩn mở — mọi tool đọc được
.sdlc/                         # plain-markdown, tool-agnostic
├─ agents/                     # mỗi agent = 1 file Markdown thuần
│  ├─ planner.md
│  ├─ coder.md
│  └─ code-reviewer.md
├─ workflows/                  # quy trình từng phase
├─ templates/                  # template output (ADR, PRD, ...)
└─ policies/                   # checklist, conventions
```

- `AGENTS.md` chứa: hướng dẫn chung + **bảng chỉ mục trỏ tới `.sdlc/agents/*.md`** ("khi cần review PR, đọc và làm theo `.sdlc/agents/code-reviewer.md`").
- Vì chỉ là Markdown thuần + đường dẫn tương đối, **bất kỳ AI agent nào đọc được file** (kể cả tool chưa ra đời) đều dùng được — đây là tầng đảm bảo "support mọi AI agent".
- Hỗ trợ per-directory `AGENTS.md` cho monorepo (chuẩn cho phép nested).

**Tầng 1 — Native Adapters (progressive enhancement):**

| Adapter | Output native | Lợi ích thêm so với Universal |
|---------|---------------|-------------------------------|
| `claude-code` | `CLAUDE.md`, `.claude/agents/*.md`, `.claude/skills/`, `.claude/commands/`, hooks | Subagent thật (context riêng), slash commands, auto-trigger skills, hooks |
| `copilot` | `.github/copilot-instructions.md`, `.github/prompts/*.prompt.md`, `.github/agents/*.md` | Prompt files gọi nhanh, Copilot coding agent trên GitHub.com |
| `cursor` | `.cursor/rules/*.mdc` | Rule scoping theo glob, auto-attach theo file đang mở |
| `windsurf` | `.windsurf/rules/*.md`, `.windsurf/workflows/*.md` | Cascade workflows, rule activation modes |
| `gemini` | `GEMINI.md` (+ trỏ về `.sdlc/`) | Tích hợp Gemini CLI native |
| `antigravity` | `AGENTS.md` (dùng chung Universal) + `.agent/` config nếu có | Antigravity đọc trực tiếp AGENTS.md |
| `codex` | `AGENTS.md` (dùng chung Universal) + `~/.codex/prompts/` | Custom prompts cho Codex CLI |
| `cline` / `roo` | `.clinerules/`, `.roo/rules/` | Rule theo mode (architect/code/debug) |
| `zed` / `amp` / khác | `AGENTS.md` (dùng chung Universal) | Không cần adapter riêng |

- Tool nằm trong nhóm "dùng chung Universal" → **chi phí hỗ trợ = 0** (chỉ cần ghi nhận trong docs + contract test).
- Adapter native chỉ viết khi tool có cơ chế riêng đáng giá (subagents, slash commands, rule scoping...).
- Cả 2 tầng build từ **cùng một nguồn canonical** → nội dung đồng nhất, chỉ khác cách đóng gói.

**4. Config Layer (customization không cần fork):**
```
sdlc-agents.config.yaml      # tại root project của team
├─ extends: "@org/sdlc-agents-base"
├─ targets: [universal, claude-code, copilot]
├─ agents: { enable: [...], disable: [...] }
├─ policies:
│   conventions: ./team-conventions.yaml   # override
└─ variables: { language: vi, stack: "java-spring" }
```

**5. Distribution:**
- npm package (`npx sdlc-agents init|build|update`) — hoặc Git template repo cho team không dùng Node.
- Interactive wizard là entrypoint mặc định cho user cuối; non-interactive flags vẫn cần cho CI/automation.
- Claude Code plugin marketplace format (bonus cho Claude users).
- Registry nội bộ (Git repo + tags) cho enterprise.

### 6.3 Luồng sử dụng (Developer Journey)

```
1. npx sdlc-agents init
   → wizard hỏi: tool nào? agents nào? project-local hay user-global? language/team variables?
   → sinh sdlc.config.yaml + build lần đầu

2. Files được generate vào repo (.claude/, .github/, ...)
   → commit vào git như code bình thường

3. Dev dùng agent trong tool quen thuộc:
   Claude Code:  /plan "thêm tính năng X"   → planner agent
   Copilot:      @workspace /review-pr      → code-reviewer prompt

4. Org cập nhật bộ agents (vd: checklist security mới)
   → npx sdlc-agents update → re-build → PR tự động
```

---

## 7. Customization & Extensibility Model

> **Nguyên tắc thiết kế:** "Convention over configuration, but everything is overridable."
> Người dùng mới: chạy 1 lệnh là dùng được ngay (zero-config). Người dùng nâng cao: tùy chỉnh được **từng dòng prompt** mà không bao giờ phải fork repo gốc.

### 7.1 Bốn cấp độ tùy chỉnh (Progressive Customization)

Người dùng đi từ cấp 1 → 4 theo nhu cầu, không bắt buộc học hết:

| Cấp | Tên | Người dùng làm gì | Effort |
|-----|-----|-------------------|--------|
| **L1** | **Configure** | Bật/tắt agents, set variables (`stack`, `language`, `team`) trong config | 5 phút |
| **L2** | **Override** | Thay thế từng phần: policies, templates, checklist, từng `step` trong workflow | 30 phút |
| **L3** | **Extend** | Viết agent mới của riêng dự án, kế thừa (`extends`) agent có sẵn | 1–2 giờ |
| **L4** | **Plug-in** | Viết adapter cho tool mới, hook vào build pipeline, publish preset cho team khác dùng | 1–2 ngày |

### 7.2 L1 — Configure: zero-code, chỉ sửa config

```yaml
# sdlc-agents.config.yaml
extends: "@org/sdlc-agents-base"        # hoặc preset cộng đồng: "@sdlc-agents/preset-fintech"
targets: [universal, claude-code, copilot]   # universal luôn nên có — phủ mọi tool còn lại

variables:
  language: vi                          # ngôn ngữ output của agents
  stack: nestjs-postgres
  team: payment-squad

agents:
  enable: [planner, coder, code-reviewer]
  disable: [ux-reviewer]
```

### 7.3 L2 — Override: ghi đè từng phần, merge theo lớp

Cơ chế **deep-merge có thứ tự ưu tiên** (giống cách ESLint/Tailwind config hoạt động):

```
Base package (@org/sdlc-agents-base)     ← thấp nhất
  ↑ override bởi
Org preset (policies chuẩn công ty)
  ↑ override bởi
Team preset (convention của team)
  ↑ override bởi
Project config (sdlc-agents.config.yaml) ← cao nhất
  ↑ override bởi
Local overrides (sdlc-agents.local.yaml — gitignored, cho cá nhân thử nghiệm)
```

Override chi tiết đến mức **từng step của workflow** — không phải thay cả agent:

```yaml
# overrides/code-reviewer.yaml
agent: code-reviewer
patch:
  workflow:
    insert_after: "Chạy checklist security"
    step: "Kiểm tra naming theo quy ước payment-squad (ref: ./our-naming.md)"
  output_template: ./our-review-template.md   # chỉ thay template, giữ nguyên prompt
  prompt_append: |                            # nối thêm, không thay thế
    Luôn kiểm tra idempotency cho mọi API thanh toán.
```

Ba toán tử patch được hỗ trợ: `replace` (thay hẳn), `append`/`prepend` (nối thêm), `insert_after`/`insert_before` (chèn vào workflow). Build engine validate patch — nếu base agent đổi cấu trúc ở version mới, patch không apply được sẽ **báo lỗi rõ ràng thay vì silently bỏ qua**.

### 7.4 L3 — Extend: tạo agent riêng bằng kế thừa

```yaml
# .sdlc-agents/agents/migration-reviewer.yaml  (agent riêng của dự án)
id: migration-reviewer
extends: code-reviewer            # kế thừa toàn bộ workflow + checklist
version: 1.0.0
description: Review riêng cho database migration scripts
prompt_append: |
  Tập trung vào: backward compatibility, lock time, rollback script.
workflow:
  append:
    - step: Kiểm tra migration có rollback script tương ứng
policies: [security-checklist, db-migration-rules]   # thêm policy riêng
```

- Agent local đặt trong `.sdlc-agents/agents/` của project — được build cùng agents gốc, cùng pipeline, cùng validate.
- Có thể `extends` nhiều tầng (org agent → team agent → project agent).
- **Composition qua skill:** agent có thể tham chiếu skill dùng chung (`skills/tdd-workflow.md`) — sửa skill một chỗ, mọi agent dùng skill đó được cập nhật.

### 7.5 L4 — Plug-in: mở rộng chính hệ thống

**a) Adapter interface** — thêm tool mới không sửa core:

```typescript
// Adapter là 1 npm package implement interface này
interface ToolAdapter {
  name: string;                                   // "windsurf", "zed", ...
  render(agents: ResolvedAgent[], ctx: BuildContext): OutputFile[];
  validate?(output: OutputFile[]): Diagnostic[];  // contract test với format tool
}
```
Đăng ký qua config: `adapters: ["@myorg/sdlc-adapter-windsurf"]`.

**b) Build hooks** — chèn logic vào pipeline:

```yaml
hooks:
  pre-build: ./scripts/fetch-latest-conventions.sh   # vd: kéo convention từ Confluence
  post-build: ./scripts/notify-slack.sh
  transform: ./scripts/inject-jira-context.js        # sửa agent đã resolve trước khi render
```

**c) Preset publishing** — đóng gói toàn bộ customization (agents + overrides + policies) thành npm package để team khác `extends`. Đây là cơ chế **contribution model**: team giỏi về security publish `@org/preset-security-strict`, team khác dùng lại.

### 7.6 Escape hatch — không bao giờ bị kẹt

| Tình huống | Lối thoát |
|------------|-----------|
| DSL không biểu diễn được thứ cần | Block `tool_specific:` trong agent — viết raw content cho riêng 1 tool, các tool khác bỏ qua |
| Muốn sửa trực tiếp file output | `eject` mode: `npx sdlc-agents eject code-reviewer` — copy file generated thành file thường, đánh dấu `managed: false`, build sau không ghi đè |
| File generated bị sửa tay ngoài ý muốn | Build engine chèn header `# generated — do not edit` + lệnh `diff` cảnh báo drift giữa source và output |
| Cần quay về mặc định | `npx sdlc-agents reset <agent>` — xoá override, về base |

### 7.7 Ràng buộc thiết kế để giữ flexibility bền vững

1. **Mọi customization nằm ngoài package gốc** (trong repo của user) → update version mới không mất tùy chỉnh.
2. **Patch-based thay vì copy-based**: override chỉ chứa phần khác biệt → khi base cải tiến prompt, user hưởng cải tiến mà vẫn giữ tùy chỉnh riêng.
3. **Validate sớm, fail rõ ràng**: mọi override/extend đều qua schema validation lúc build; lỗi chỉ ra đúng file + dòng.
4. **`npx sdlc-agents doctor`**: lệnh chẩn đoán cho biết config đang merge từ những lớp nào, override nào đang active, override nào mồ côi (trỏ tới agent đã bị xoá).

---

## 8. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Định nghĩa agent bằng DSL chuẩn (YAML + Markdown), có JSON Schema validate | Must |
| FR-02 | **Universal adapter (AGENTS.md + `.sdlc/`)** — output chuẩn mở dùng được trên mọi AI agent | Must |
| FR-02b | Native adapters đợt đầu: Claude Code, Copilot | Must |
| FR-03 | CLI + Hybrid installer UX: interactive `init`, `build`, `update`, `list`, `validate`, `doctor`, `eject`, `reset`; non-interactive flags cho CI | Must |
| FR-04 | Config override nhiều lớp (base → org → team → project → local), deep-merge có thứ tự ưu tiên | Must |
| FR-05 | Bộ 6 agents MVP hoạt động end-to-end | Must |
| FR-06 | Patch-based override: `replace`/`append`/`insert_after` từng phần agent (prompt, workflow step, template) | Must |
| FR-07 | Agent kế thừa: `extends` agent có sẵn, agent local trong `.sdlc-agents/agents/` | Must |
| FR-08 | Escape hatch: `tool_specific` block + `eject`/`reset` command | Should |
| FR-09 | Versioning theo SemVer, changelog tự động; patch fail rõ ràng khi base đổi cấu trúc | Should |
| FR-10 | Template variables ({{team}}, {{stack}}, {{language}}) | Should |
| FR-11 | Adapter plugin interface (npm package) + build hooks (pre/post/transform) | Should |
| FR-12 | `doctor` command: hiển thị layer merge, override active/mồ côi | Should |
| FR-13 | Preset publishing: đóng gói customization thành package cho team khác `extends` | Could (v1.1) |
| FR-14 | Native adapters đợt 2: Cursor, Windsurf, Gemini, Cline/Roo (Codex/Antigravity/Zed/Amp đã chạy qua Universal) | Could (v1.1) |
| FR-15 | Eval harness: test chất lượng output agent tự động | Could (v1.1) |
| FR-16 | Web catalog/docs site để browse agents | Could (v1.2) |

## 9. Non-Functional Requirements

| ID | Requirement | Tiêu chí |
|----|-------------|----------|
| NFR-01 | **Portability** | Không phụ thuộc runtime đặc thù; output là plain text files commit được vào git |
| NFR-02 | **Idempotency** | `build` chạy lại cho output giống hệt (deterministic) — diff sạch trong PR |
| NFR-03 | **Security** | Không chứa secrets trong agent files; lint chặn pattern nhạy cảm; policies file có thể đánh dấu `internal-only` |
| NFR-04 | **Maintainability** | Thêm 1 agent mới chỉ cần thêm 1 file YAML + templates, không sửa engine |
| NFR-05 | **Extensibility** | Adapter là plugin interface — bên thứ ba viết adapter mới không sửa core |
| NFR-06 | **Backward compat** | Update minor version không phá config của team |
| NFR-07 | **Offline-friendly** | Build engine chạy local, không gọi network (trừ `update`) |

---

## 10. Tech Stack đề xuất

| Layer | Lựa chọn | Lý do |
|-------|----------|-------|
| **CLI / Build engine** | **TypeScript + Node.js** (commander/clack cho CLI) | Hệ sinh thái npm để phân phối; team dev nào cũng chạy được `npx`; dễ viết adapter render text |
| **Schema validation** | JSON Schema + `ajv` / Zod | Validate agent definitions, config |
| **Template rendering** | Handlebars hoặc Eta | Render template với variables, an toàn, đơn giản |
| **Agent definitions** | YAML + Markdown | Human-readable, review được trong PR, không cần tooling đặc biệt |
| **Testing** | Vitest (unit cho engine/adapters) + snapshot tests cho output | Output là text → snapshot test rất hợp |
| **Eval (v1.1)** | promptfoo hoặc tự build harness gọi Claude API chấm điểm output | Đo chất lượng agent khi sửa prompt |
| **CI/CD** | GitHub Actions: lint → test → build → publish npm | Chuẩn industry |
| **Docs site (v1.2)** | VitePress / Docusaurus | Catalog agents, hướng dẫn |
| **Distribution** | npm (public/private registry) + Git tags | `npx sdlc-agents init` cho user cuối, versioning/update qua npm tags |

> **Lưu ý:** sản phẩm này **không cần backend/database** ở MVP. Toàn bộ là static files + CLI. Đây là lợi thế lớn: chi phí vận hành ≈ 0.

### 10.1 Toolchain chi tiết trong quá trình dev

**Core development:**
| Tool/Lib | Vai trò | Ghi chú |
|----------|---------|---------|
| Node.js ≥ 20 LTS + TypeScript 5.x | Runtime + ngôn ngữ | strict mode |
| pnpm workspaces | Monorepo (`core`, `cli`, `adapters/*`) | Nhẹ hơn turborepo, đủ cho scale này |
| `commander` | CLI framework (parse lệnh, flags) | Chuẩn industry |
| `@clack/prompts` | Interactive wizard cho `init` | UX đẹp, nhẹ |
| `zod` | Schema validation cho DSL + config | Type-safe, error message tốt; sinh JSON Schema qua `zod-to-json-schema` cho editor autocomplete |
| `yaml` (eemeli/yaml) | Parse YAML giữ comment + vị trí dòng | Cần vị trí dòng để báo lỗi "file X dòng Y" |
| `gray-matter` | Parse Markdown frontmatter | Cho skills/templates |
| Handlebars hoặc `eta` | Render template với variables | Logic-less, an toàn |
| `deepmerge-ts` / custom merger | Deep-merge config nhiều lớp | Cần kiểm soát thứ tự ưu tiên + array strategy |
| `tsup` | Bundle CLI thành ESM/CJS | Zero-config |

**Quality & release:**
| Tool/Lib | Vai trò |
|----------|---------|
| Vitest | Unit test engine/adapters + **snapshot test** toàn bộ output (output là text → snapshot là cách test rẻ và chắc nhất) |
| Biome (thay ESLint+Prettier) | Lint + format, 1 tool duy nhất, nhanh |
| `markdownlint` + link checker (`lychee`) | Lint nội dung agents/skills/templates — đây là "source code" thật của sản phẩm |
| Changesets | Versioning SemVer + changelog tự động + publish npm |
| Lefthook | Git hooks (lint trước commit) |
| GitHub Actions | CI: lint → test → snapshot → build → publish |

**Eval, trace & observability (quan trọng — prompt là code, phải test được):**
| Tool/Lib | Vai trò | Khi nào |
|----------|---------|---------|
| **promptfoo** | Eval harness: chạy agent prompts qua nhiều model (Claude/GPT/Gemini), assert output theo rubric, so sánh trước/sau khi sửa prompt, chạy trong CI | Phase 2 |
| **Langfuse** (self-host, open source) | **Trace** từng lần chạy eval: prompt → response → score, theo dõi regression chất lượng theo version | Phase 2 |
| Anthropic/OpenAI/Gemini SDK | Gọi model trong eval harness (chỉ dùng cho testing, KHÔNG phải runtime của sản phẩm) | Phase 2 |
| Golden test cases | Bộ input/output mẫu cho từng agent (vd: 1 PR diff mẫu → review report kỳ vọng) | Phase 1, mỗi agent ≥ 3 cases |
| OpenTelemetry (opt-in) | Telemetry CLI: lệnh nào được chạy, adapter nào được build (ẩn danh, opt-in) — đo adoption thực tế | Phase 3 |

**Compatibility testing (đặc thù của sản phẩm này):**
| Tool | Vai trò |
|------|---------|
| Claude Code headless (`claude -p`), Copilot CLI, Gemini CLI chạy trong CI | Contract test: output build ra có được tool thật load đúng không |
| Docker images chứa từng tool | Môi trường test tái lập được cho compatibility matrix |

---

## 11. Roadmap & Milestones

### Phase 0 — Foundation (Tuần 1–2)
- [x] Chốt DSL schema cho agent definition (spike: viết tay 2 agents — `planner` + `code-reviewer`, render thử sang Claude Code + Universal format — output valid ✅)
- [x] Setup repo, CI, cấu trúc monorepo (`packages/core`, `packages/cli`, `packages/adapters/*`, `agents/`, `templates/`, `policies/`)
- [x] Viết Zod schema + validator (tự động fail rõ ràng nếu agent YAML sai)
- [ ] Setup CI (GitHub Actions: lint → typecheck → spike test)
- [ ] Viết unit test cho schema validator (Vitest)

**Spike findings (Q6 answer):**
- Claude Code: `description` field trong frontmatter → auto-routing hoạt động ngay, không cần thêm gì
- Universal (AGENTS.md): trigger là instruction thủ công hoặc user nói tên agent; không có auto-routing — đây là ceiling của tầng Universal, và là acceptable tradeoff so với coverage 20+ tools

### Phase 1 — MVP (Tuần 3–6)
- [ ] Build engine + adapter `universal` (AGENTS.md — ưu tiên cao nhất) + adapter `claude-code` + adapter `copilot`
- [ ] CLI `init` / `build` / `validate`
- [ ] 6 agents MVP (mục 5) với prompt + workflow + template hoàn chỉnh
- [ ] Dogfood: chính team dùng bộ agents này để phát triển tiếp dự án
- [ ] **Exit criteria:** 1 team pilot ngoài team dev cài và dùng được trong 1 sprint

### Phase 2 — Hardening (Tuần 7–10)
- [ ] Customization đầy đủ: multi-layer override, patch-based override, `extends` agent, local agents
- [ ] Escape hatch: `tool_specific`, `eject`/`reset`, drift detection + `doctor` command
- [ ] CLI `update` + changelog + SemVer release flow
- [ ] Snapshot test toàn bộ output, eval harness cơ bản
- [ ] Bổ sung agents: `test-strategist`, `security-auditor`, `release-manager`
- [ ] **Exit criteria:** 3 teams sử dụng, NPS khảo sát ≥ 7

### Phase 3 — Scale (Quý sau)
- [ ] Native adapters đợt 2: Cursor, Windsurf, Gemini CLI, Cline/Roo
- [ ] Compatibility matrix công khai: tool nào chạy Universal, tool nào có native adapter, test định kỳ
- [ ] Docs site + agent catalog
- [ ] Telemetry opt-in (agent nào được dùng nhiều)
- [ ] Marketplace/registry nội bộ; cho phép team đóng góp agent ngược lại (contribution model)

---

## 12. Success Metrics

| Metric | Target (3 tháng sau release) |
|--------|------------------------------|
| Số team adopt | ≥ 3 teams |
| Time-to-setup cho team mới | < 30 phút (từ 0 → dùng được) |
| Tỷ lệ agent được dùng hàng tuần | ≥ 60% bộ MVP agents |
| Giảm thời gian viết tài liệu (PRD/ADR/test plan) | ≥ 40% (khảo sát) |
| PR có review-agent chạy trước human review | ≥ 70% |

---

## 13. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | Các AI tool **thay đổi format config liên tục** (Claude Code, Copilot update nhanh) | Cao | Cao | Adapter pattern cô lập thay đổi; contract test theo từng tool version; theo dõi changelog các tool |
| R2 | **Lowest common denominator**: feature mạnh của 1 tool (vd: hooks, MCP của Claude Code) không map được sang tool khác | Cao | Trung bình | DSL có section `tool_specific` cho phép khai báo phần riêng từng tool; không ép 100% portable |
| R3 | Chất lượng output agent không ổn định giữa các model | Trung bình | Cao | Eval harness + golden test cases; `model_hint` trong DSL |
| R4 | Team không adopt vì "thêm một thứ phải học" | Trung bình | Cao | `init` 1 lệnh, zero-config mặc định; dogfooding + champion tại mỗi team |
| R5 | Prompt chứa thông tin nội bộ bị leak khi commit public | Thấp | Cao | Lint rule + `.gitignore` guidance + phân tách policies internal |
| R6 | Scope creep sang orchestration platform | Trung bình | Trung bình | Non-goals rõ ràng (mục 3.2); review scope mỗi milestone |
| R7 | **Supply-chain prompt injection**: skill import từ cộng đồng (mục 15.2) có thể chứa chỉ dẫn độc hại/ẩn — vendored content trở thành "code chạy trong agent" của mọi team dùng bộ này | Thấp | **Rất cao** | Human review bắt buộc khi vendor lần đầu + khi bump pin; diff review giữa 2 pin; lint scan pattern đáng ngờ (exfiltration URL, lệnh shell ẩn); pin theo commit hash, không pin theo branch/tag mutable |

---

## 14. Open Questions (cần chốt trước Phase 0)

1. ~~**Ngôn ngữ prompt:**~~ ✅ **CHỐT:** Prompt viết tiếng Anh (chất lượng model tốt hơn); output template theo config `language` (default `en`, có thể set `vi`).
2. ~~**Tool ưu tiên thứ 2:**~~ ✅ **CHỐT:** **GitHub Copilot** — native adapter Phase 1 là Claude Code + Copilot.
3. **OSS vs Private — kiến trúc khác nhau ở 3 điểm cốt lõi:**

   | Chiều ảnh hưởng | Open Source | Private-only |
   |---|---|---|
   | **Plugin interface** | Phải stable, versioned, documented — trở thành public API; breaking change buộc major bump | Internal-only, có thể refactor tự do |
   | **Policy layer** | Không thể nhúng proprietary policies vào repo chính; cần tách `packages/policies-private` ra ngoài mono | Nhúng trực tiếp vào monorepo, đơn giản hơn |
   | **Adapter code** | Cần E2E docs + compatibility promise vì community sẽ build against nó | Chỉ cần chạy được là xong |

   Build engine + DSL schema + vendor mechanism **code y hệt nhau** dù OSS hay private — không có rủi ro kiến trúc phân kỳ ở lớp đó.

   **Thương mại hoá có nên không?** Raw engine ai cũng build được — đó là lý do chọn đúng mô hình, không phải lý do từ bỏ. **Đề xuất: Open Core.**
   - **OSS (free):** engine core + Universal adapter + agent catalog cơ bản → build community, tăng adoption, nhận contribution adapter từ cộng đồng
   - **Commercial:** hosted policy management (team dashboard, audit log, secret vault), native adapters đầy đủ, eval harness hosted, SLA support, preset marketplace per-industry
   - Precedent: Terraform OSS → HCP, ESLint → enterprise tooling, Biome → enterprise tier
   - **Action item:** quyết định trước Phase 1 (không cần trước Phase 0 spike); nếu chọn OSS thì thiết kế plugin interface như public API ngay từ đầu (semver + deprecation policy) và tách `packages/policies-private` ra khỏi main repo.
4. **Ai own bộ policies chuẩn org?** Cần 1 owner (vd: Engineering Excellence group) duyệt thay đổi checklist/convention.
5. **Mức độ tích hợp MCP:** có ship kèm MCP servers (vd: Jira, Confluence connector) trong bộ này không, hay để phase sau?
6. **Cơ chế trigger trên tầng Universal:** Claude Code có auto-trigger skill theo description, nhưng tool chỉ đọc AGENTS.md thì agent được "gọi" thế nào — dựa vào model tự đọc chỉ mục, hay quy ước lệnh tay (vd: "làm theo `.sdlc/agents/planner.md`")? Cần trả lời bằng spike Phase 0 trên 2-3 tool thật, vì nó quyết định UX của tầng Universal.
7. **Ngân sách eval:** eval harness gọi API model thật (Claude/GPT/Gemini) — ai trả, hạn mức bao nhiêu cho mỗi lần CI chạy? Cần quota để eval không bị bỏ vì tốn tiền.
8. **Pháp lý khi thương mại hoá:** vendor skill MIT/Apache vào sản phẩm bán cho khách thì attribution thế nào là đủ; tên sản phẩm có đụng trademark không? Cần 1 buổi với legal trước khi public.

---

## 15. Định vị so với skill ecosystem & chiến lược tái sử dụng

### 15.1 Khác gì so với các "skill" ngoài kia?

Ngoài kia đã có nhiều bộ skill/rules nổi tiếng (obra/superpowers, anthropics/skills, awesome-claude-code, awesome-cursorrules, agent-rules…). Sản phẩm này **không cạnh tranh ở tầng nội dung skill đơn lẻ** — nó cạnh tranh ở tầng **hệ thống**:

| Tiêu chí | Skill ngoài kia | Agentic SDLC Agents Set |
|----------|-----------------|--------------------------|
| Phạm vi | 1 kỹ năng đơn lẻ (TDD, debug…) | **Bộ hoàn chỉnh phủ cả vòng SDLC**, các agent nối với nhau (output của requirement-analyst là input của planner) |
| Tool support | Khoá vào 1 tool (đa số chỉ Claude Code) | **Một nguồn → build ra mọi tool** (Universal + native adapters) |
| Customization | Fork rồi sửa tay → mất khả năng update | **Patch-based override**, update bản gốc không mất tùy chỉnh |
| Convention công ty | Không có chỗ nhúng | **Policy layer** (org → team → project) nhúng checklist/convention nội bộ |
| Versioning & phân phối | Copy/paste thủ công, không version | SemVer, `update` command, registry, changelog |
| Chất lượng | Không test được | Eval harness + golden cases + snapshot test trong CI |

> **Một câu định vị:** skill ngoài kia là *bài hát lẻ*; sản phẩm này là *hãng phát hành album* — có tuyển chọn, chuẩn hoá, đóng gói đa nền tảng, phân phối và cập nhật.

### 15.2 Tái sử dụng skill có sẵn (build on, not rebuild)

**Chiến lược: KHÔNG viết lại những skill cộng đồng đã làm tốt.** Cơ chế `import` trong build engine:

```yaml
# agents/bug-triager.yaml
id: bug-triager
imports:
  - source: github:obra/superpowers            # skill GitHub star cao
    path: skills/systematic-debugging
    pin: v4.2.0                                # pin version/commit — không trôi theo upstream
    license: MIT                                # build fail nếu license không cho phép
prompt_prepend: |
  Áp dụng quy trình systematic-debugging bên dưới, output bằng {{language}}.
```

- **Vendor + pin**: skill được copy vào `vendor/` lúc build, pin theo tag/commit — build vẫn deterministic và offline-friendly, không phụ thuộc upstream sống chết.
- **License check tự động**: chỉ import skill có license tương thích (MIT/Apache-2.0); ghi attribution vào output.
- **Wrap, không sửa**: nội dung skill gốc giữ nguyên, customize qua `prompt_prepend/append` — khi upstream ra version mới chỉ cần bump `pin` và chạy lại eval.
- **Ứng viên import cho MVP**: systematic-debugging & TDD workflow (superpowers, ~94k+ stars, đã vào Anthropic marketplace), document skills từ anthropics/skills (official, ~135k stars), engineering workflow skills từ mattpocock/skills (124k stars, MIT — xem bảng 15.3), agents lẻ từ VoltAgent/awesome-claude-code-subagents và wshobson/agents. Giảm đáng kể effort viết 6 agents MVP — phần phải tự viết chủ yếu là policies công ty + templates tài liệu tiếng Việt + phần "nối" các agent thành vòng SDLC.

### 15.3 Bảng map skill cộng đồng → Agent Catalog (đã thẩm định 06/2026)

| Agent trong catalog | Skill import (nguồn) | Ghi chú |
|---|---|---|
| `requirement-analyst` | `to-prd`, `grill-me`, `grill-with-docs` (mattpocock) + `brainstorming` (superpowers) | `to-prd` có sẵn template PRD 8 mục (Problem, Solution, User Stories, Implementation/Testing Decisions, Out of Scope) + tự publish lên issue tracker — gần như dùng được ngay |
| `estimation-agent` | `to-issues`, `triage` (mattpocock) | `to-issues` chuyển spec → các GitHub issues độc lập "grabbable" — đúng bài break-down |
| `solution-architect` | `improve-codebase-architecture`, `zoom-out` (mattpocock) + pattern `docs/adr/` của chính repo đó | Repo mattpocock tự dùng ADR — mượn luôn cấu trúc |
| `planner` | `writing-plans`, `executing-plans` (superpowers) + `prototype` (mattpocock) | |
| `coder` | `tdd` (cả superpowers lẫn mattpocock), `subagent-driven-development` (superpowers) | So sánh 2 bản TDD, chọn/merge bản tốt hơn |
| `bug-triager` | `diagnose` (mattpocock) + `systematic-debugging` (superpowers) | Hai workflow debug độc lập cùng triết lý — tín hiệu mạnh là pattern đúng |
| `code-reviewer` | `requesting/receiving-code-review` (superpowers), `git-guardrails`, `setup-pre-commit` (mattpocock) | Wrap thêm checklist công ty qua policy layer |
| `doc-writer` | document skills PDF/DOCX/XLSX/PPTX (anthropics/skills) | Official, production-ready |
| **Cross-cutting (mọi agent)** | `handoff` (mattpocock) — nén context khi chuyển giao agent→agent; `caveman` (mattpocock) — giảm ~75% token output | `handoff` chính là mảnh ghép "nối các agent thành vòng SDLC"; `caveman` đáp ứng pain point token-cost nóng nhất cộng đồng hiện nay |
| **Meta (build engine)** | `write-a-skill` (mattpocock), `writing-skills` (superpowers) | Tham khảo cho chuẩn DSL + guideline đóng góp agent mới |

> Các skill KHÔNG import từ mattpocock/skills (quá cá nhân, ngoài scope): `setup-matt-pocock-skills`, `scaffold-exercises`, `migrate-to-shoehorn`, `teach`.

## 16. Team & Effort ước tính (MVP)

| Role | Số lượng | Trách nhiệm |
|------|----------|-------------|
| Tech Lead / SA | 1 | DSL design, adapter architecture, review |
| Backend/Tooling Dev (TS) | 1–2 | Build engine, CLI, adapters, CI |
| Prompt Engineer / Senior Dev | 1 | Viết & tune 6 agents MVP, eval cases |
| (Part-time) BA/QA | 0.5 | Test agent output với case thực tế, viết docs |

**Tổng effort MVP:** ~6 tuần × 3 người ≈ **18 person-weeks**.

---

## Phụ lục A — Cấu trúc repo đề xuất

```
sdlc-agents/
├─ packages/
│  ├─ core/               # schema, resolver, config merge
│  ├─ cli/                # init/build/update/validate
│  └─ adapters/
│     ├─ claude-code/
│     ├─ copilot/
│     └─ ...
├─ agents/                # canonical agent definitions (YAML)
├─ skills/                # workflow chi tiết (Markdown)
├─ templates/             # output templates (ADR, PRD, ...)
├─ policies/              # checklist, conventions (org defaults)
├─ examples/              # demo project đã build sẵn từng tool
└─ docs/
```

## Phụ lục B — Tham khảo
- Claude Code subagents/skills/plugins: https://docs.claude.com/en/docs/claude-code
- GitHub Copilot customization: https://docs.github.com/en/copilot/customizing-copilot
- AGENTS.md convention (Linux Foundation AAIF, 60k+ repos adopt): https://agents.md
- promptfoo (LLM eval): https://promptfoo.dev
- obra/superpowers (SDLC skill framework, trong Anthropic marketplace): https://github.com/obra/superpowers
- anthropics/skills (official document skills): https://github.com/anthropics/skills
- mattpocock/skills (engineering workflow skills, MIT): https://github.com/mattpocock/skills
- wshobson/agents (multi-harness plugin marketplace — đối thủ tham chiếu): https://github.com/wshobson/agents
- VoltAgent/awesome-claude-code-subagents (100+ subagents): https://github.com/VoltAgent/awesome-claude-code-subagents
