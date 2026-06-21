// Petal react/jsx-runtime shim
// Re-exports the host's jsx-runtime so compiled JSX in custom app chunks uses
// the same React instance as the Petal renderer.
// window.__petal_jsx_runtime is set synchronously by <ReactGlobals /> in layout.tsx.
const rt = globalThis.__petal_jsx_runtime
if (!rt) throw new Error("[Petal] react/jsx-runtime shim: window.__petal_jsx_runtime is not set")

export const { jsx, jsxs, Fragment } = rt
