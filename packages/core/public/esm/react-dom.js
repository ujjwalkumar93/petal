// Petal react-dom shim
// Re-exports the host's react-dom so custom app chunks (e.g. Radix UI portals)
// share the same DOM renderer as the Petal host.
// window.__petal_react_dom is set synchronously by <ReactGlobals /> in layout.tsx.
const RD = globalThis.__petal_react_dom
if (!RD) throw new Error("[Petal] react-dom shim: window.__petal_react_dom is not set")

export default RD
export const {
  createPortal,
  flushSync,
  findDOMNode,
  unmountComponentAtNode,
  unstable_batchedUpdates,
  version,
} = RD
