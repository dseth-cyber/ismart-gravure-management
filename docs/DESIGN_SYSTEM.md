# Design System Rules

Last updated: 2026-06-09

This file keeps the UI consistent across all future Gravure Management System screens.

## Design Direction

Default theme:
- Modern Glassmorphism

Supported themes:
- `modern`
- `dark`
- `light`

Frontend baseline:
- Next.js 16
- React 19
- TypeScript 5.x
- Tailwind CSS 4

The app is an operational manufacturing system. It should feel precise, calm, readable, and efficient. Avoid marketing-style layouts, oversized hero sections, decorative cards, and visual noise.

## Visual Principles

1. Prioritize scanning and repeated use.
2. Keep dashboards dense but organized.
3. Use clear hierarchy: page title, filters/actions, content.
4. Use consistent table, card, dialog, and form patterns.
5. Use status colors consistently.
6. Avoid page-specific visual experiments.
7. Keep cards at 8px radius or less unless the component already defines otherwise.
8. Do not put cards inside cards.
9. Do not use decorative gradient orbs or bokeh blobs.
10. Do not use hero-scale typography inside app panels, sidebars, tables, forms, or dialogs.

## Layout Rules

Every page must use the shared `Layout`.

Recommended page structure:
1. `PageHeader`
2. Toolbar or filters
3. Main content area
4. Optional side panel or detail drawer

Page header should include:
- translated title
- translated subtitle when useful
- primary action button
- optional secondary actions

Content width:
- Dashboards and work pages should use available width.
- Avoid narrow marketing-style sections.

Responsive behavior:
- Mobile must preserve workflow, not only shrink desktop UI.
- Tables should become horizontal scroll, compact cards, or priority-column views.
- Buttons must not overflow text.
- Dialogs must fit mobile viewport.

## Theme Tokens

Future `themeConfig` should include at least:

```ts
type ThemeConfig = {
  name: 'modern' | 'dark' | 'light';
  appBg: string;
  navBar: string;
  sidebar: string;
  panel: string;
  panelHover: string;
  dialog: string;
  dialogOverlay: string;
  input: string;
  select: string;
  tableHead: string;
  tableRow: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primaryText: string;
  primaryBg: string;
  primaryButton: string;
  secondaryButton: string;
  dangerButton: string;
  badge: string;
  shadow: string;
  focusRing: string;
};
```

Use `themeConfig` classes instead of hardcoded theme-dependent classes.

## Component Rules

### Buttons

Use shared `AppButton`.

Required variants:
- `primary`
- `secondary`
- `ghost`
- `danger`
- `icon`

Rules:
- Use icons for tool actions when a familiar icon exists.
- Text buttons are for clear commands.
- Loading and disabled states must be supported.

### Dialogs

Use shared dialog components:
- `AppDialog`
- `ConfirmDialog`
- `FormDialog`

Rules:
- Dialog title, description, labels, and errors must use i18n keys.
- No page-specific modal markup.
- Confirm destructive actions with `ConfirmDialog`.
- Dialog action buttons must use `AppButton`.

### Forms

Use shared inputs:
- `AppInput`
- `AppSelect`
- `AppTextarea`
- `AppCheckbox`
- `AppDateInput`

Rules:
- Labels and validation messages must use i18n keys.
- Required fields must be visually clear.
- Validation errors appear near the field.

### Tables

Use shared `DataTable`.

Required support:
- loading state
- empty state
- error state
- sorting when needed
- row action menu
- pagination when needed

Rules:
- Table headers use i18n keys.
- Status columns use `StatusBadge`.
- Row actions should use icon buttons or compact menus.

### Status Badges

Use shared `StatusBadge`.

Recommended status groups:
- success: available, active, completed, passed
- warning: reserved, near expiry, pending, inspection
- danger: expired, failed, repair
- info: running, in production
- neutral: draft, inactive, superseded

## i18n Design Rules

Text must be designed for expansion. English may be shorter than Thai, Japanese, Myanmar, or Chinese in some contexts.

Rules:
- Buttons must allow text wrapping or responsive width.
- Table columns must not break layout when translated.
- Avoid fixed text containers that assume one language length.
- Do not embed variables by string concatenation. Use interpolation:

```ts
t('inventory.remainingKg', { value: 12.5 })
```

## Page Templates

### Dashboard Page

Use:
- compact KPI cards
- status charts
- recent activity
- alerts
- quick actions

Avoid:
- marketing hero
- oversized decorative cards
- duplicated chart colors that confuse status meaning

### Master Data Page

Use:
- page header
- filter/search toolbar
- data table
- add/edit dialog

Avoid:
- one-off edit panels unless there is a clear workflow need

### Workflow Page

Use:
- stepper or status timeline
- clear next action
- audit trail
- validation summary

Avoid:
- hiding required operational steps behind ambiguous buttons

### Detail Page

Use:
- summary header
- tabs for major sections
- audit/activity panel
- related records

Avoid:
- putting every field into one long unstructured page

## Color And Status Rules

Status colors must be consistent across themes.

Recommended semantic mapping:
- success: green
- warning: amber
- danger: red/rose
- info: blue/cyan
- neutral: gray/slate

Do not use color alone to communicate meaning. Pair color with text or icon.

## Accessibility Rules

Minimum expectations:
- Buttons have accessible labels.
- Icon-only buttons have tooltips or `aria-label`.
- Focus states are visible.
- Dialogs trap focus.
- Form errors are announced through visible text.
- Color contrast must be readable in all themes.

## Frontend Design Review Checklist

Before marking UI work done:
- Uses shared `Layout`.
- Uses `useTheme()` and `themeConfig`.
- Uses `useTranslation()` and `t('key')`.
- No hardcoded visible text.
- Dialogs use shared dialog components.
- Buttons, forms, tables, and badges use shared components.
- Mobile layout checked.
- Text does not overflow.
- The page does not visually drift from the system.
