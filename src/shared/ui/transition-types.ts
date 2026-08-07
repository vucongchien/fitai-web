// Shared `transitionTypes` tuples for `next/link`.
// Hoisted to module scope so every link reuses one array instead of allocating
// a fresh literal on each render.

/** Pushing deeper into a stack: detail pages, "start" actions. */
export const NAV_FORWARD: string[] = ["nav-forward"];

/** Returning to the previous screen: back buttons, breadcrumbs. */
export const NAV_BACK: string[] = ["nav-back"];

/** Moving between peers at the same level: bottom-navigation tabs. */
export const NAV_LATERAL: string[] = ["nav-lateral"];
