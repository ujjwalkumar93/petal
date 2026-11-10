declare module "*.css" {}

// Desk's chart and table libraries ship without type declarations.
declare module "frappe-charts"
declare module "frappe-datatable"

// Host React instance shared with custom app bundles through the /esm/*.js
// import-map shims (set by <ReactGlobals />).
interface Window {
  __petal_react?: typeof import("react")
  __petal_jsx_runtime?: typeof import("react/jsx-runtime")
  __petal_react_dom?: typeof import("react-dom")
}
