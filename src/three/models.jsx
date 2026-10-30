// Low-poly building models for the Rome diorama. Geometries and materials
// are shared module-wide so hundreds of buildings stay cheap.
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// --- shared resources ------------------------------------------------------

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...extra })

export const M = {
  marble: mat('#f1ebdd'),
  stone: mat('#cbbd9b'),
  travertine: mat('#d9cba8'),
  plaster: mat('#ead7b0'),
  ochre: mat('#d9a95f'),
  brick: mat('#b0623b'),
  roof: mat('#b4512c'),
  wood: mat('#7a5230'),
  darkWood: mat('#4e3420'),
  wheat: mat('#d9b24c'),
  green: mat('#7f9c48'),
  hay: mat('#e2c46c'),
  canvas: mat('#f3ead6'),
  red: mat('#a3242c'),
  gold: mat('#e3b341', { metalness: 0.6, roughness: 0.35 }),
  bronze: mat('#8a6a3a', { metalness: 0.4, roughness: 0.5 }),
  terracotta: mat('#c0703f'),
  dark: mat('#3a2a1f'),
  sand: mat('#e3cf9b'),
}
const WALL_COLORS = [M.plaster, M.ochre, M.plaster, M.marble]

export const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  column: new THREE.CylinderGeometry(1, 1, 1, 8),
  pyramid: new THREE.ConeGeometry(0.71, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0),
  cone: new THREE.ConeGeometry(0.5, 1, 8).translate(0, 0.5, 0),
  sphere: new THREE.SphereGeometry(1, 8, 6),
  // gable roof: triangle profile, ridge running along z, base at y = 0
  prism: (() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.5, 0)
    shape.lineTo(0.5, 0)
    shape.lineTo(0, 1)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5)
  })(),
  amphora: new THREE.LatheGeometry(
    [
      [0, 0],
      [0.03, 0.01],
      [0.055, 0.07],
      [0.058, 0.13],
      [0.04, 0.18],
      [0.02, 0.2],
      [0.022, 0.25],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    8,
  ),
}

function Part({ g = G.box, m, p = [0, 0, 0], s = [1, 1, 1], r }) {
  return <mesh geometry={g} material={m} position={p} scale={s} rotation={r} castShadow receiveShadow />
}

