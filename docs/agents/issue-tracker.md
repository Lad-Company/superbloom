# Issue Tracker

Issues for Superbloom live in **GitHub Issues** at [github.com/Lad-Company/superbloom](https://github.com/Lad-Company/superbloom).

## How skills interact

- **`to-issues`** — Breaks a plan or spec into GitHub issues using the `gh` CLI
- **`to-prd`** — Drafts a PRD and opens a GitHub issue
- **`triage`** — Processes issues through a state machine, applies labels via `gh`
- **`diagnose`**, **`tdd`**, **`improve-codebase-architecture`** — Read from issues for context

## Workflow

1. Create or receive an issue in GitHub
2. Run `/triage` to evaluate and label it
3. Once labeled `ready-for-agent`, an AFK agent can pick it up
4. Agent references the issue in commit messages and PRs

## CLI requirements

The `gh` CLI must be installed and authenticated:
```bash
gh auth login
```

Skills will call commands like `gh issue list`, `gh issue view`, `gh issue create`, and `gh issue edit` automatically.
