---
name: FITAI Web — Triple Lane
description: A calm, high-clarity training companion that turns planning, effort, and recovery into one visible route.
colors:
  clear-white: "#FFFFFF"
  soft-paper: "#F7F8F6"
  true-ink: "#101214"
  graphite: "#50565C"
  mist: "#ECEEF0"
  steel: "#C9CDD1"
  relay-blue: "#4B57F2"
  sprint-coral: "#FF5A47"
  field-green: "#25C77A"
  blue-tint: "#EEF0FF"
  coral-tint: "#FFF0ED"
  green-tint: "#EAFBF2"
  danger: "#C92F42"
typography:
  display:
    fontFamily: "Anybody Variable, Arial Narrow, sans-serif"
    fontSize: "clamp(2rem, 9vw, 2.5rem)"
    fontWeight: 680
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Atkinson Hyperlegible Next, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  data:
    fontFamily: "Atkinson Hyperlegible Mono, SFMono-Regular, Consolas, monospace"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1
rounded:
  input: "10px"
  surface: "14px"
  hero: "20px"
  round: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.relay-blue}"
    textColor: "{colors.clear-white}"
    rounded: "{rounded.input}"
    padding: "14px 22px"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.clear-white}"
    textColor: "{colors.true-ink}"
    rounded: "{rounded.input}"
    padding: "14px 22px"
    height: "56px"
  hero-surface:
    backgroundColor: "{colors.clear-white}"
    textColor: "{colors.true-ink}"
    rounded: "{rounded.hero}"
    padding: "32px"
---

# Design System: FITAI Web — Triple Lane

## Overview

**Creative North Star: "Triple Lane"**

FITAI feels like a well-marked training route rather than a performance dashboard. Its interface lowers the emotional cost of beginning: clear decisions, plain evidence, generous white space, and one visible next step. Premium quality comes from typographic confidence, disciplined proportion, and exact motion—not ornamental materials.

The three sport lanes encode a real product loop: Relay Blue plans, Sprint Coral carries active effort, and Field Green signals recovery or completion. They may meet only when the full cycle is being explained or when a route transition hands control from one phase to another.

**Key Characteristics:**

- Light, neutral chassis with tightly rationed sport color.
- Condensed, decisive headings paired with highly legible working text.
- Flat sections and dividers before card grids.
- One orchestrated morph sequence; otherwise quiet state feedback.
- Mobile-first controls built for interrupted, one-handed use.

## Colors

The palette is optically clean and emotionally energetic without neon, gradients, or luxury-dark conventions.

### Primary

- **Relay Blue:** The stable interaction color for navigation, planning, selection, focus, and every primary CTA.

### Secondary

- **Sprint Coral:** Active physical effort, the current workout instrument, and contextual movement state. It never means danger.

### Tertiary

- **Field Green:** Completion, readiness, safety, recovery, and positive status. It is paired with text, icons, or shape.

### Neutral

- **Clear White:** Main working surface and focus-ring offset.
- **Soft Paper:** App canvas that separates surfaces without beige warmth.
- **True Ink:** Primary copy, icons, and strong controls.
- **Graphite:** Supporting text and secondary metadata.
- **Mist:** Subtle surface fill and inactive progress track.
- **Steel:** Borders, dividers, and inactive structure.
- **Danger:** Injury and destructive action only; never substitute Sprint Coral.

**The 82/18 Rule.** Keep roughly 82% of each viewport neutral. All accents combined remain supporting material.

**The One Leader Rule.** A screen has one dominant accent: Blue for planning, Coral for effort, Green for recovery. All three coexist only in the signature path or a cycle overview.

**The Semantic Pairing Rule.** Color is never the only state signal; pair it with a label, icon, position, or shape.

## Typography

**Display Font:** Anybody Variable (with Arial Narrow fallback)  
**Body Font:** Atkinson Hyperlegible Next (with Arial fallback)  
**Data Font:** Atkinson Hyperlegible Mono (with SFMono-Regular and Consolas fallbacks)

**Character:** Anybody gives phase and session titles forward momentum through controlled width, while Atkinson keeps instructions legible under physical exertion. The mono face makes changing workout data stable rather than technical-looking.

### Hierarchy