const easeOutBack = (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2

// Grows a building out of the ground when it first appears.
export function Spawn({ position, rotation = 0, delay = 0, children }) {
  const ref = useRef()
  const start = useRef(null)
  useLayoutEffect(() => {
    ref.current.scale.setScalar(0.001)
  }, [])
  useFrame(({ clock }) => {
    if (start.current === 'done') return
    if (start.current === null) start.current = clock.elapsedTime + delay
    const t = (clock.elapsedTime - start.current) / 0.6
    if (t < 0) return
    if (t >= 1) {
      ref.current.scale.setScalar(1)
      start.current = 'done'
      return
    }
    ref.current.scale.setScalar(Math.max(easeOutBack(t), 0.001))
  })
  return (
    <group ref={ref} position={position} rotation={[0, rotation, 0]}>
      {children}
    </group>
  )
}

// --- buildings -------------------------------------------------------------

export function House({ seed = 0 }) {
  const wall = WALL_COLORS[Math.floor(seed * WALL_COLORS.length)]
  const tall = seed > 0.7 // the odd insula has a second storey
  const h = tall ? 0.55 : 0.32
  return (
    <>
      <Part m={wall} p={[0, h / 2, 0]} s={[0.5, h, 0.42]} />
      <Part g={G.prism} m={M.roof} p={[0, h, 0]} s={[0.56, 0.2, 0.48]} />
    </>
  )
}

export function Farm({ seed = 0 }) {
  const crop = seed > 0.4 ? M.wheat : M.green
  return (
    <>
      <Part m={crop} p={[0, 0.02, 0]} s={[1.5, 0.05, 1.05]} />
      <Part m={seed > 0.4 ? M.green : M.wheat} p={[0.38, 0.03, 0]} s={[0.7, 0.05, 1.05]} />
      <group position={[-0.95, 0, 0.3]} scale={0.75}>
        <House seed={0.1} />
      </group>
      <Part g={G.cone} m={M.hay} p={[-0.95, 0, -0.25]} s={[0.25, 0.22, 0.25]} />
    </>
  )
}

export function Market() {
  return (
    <>
      {[
        [-0.27, -0.2],
        [0.27, -0.2],
        [-0.27, 0.2],
        [0.27, 0.2],
      ].map(([x, z], i) => (
        <Part key={i} g={G.column} m={M.wood} p={[x, 0.21, z]} s={[0.02, 0.42, 0.02]} />
      ))}
      <Part m={M.red} p={[0, 0.44, 0]} s={[0.62, 0.04, 0.48]} />
      <Part m={M.wood} p={[0, 0.09, -0.12]} s={[0.55, 0.18, 0.14]} />
      {[-0.15, 0, 0.15].map((x) => (
        <Part key={x} g={G.amphora} m={M.terracotta} p={[x, 0, 0.12]} />
      ))}
    </>
  )
}

const TEMPLE_COLUMNS = [
  ...[-0.45, -0.15, 0.15, 0.45].flatMap((x) => [
    [x, -0.7],
    [x, 0.7],
  ]),
  ...[-0.35, 0, 0.35].flatMap((z) => [
    [-0.45, z],
    [0.45, z],
  ]),
]

export function Temple() {
  return (
    <>
      <Part m={M.marble} p={[0, 0.08, 0]} s={[1.15, 0.16, 1.65]} />
      <Part m={M.plaster} p={[0, 0.41, 0]} s={[0.6, 0.5, 1.0]} />
      {TEMPLE_COLUMNS.map(([x, z], i) => (
        <Part key={i} g={G.column} m={M.marble} p={[x, 0.47, z]} s={[0.05, 0.62, 0.05]} />
      ))}
      <Part m={M.marble} p={[0, 0.82, 0]} s={[1.1, 0.08, 1.6]} />
      <Part g={G.prism} m={M.roof} p={[0, 0.86, 0]} s={[1.15, 0.28, 1.65]} />
    </>
  )
}

export function Forum() {
  return (
    <>
      <Part m={M.travertine} p={[0, 0.03, 0]} s={[2.0, 0.06, 1.4]} />
      {Array.from({ length: 7 }, (_, i) => -0.9 + i * 0.3).map((x) => (
        <Part key={x} g={G.column} m={M.marble} p={[x, 0.32, -0.6]} s={[0.045, 0.52, 0.045]} />
      ))}
      <Part m={M.marble} p={[0, 0.6, -0.6]} s={[2.0, 0.06, 0.14]} />
      {/* the rostra and a gilded statue */}
      <Part m={M.stone} p={[0, 0.12, 0.35]} s={[0.5, 0.18, 0.25]} />
      <Part g={G.column} m={M.marble} p={[0.6, 0.18, 0.2]} s={[0.08, 0.3, 0.08]} />
      <Part g={G.column} m={M.gold} p={[0.6, 0.42, 0.2]} s={[0.04, 0.18, 0.04]} />
      <Part g={G.sphere} m={M.gold} p={[0.6, 0.54, 0.2]} s={[0.04, 0.04, 0.04]} />
    </>
  )
}

export function Senate() {
  return (
    <>
      <Part m={M.stone} p={[0, 0.04, 0.05]} s={[0.95, 0.08, 1.2]} />
      <Part m={M.brick} p={[0, 0.4, 0]} s={[0.8, 0.7, 1.0]} />
      <Part g={G.prism} m={M.roof} p={[0, 0.75, 0]} s={[0.86, 0.26, 1.06]} />
      <Part m={M.bronze} p={[0, 0.25, 0.51]} s={[0.2, 0.34, 0.02]} />
    </>
  )
}

const TENTS = [
  [-0.35, -0.35],
  [0.35, -0.35],
  [-0.35, 0.35],
  [0.35, 0.35],
]

export function Castra() {
  return (
    <>
      <Part m={M.wood} p={[0, 0.09, -0.8]} s={[1.6, 0.18, 0.06]} />
      <Part m={M.wood} p={[0, 0.09, 0.8]} s={[1.6, 0.18, 0.06]} />
      <Part m={M.wood} p={[-0.8, 0.09, 0]} s={[0.06, 0.18, 1.6]} />
      <Part m={M.wood} p={[0.8, 0.09, 0]} s={[0.06, 0.18, 1.6]} />
      {TENTS.map(([x, z], i) => (
        <Part key={i} g={G.pyramid} m={M.canvas} p={[x, 0, z]} s={[0.36, 0.26, 0.36]} />
      ))}
      <Part g={G.column} m={M.darkWood} p={[0, 0.4, 0]} s={[0.015, 0.8, 0.015]} />
      <Part m={M.red} p={[0.12, 0.7, 0]} s={[0.22, 0.14, 0.01]} />
    </>
  )
}

export function Ballista() {
  return (
    <>
      <Part m={M.stone} p={[0, 0.3, 0]} s={[0.45, 0.6, 0.45]} />
      <Part m={M.wood} p={[0, 0.66, 0]} s={[0.12, 0.08, 0.4]} />
      <Part m={M.wood} p={[0, 0.7, 0.12]} s={[0.44, 0.04, 0.04]} r={[0, 0, 0]} />
      <Part m={M.dark} p={[0, 0.72, 0.05]} s={[0.02, 0.02, 0.45]} />
    </>
  )
}

// --- the legion: a century marching on the Campus Martius --------------------

const ROWS = 4
const COLS = 4
const dummy = new THREE.Object3D()

export function Century({ phase = 0 }) {
  const group = useRef()
  const bodies = useRef()
  const helmets = useRef()
  const shields = useRef()

  useLayoutEffect(() => {
    let i = 0
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = (c - (COLS - 1) / 2) * 0.16
        const z = (r - (ROWS - 1) / 2) * 0.16
        dummy.position.set(x, 0.09, z)
        dummy.scale.set(0.07, 0.16, 0.05)
        dummy.updateMatrix()
        bodies.current.setMatrixAt(i, dummy.matrix)
        dummy.position.set(x, 0.2, z)
        dummy.scale.setScalar(0.035)
        dummy.updateMatrix()
        helmets.current.setMatrixAt(i, dummy.matrix)
        dummy.position.set(x + 0.045, 0.1, z + 0.02)
        dummy.scale.set(0.02, 0.13, 0.09)
        dummy.updateMatrix()
        shields.current.setMatrixAt(i, dummy.matrix)
        i++
      }
    }
    for (const mesh of [bodies, helmets, shields]) mesh.current.instanceMatrix.needsUpdate = true
  }, [])

  // march a slow loop around the drill field, bobbing in step
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.18 + phase
    const g = group.current
    g.position.set(Math.cos(t) * 0.9, Math.abs(Math.sin(clock.elapsedTime * 5 + phase)) * 0.025, Math.sin(t) * 0.6)
    g.rotation.y = -t + Math.PI
  })

  const n = ROWS * COLS
  return (
    <group ref={group}>
      <instancedMesh ref={bodies} args={[G.box, M.red, n]} castShadow />
      <instancedMesh ref={helmets} args={[G.sphere, M.bronze, n]} castShadow />
      <instancedMesh ref={shields} args={[G.box, M.red, n]} castShadow />
      {/* the signifer carries the eagle */}
      <Part g={G.column} m={M.darkWood} p={[0, 0.28, -0.4]} s={[0.012, 0.55, 0.012]} />
      <Part g={G.sphere} m={M.gold} p={[0, 0.57, -0.4]} s={[0.05, 0.035, 0.03]} />
    </group>
  )
}

