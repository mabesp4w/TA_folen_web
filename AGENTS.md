<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project UI and Theme Rules

## Visual Direction

- All pages and reusable components must follow the **Hangat Papua Modern** visual direction.
- The interface should feel warm, welcoming, trustworthy, contemporary, and appropriate for GKI Syaloom Pasifik Indah.
- Preserve visual consistency with the existing login page unless a user explicitly requests a different direction.

## Color System

- Use the existing theme tokens defined in `app/globals.css` as the source of truth.
- Base colors should use warm cream and paper-like surfaces.
- Primary actions and strong structural elements should use forest green.
- Interactive emphasis and focus states should use Pacific blue.
- Gold or terracotta may be used sparingly for highlights and culturally inspired accents.
- Do not introduce arbitrary hard-coded colors when an existing theme token is suitable.
- Maintain sufficient contrast for text, controls, errors, disabled states, and focus indicators.

## DaisyUI and Reusable Components

- Use DaisyUI components and conventions as the base UI layer, then apply project theme classes where needed.
- Reuse the shared form components instead of recreating equivalent markup on individual pages:
  - `InputText`
  - `InputPassword`
  - `Select`
  - `Checkbox`
  - `FormField`
- Extend shared components when a requirement is broadly reusable. Avoid creating large page-specific components that duplicate generic controls.
- Shared form controls must support labels, help text, validation errors, disabled and required states, native HTML attributes, and relevant ARIA attributes.

## Typography and Surfaces

- Use the existing system font stack and typographic hierarchy from `app/globals.css`.
- Use restrained rounded corners, subtle borders, and soft shadows. Avoid excessive gradients, glass effects, or decorative card nesting.
- Keep spacing deliberate and consistent. Prefer existing spacing, radius, shadow, and color values over introducing isolated styles.
- Cultural references should remain abstract and respectful. Do not invent or present decorative motifs as authentic Papuan symbols without verified source material.

## Interaction and Accessibility

- Every interactive control must have a visible keyboard focus state.
- Inputs wrapped by a DaisyUI input container should use the wrapper focus state and must not render a second oversized inner outline.
- Form labels must remain visible. Do not rely on placeholders as the only label.
- Error messages must be associated with their fields and exposed through appropriate ARIA attributes.
- Touch targets should remain comfortably usable on mobile devices.
- Respect `prefers-reduced-motion` and avoid unnecessary animation.

## Responsive Layout

- Every page must support desktop, tablet, and mobile layouts.
- Use `100dvh` with an appropriate fallback for full-viewport application surfaces.
- Do not use `overflow: hidden` merely to conceal clipped or oversized content.
- Prevent horizontal overflow, unintended text clipping, and controls extending beyond their containers.
- Full-screen pages such as login should fit within common viewport heights when practical. On exceptionally short viewports, preserve access to all content rather than hiding it.

## Verification Requirements

- After UI changes, run lint, TypeScript checks, and the production build.
- Check affected pages at representative desktop and mobile viewport sizes.
- Verify focus states, overflow, text wrapping, error states, loading states, and disabled states.
- Run the Impeccable detector once after the changed UI is complete when the tool is available.
