"use client"
import React from "react"
import * as jsxRuntime from "react/jsx-runtime"
import * as ReactDOM from "react-dom"

// Set globals synchronously during render (not in useEffect) so they are
// available before any custom app chunk is dynamically imported on navigation.
if (typeof window !== "undefined") {
  window.__petal_react = React
  window.__petal_jsx_runtime = jsxRuntime
  window.__petal_react_dom = ReactDOM
}

export function ReactGlobals() {
  return null
}