// --- the fleet ---------------------------------------------------------------

export function Trireme() {
  const oarsL = useRef()
  const oarsR = useRef()
  useFrame(({ clock }) => {
    const sweep = Math.sin(clock.elapsedTime * 3.2) * 0.35
    oarsL.current.rotation.y = sweep
    oarsR.current.rotation.y = -sweep
  })
  const oars = useMemo(() => [-0.3, -0.15, 0, 0.15, 0.3], [])
  return (
    <>
      <Part m={M.darkWood} p={[0, 0.06, 0]} s={[0.24, 0.12, 1.0]} />
      <Part g={G.cone} m={M.bronze} p={[0, 0.06, 0.5]} s={[0.12, 0.28, 0.12]} r={[Math.PI / 2, 0, 0]} />
      <Part m={M.darkWood} p={[0, 0.12, -0.48]} s={[0.2, 0.2, 0.08]} />
      <Part g={G.column} m={M.wood} p={[0, 0.4, 0.05]} s={[0.015, 0.6, 0.015]} />
      <Part m={M.canvas} p={[0, 0.45, 0.06]} s={[0.46, 0.34, 0.01]} />
      <Part m={M.red} p={[0, 0.45, 0.068]} s={[0.46, 0.06, 0.005]} />
      {[
        [oarsL, -1],
        [oarsR, 1],
      ].map(([ref, side]) => (
        <group key={side} ref={ref} position={[side * 0.12, 0.08, 0]}>
          {oars.map((z) => (
            <Part key={z} m={M.wood} p={[side * 0.18, -0.03, z]} s={[0.36, 0.012, 0.025]} r={[0, 0, side * -0.25]} />
          ))}
        </group>
      ))}
    </>
  )
}