- **Display** (680, responsive up to 40px on product mobile screens, 1.02): Route theses, session names, and completion moments.
- **Headline** (650–680, 20–32px, 1.05): Section and workflow headings.
- **Body** (400, 16px, 1.5): Instructions and explanatory copy, generally held below 65 characters per line.
- **Label** (750, 11–12px, 0.06em): Short utility status only; uppercase is reserved for labels, never session titles.
- **Data** (700, tabular numerals): Timer, reps, weight, RPE, and progress values.

**The Sentence-Case Rule.** Training language reads like clear coaching, not a generic uppercase sports campaign.

**The Stable-Number Rule.** Any value that changes in place uses tabular numerals and the data face.

## Layout

The baseline viewport is 390×844 with safe-area-aware headers and bottom actions. Mobile pages use 20px side gutters, minimum 48px touch targets, and one decision group per viewport. Product screens live inside a 1180px maximum shell on desktop; content reorganizes into purposeful two-column compositions instead of stretching mobile cards.

Use spacing and a one-pixel divider to establish most sections. A bordered or filled surface appears only when content has a real boundary, such as a next session, safety notice, or editable setting. Bottom navigation has exactly four destinations: Home, Roadmap, Progress, and Profile. Live Workout removes it so the set remains the only task.

## Elevation & Depth

The system is flat by default. Canvas/surface contrast, borders, and overlap communicate structure. The single floating shadow is reserved for fixed navigation or an action layer that physically sits above scrolling content; it is never used to turn every section into a card.

**The Flat-at-Rest Rule.** A static content surface earns no shadow. Depth appears only when position or interaction requires it.

## Shapes

Controls use gently squared 10px corners; ordinary bounded surfaces use 14px; hero/session surfaces use 20px. Fully round shapes are semantic instruments: progress markers, status dots, icon buttons, and completion marks. The curved convergence at the end of Triple Lane is the only decorative silhouette.

## Components

### Buttons

- **Shape:** Confident, compact corners with a minimum 48px target; large primary actions are 56px high.
- **Primary:** Relay Blue with white text on every phase so CTA meaning never changes.
- **Hover / Focus:** Darken Blue on hover; press scales to 98.5% for 90ms; keyboard focus uses a 2px Blue ring offset by white.
- **Secondary / Quiet / Danger:** White outlined, transparent, and dedicated Danger variants keep action hierarchy explicit.

### Cards / Containers

- **Corner Style:** 14px for standard surfaces, 20px for the single hero or session focus.
- **Background:** Clear White on Soft Paper; tints only communicate semantic context.
- **Shadow Strategy:** Flat by default, with fine Steel dividers.
- **Internal Padding:** 20–32px, scaled down only for compact mobile controls.

### Inputs / Fields

- **Style:** White surface, Steel stroke, 10px corners, explicit text labels, and no placeholder-only labeling.
- **Focus:** Relay Blue border and visible focus ring.
- **Error / Disabled:** Danger copy names the issue and its recovery; disabled controls remain legible and do not masquerade as completed states.

### Navigation

The app header and four-item bottom navigation stay stable through route morphs. Every navigation icon has a visible label. The active destination uses True Ink plus a short Relay Blue rail; lateral navigation uses a restrained crossfade.

### Triple Lane

Three independently colored rails converge on the next-session marker, then hand visual leadership from Blue to Coral to Green across the workout flow. Transition names are unique per mounted object. The component moves only through transform and opacity, completes route morphs in 360ms, and becomes an immediate crossfade under reduced motion.

### Lane Skeleton

A neutral rail holds layout while one Blue marker travels once to a checkpoint. It never shimmers across the whole screen and always lives inside an `aria-busy` boundary.

## Do's and Don'ts

### Do:

- **Do** make the next safe action obvious within the first viewport.
- **Do** show target and actual workout values together.
- **Do** write from the trainee's side of the screen with consistent action/result copy.
- **Do** preserve Loading, Error, and Empty states without shifting the surrounding layout.
- **Do** test at 390px, 768px, and 1280px, including keyboard focus and reduced motion.

### Don't:

- **Don't** use gradients, glow, glassmorphism, rainbow charts, or decorative KPI rows.
- **Don't** reuse Sprint Coral for injury, errors, or destructive confirmation.
- **Don't** show generated calories, recovery scores, AI advice, or other unsupported evidence.
- **Don't** animate validation errors, destructive confirmations, headers, or bottom navigation.
- **Don't** repeat Triple Lane as ambient decoration when the product cycle is not being communicated.
