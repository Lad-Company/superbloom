# Triage Labels

The `triage` skill uses five canonical labels to track issue state:

| Label | Meaning | Next step |
|-------|---------|-----------|
| `needs-triage` | Maintainer needs to evaluate | Run `/triage` to categorize |
| `needs-info` | Waiting on reporter for details | Reporter responds, then `/triage` again |
| `ready-for-agent` | Fully specified, AFK-ready | Assign to an agent (e.g., `impl-agent`, `diagnose`) |
| `ready-for-human` | Needs human decision or implementation | Assign to a person |
| `wontfix` | Out of scope or intentional duplicate | Close issue |

## Customization

If your GitHub repo already uses different label names (e.g. `bug:needs-triage` instead of `needs-triage`), you can edit these mappings. Otherwise, the defaults above are used.

To change a label name globally, edit this file and the `triage` skill will use the updated string in future invocations.
