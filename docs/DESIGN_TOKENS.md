# FITAI Triple Lane design tokens

Triple Lane is a light-first operating interface for people who are new to structured exercise or returning after a break. Its memorable element is a three-lane route: Relay Blue is plan and interaction, Sprint Coral is active effort, and Field Green is safe completion and recovery.

## Reference colors

| Name         | Value     | Use                                       |
| ------------ | --------- | ----------------------------------------- |
| Clear white  | `#ffffff` | Primary surface                           |
| Soft paper   | `#f7f8f6` | App canvas                                |
| True ink     | `#101214` | Primary text and strong controls          |
| Graphite     | `#50565c` | Secondary text                            |
| Mist         | `#eceef0` | Quiet surfaces                            |
| Steel        | `#c9cdd1` | Borders and inactive tracks               |
| Relay Blue   | `#4b57f2` | Navigation, planning, primary interaction |
| Sprint Coral | `#ff5a47` | Active workout and effort                 |
| Field Green  | `#25c77a` | Ready, safe, complete, recovered          |

Tint surfaces are `#eef0ff`, `#fff0ed`, and `#eafbf2`. Danger is a separate `#c92f42`; Sprint Coral must not stand in for destructive or injury states.

## Semantic rules

- The neutral chassis owns most of every viewport. Accent color is information, not decoration.
- Blue is the only primary-action color. Coral and green describe context and state.
- All color-coded state also has text, icon, shape, or position.
- No gradients, glow, glassmorphism, or rainbow data visualizations.
- Body text must meet 4.5:1 contrast; controls, icons, and focus indicators must meet 3:1.

## Typography

- Display: Anybody Variable, used for page/session titles only.
- Body: Atkinson Hyperlegible Next.
- Data: Atkinson Hyperlegible Mono for timers and measurements only.
- Mobile display is capped at 40px. Body defaults to 16/24. Utility labels use 12/16 with restrained tracking.

## Space, shape, and depth

- Space follows a 4px base scale.
- Input radius: 10px. Standard surface: 14px. Hero/session surface: 20px.
- Touch targets are at least 48 by 48 CSS pixels.
- A surface uses either a border or an elevation treatment, never both by default.
- Cards are reserved for real content boundaries; sections otherwise use spacing and dividers.

## Motion

- Press: 90ms. Component state: 180ms. Route morph: 360ms.
- Triple Lane convergence is the single authored moment. Other movement is functional and quiet.
- View transitions use transform and opacity; reduced-motion removes positional animation.

## Component tokens

Components consume semantic CSS variables from `src/shared/design-system/tokens.css`. Feature code must not introduce raw brand hex values. Stateful components expose `data-state`; stable subparts expose `data-slot`.
