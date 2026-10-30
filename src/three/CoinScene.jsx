import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import eagleUrl from '../assets/icons/eagle-emblem.png'

const TAU = Math.PI * 2
const MAX_SPIN = 40
const PARTICLES = 60
const PER_CLICK = 5
const PARTICLE_LIFE = 1.1

// --- textures drawn on a canvas: an embossed eagle and a reeded edge -------------

function tinted(img, color, size) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0, size, size)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, size, size)
  return c
}

function drawFace(img) {
  const S = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = S
  const ctx = canvas.getContext('2d')

  const base = ctx.createRadialGradient(S * 0.38, S * 0.32, 20, S / 2, S / 2, S / 2)
  base.addColorStop(0, '#fff0b8')
  base.addColorStop(0.55, '#e7b64f')
  base.addColorStop(1, '#a8771d')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)

  ctx.strokeStyle = '#87591a'
  ctx.lineWidth = 12
  ctx.beginPath()
  ctx.arc(S / 2, S / 2, 242, 0, TAU)
  ctx.stroke()
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(S / 2, S / 2, 210, 0, TAU)
  ctx.stroke()
  ctx.fillStyle = '#87591a'
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * TAU
    ctx.beginPath()
    ctx.arc(S / 2 + Math.cos(a) * 226, S / 2 + Math.sin(a) * 226, 4, 0, TAU)
    ctx.fill()
  }

  // emboss: dark shadow below-right, highlight above-left, then the relief itself
  const E = 270
  const x = (S - E) / 2
  const y = 92
  ctx.drawImage(tinted(img, '#6e470f', E), x + 6, y + 7)
  ctx.drawImage(tinted(img, '#fff4cf', E), x - 3, y - 3)
  ctx.drawImage(tinted(img, '#dcaa3e', E), x, y)

  ctx.font = '700 46px Cinzel, "Trajan Pro", Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff1c4'
  ctx.fillText('S·P·Q·R', S / 2 - 2, 422 - 2)
  ctx.fillStyle = '#7a4f12'
  ctx.fillText('S·P·Q·R', S / 2, 422)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  // cylinder caps map UVs a quarter-turn off once the coin is stood upright
  texture.center.set(0.5, 0.5)
  texture.rotation = Math.PI / 2
  return texture
}

function drawEdge() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 8
  const ctx = canvas.getContext('2d')
  for (let i = 0; i < 64; i++) {
    ctx.fillStyle = i % 2 ? '#a8771d' : '#f4d47c'
    ctx.fillRect(i * 4, 0, 4, 8)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.repeat.set(3, 1)
  return texture
}

function useCoinMaterials() {
  const [face, setFace] = useState(null)
  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      // wait for the display font so S·P·Q·R isn't drawn in a fallback face
      const ready = document.fonts?.ready ?? Promise.resolve()
      ready.then(() => !cancelled && setFace(drawFace(img)))
    }
    img.src = eagleUrl
    return () => {
      cancelled = true
    }
  }, [])
  return useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({ map: drawEdge(), metalness: 1, roughness: 0.32 })
    const faceMat = new THREE.MeshStandardMaterial({ color: face ? '#ffffff' : '#e7b64f', map: face, metalness: 0.95, roughness: 0.3 })
    return [edge, faceMat, faceMat]
  }, [face])
}

// --- scene pieces ---------------------------------------------------------------------

function Environment() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

const coinGeometry = new THREE.CylinderGeometry(1, 1, 0.14, 64)

function Coin({ pulse }) {
  const group = useRef()
  const motion = useRef({ angle: 0, velocity: 0, squash: 0 })
  const materials = useCoinMaterials()
  const firstPulse = useRef(pulse)

  useEffect(() => {
    if (pulse === firstPulse.current) return
    const m = motion.current
    m.velocity = Math.min(m.velocity + 11, MAX_SPIN)
    m.squash = 1
  }, [pulse])

  useFrame(({ clock }, dt) => {
    const m = motion.current
    m.velocity *= Math.exp(-dt * 2.6)
    m.angle += m.velocity * dt
    // once it slows, settle back to showing the eagle
    if (m.velocity < 1.2) {
      const rest = Math.round(m.angle / TAU) * TAU
      m.angle += (rest - m.angle) * Math.min(dt * 5, 1)
    }
    m.squash = Math.max(0, m.squash - dt * 6)
    const t = clock.elapsedTime
    group.current.rotation.y = m.angle + Math.sin(t * 0.9) * 0.22
    group.current.rotation.x = Math.sin(t * 0.7) * 0.08
    group.current.position.y = Math.sin(t * 1.6) * 0.05
    group.current.scale.setScalar(1 - m.squash * 0.09)
  })

  return (
    <group ref={group}>
      <mesh geometry={coinGeometry} material={materials} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  )
}

const particleGeometry = new THREE.CylinderGeometry(0.16, 0.16, 0.03, 20)
const particleMaterial = new THREE.MeshStandardMaterial({ color: '#f0c75e', metalness: 1, roughness: 0.3 })
const dummy = new THREE.Object3D()

function CoinBurst({ pulse }) {
  const mesh = useRef()
  const pool = useRef(Array.from({ length: PARTICLES }, () => ({ life: 0 })))
  const cursor = useRef(0)
  const firstPulse = useRef(pulse)

  useLayoutEffect(() => {
    dummy.scale.setScalar(0)
    dummy.updateMatrix()
    for (let i = 0; i < PARTICLES; i++) mesh.current.setMatrixAt(i, dummy.matrix)
    mesh.current.instanceMatrix.needsUpdate = true
  }, [])

  useEffect(() => {
    if (pulse === firstPulse.current) return
    for (let k = 0; k < PER_CLICK; k++) {
      const p = pool.current[cursor.current]
      cursor.current = (cursor.current + 1) % PARTICLES
      const a = Math.random() * TAU
      const speed = 2.2 + Math.random() * 2.2
      p.life = PARTICLE_LIFE
      p.pos = new THREE.Vector3(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0.3)
      p.vel = new THREE.Vector3(Math.cos(a) * speed, Math.sin(a) * speed + 2.5, 1 + Math.random())
      p.rot = new THREE.Euler(Math.random() * TAU, Math.random() * TAU, 0)
      p.spin = 6 + Math.random() * 10
    }
  }, [pulse])

  useFrame((_, dt) => {
    let dirty = false
    pool.current.forEach((p, i) => {
      if (p.life <= 0) return
      dirty = true
      p.life -= dt
      p.vel.y -= 9 * dt
      p.pos.addScaledVector(p.vel, dt)
      p.rot.x += p.spin * dt
      dummy.position.copy(p.pos)
      dummy.rotation.copy(p.rot)
      dummy.scale.setScalar(p.life > 0 ? Math.min(1, p.life / 0.3) : 0)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    if (dirty) mesh.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[particleGeometry, particleMaterial, PARTICLES]} frustumCulled={false} />
}

export default function CoinScene({ pulse }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6.2], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      // purely decorative: clicks go through to the real button underneath
      style={{ pointerEvents: 'none' }}
    >
      <Environment />
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} color="#fff1d6" />
      <directionalLight position={[-4, -2, 2]} intensity={0.6} color="#ffb070" />
      <Coin pulse={pulse} />
      <CoinBurst pulse={pulse} />
    </Canvas>
  )
}
