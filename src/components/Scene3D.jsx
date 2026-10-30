import { Component, Suspense } from 'react'

let webglSupport

// probes once: every probe costs a WebGL context, and browsers cap those
export function hasWebGL() {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      webglSupport = Boolean(gl)
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      webglSupport = false
    }
  }
  return webglSupport
}

// Falls back to plain 2D content if WebGL is missing or a scene crashes.
class WebGLBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.warn('3D scene disabled:', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function Scene3D({ fallback = null, children }) {
  if (!hasWebGL()) return fallback
  return (
    <WebGLBoundary fallback={fallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </WebGLBoundary>
  )
}
