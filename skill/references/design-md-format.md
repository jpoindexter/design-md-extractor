# DESIGN.md Output Format

## Purpose

The output `DESIGN.md` is the portable style guide. It should be readable by humans and directly useful to coding agents.

## Required Sections

```md
# Design System: <Site Name>

## 1. Style Thesis
## 2. Source Evidence
## 3. Tokens
## 4. Surfaces
## 5. Components
## 6. Layout System
## 7. Imagery & Media
## 8. Responsive Behavior
## 9. Do's and Don'ts
## 10. Agent Prompt Guide
## 11. Known Gaps
```

## Section Rules

### 1. Style Thesis

Write one or two concise paragraphs naming:

- visual mood
- density
- palette discipline
- typographic personality
- signature visual move

### 2. Source Evidence

Include:

- inspected URLs
- viewport sizes
- screenshots captured
- extraction date
- confidence summary

### 3. Tokens

Use tables for:

- colors
- typography
- spacing
- radii
- shadows

Color table:

```md
| Name | Value | Token | Role | Confidence |
|------|-------|-------|------|------------|
| Canvas White | `#ffffff` | `--color-canvas-white` | Page background | high |
```

### 4. Surfaces

Document surface hierarchy:

```md
| Level | Name | Value | Purpose | Confidence |
|-------|------|-------|---------|------------|
| 0 | Canvas | `#ffffff` | Page floor | high |
```

### 5. Components

Each component should include:

- role
- color treatment
- typography
- spacing
- radius
- border and shadow
- state notes when observed
- confidence

### 6. Layout System

Describe:

- container width
- grid behavior
- section rhythm
- alignment
- whitespace philosophy
- density

### 7. Imagery & Media

Describe:

- photography vs illustration vs product screenshots
- framing
- radius
- shadow treatment
- icon style
- what to avoid

### 8. Responsive Behavior

Include breakpoints and observed changes. If only inferred from viewport captures, mark confidence as medium or low.

### 9. Do's and Don'ts

Use direct implementation guardrails. Avoid vague advice.

### 10. Agent Prompt Guide

Include:

- quick color reference
- component prompts
- typography prompts
- layout prompt

### 11. Known Gaps

List missing evidence and caveats:

- pages not inspected
- inaccessible flows
- animations not captured
- licensed fonts requiring substitutes
- component states not observed

## Writing Style

- Prefer concrete values over adjectives.
- Use semantic names for tokens.
- Keep brand assets separate from reusable style rules.
- Do not overstate confidence.
- Write for someone building a new site, not cloning the original.
