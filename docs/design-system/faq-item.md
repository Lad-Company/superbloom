# FAQ Item

> An expandable question / answer row.

- **Figma:** [node 6161-1279](https://www.figma.com/design/qQxcXKwgY7EUJodM1Ypfr5/Superbloom-Library?node-id=6161-1279&m=dev) (documented as "FAQ — Elements")
- **Maps to:** no dedicated component yet; the row used inside [FAQ](./faq.md).

## Description

An expandable row — a question that reveals its answer on tap.

## Usage

- Use inside an FAQ list.
- Keep questions short — one topic per item.

## Functionality

- **Collapsed** (`+`) and **Expanded** (`−`) states.
- Tap toggles the answer; the `+` icon becomes a `−`.
- Inherits page color mode (light / dark) via `--fg` / `--bg`.

### Responsive

- **Desktop (1440):** hairline-topped row ~731px; question `H7` 24px; 44px toggle icon;
  expanded answer `P1` 17px.
- **Mobile (375):** row ~351px; question `H7` 20px; same toggle + answer.

## Implementation status / gaps

Unbuilt. The atomic unit of [FAQ](./faq.md): a hairline-topped row with a `question`
and a collapsible `answer`, plus a `+`/`−` toggle icon. Build accessibly with
`<details>`/`<summary>` or a button with `aria-expanded`. The `+`/`−` icon is a shared
Icon with `plus` / `minus` variants.
