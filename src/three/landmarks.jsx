import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  COLOSSEUM_POS,
  ISLAND_RADIUS,
  TRAJAN_POS,
  WALL_RADIUS,
  aqueductPoints,
  inRiver,
  riverX,
  terrainHeight,
} from './layout.js'
import { Ballista, G, M, Spawn } from './models.jsx'

// --- the land: a floating island with hills and the Tiber -----------------------

const RINGS = 64
const SEGMENTS = 120
const EDGE = ISLAND_RADIUS + 0.9

function islandHeight(x, z) {
  const d = Math.hypot(x, z)
  const edgeDrop = d > ISLAND_RADIUS - 0.6 ? (d - (ISLAND_RADIUS - 0.6)) * 2.2 : 0
  return terrainHeight(x, z) - edgeDrop
}

function buildIsland() {
  const positions = []
  const colors = []
  const grass = new THREE.Color('#86a24f')
  const grassDark = new THREE.Color('#6d8a3e')
  const earth = new THREE.Color('#8b6a43')
  const bank = new THREE.Color('#b9a26a')
  const c = new THREE.Color()
  for (let i = 0; i <= RINGS; i++) {
    const r = (EDGE * i) / RINGS
    for (let j = 0; j < SEGMENTS; j++) {
      const a = (j / SEGMENTS) * Math.PI * 2
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      const y = islandHeight(x, z)
      positions.push(x, y, z)
      const river = Math.abs(x - riverX(z))
      if (y < -0.35) c.copy(earth)
      else if (river < 1.5) c.copy(bank)
      else c.copy(grass).lerp(grassDark, 0.5 + 0.5 * Math.sin(x * 1.3) * Math.cos(z * 1.1))
      colors.push(c.r, c.g, c.b)
    }
  }
  const index = []
  for (let i = 0; i < RINGS; i++) {
    for (let j = 0; j < SEGMENTS; j++) {
      const a = i * SEGMENTS + j
      const b = i * SEGMENTS + ((j + 1) % SEGMENTS)
      const c2 = (i + 1) * SEGMENTS + j
      const d = (i + 1) * SEGMENTS + ((j + 1) % SEGMENTS)
      index.push(a, b, c2, b, d, c2)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.setIndex(index)
  geo.computeVertexNormals()
  return geo
}

function buildRiver() {
  const positions = []
  const index = []
  const steps = 80
  let rows = 0
  for (let i = 0; i <= steps; i++) {
    const z = -EDGE + (2 * EDGE * i) / steps
    const x = riverX(z)
    if (Math.hypot(x, z) > ISLAND_RADIUS - 0.3) continue
    positions.push(x - 0.95, -0.12, z, x + 0.95, -0.12, z)
    if (rows > 0) {
      const a = (rows - 1) * 2
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
    rows++
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(index)
  geo.computeVertexNormals()
  return geo
}

const waterMaterial = new THREE.MeshStandardMaterial({ color: '#3f86b0', roughness: 0.15, metalness: 0.2, emissive: '#0d2c40' })

export function Land() {
  const island = useMemo(buildIsland, [])
  const river = useMemo(buildRiver, [])
  const water = useRef()
  useFrame(({ clock }) => {
    // a slow shimmer on the Tiber
    waterMaterial.emissiveIntensity = 0.6 + Math.sin(clock.elapsedTime * 1.4) * 0.25
  })
  return (
    <>
      <mesh geometry={island} receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.95} />
      </mesh>
      {/* rocky underside of the floating island */}
      <mesh position={[0, -2.3 - 3.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[EDGE - 0.4, 7, 40, 3]} />
        <meshStandardMaterial color="#6e5236" flatShading roughness={1} />
      </mesh>
      <mesh ref={water} geometry={river} material={waterMaterial} receiveShadow />
    </>
  )
}

// --- the Servian Wall, raised after the Gallic sack --------------------------------

export const TOWERS = (() => {
  const towers = []
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.1
    const x = Math.cos(a) * WALL_RADIUS
    const z = Math.sin(a) * WALL_RADIUS
    if (!inRiver(x, z, 0.4)) towers.push({ x, z, y: terrainHeight(x, z), a })
  }
  return towers
})()

const dummy = new THREE.Object3D()

export function ServianWall() {
  const segments = useMemo(() => {
    const list = []
    const n = 90
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const x = Math.cos(a) * WALL_RADIUS
      const z = Math.sin(a) * WALL_RADIUS
      if (!inRiver(x, z, 0.3)) list.push({ x, z, a })
    }
    return list
  }, [])
  const walls = useRef()
  const towers = useRef()
  useLayoutEffect(() => {
    const len = ((Math.PI * 2 * WALL_RADIUS) / 90) * 1.05
    segments.forEach(({ x, z, a }, i) => {
      dummy.position.set(x, terrainHeight(x, z) + 0.2, z)
      dummy.rotation.set(0, -a, 0)
      dummy.scale.set(0.2, 0.55, len)
      dummy.updateMatrix()
      walls.current.setMatrixAt(i, dummy.matrix)
    })
    TOWERS.forEach(({ x, z, y, a }, i) => {
      dummy.position.set(x, y + 0.35, z)
      dummy.rotation.set(0, -a, 0)
      dummy.scale.set(0.42, 0.85, 0.42)
      dummy.updateMatrix()
      towers.current.setMatrixAt(i, dummy.matrix)
    })
    walls.current.instanceMatrix.needsUpdate = true
    towers.current.instanceMatrix.needsUpdate = true
  }, [segments])
  return (
    <Spawn position={[0, 0, 0]}>
      <instancedMesh ref={walls} args={[G.box, M.stone, segments.length]} castShadow receiveShadow />
      <instancedMesh ref={towers} args={[G.box, M.stone, TOWERS.length]} castShadow receiveShadow />
    </Spawn>
  )
}

export function Ballistae({ count }) {
  return TOWERS.slice(0, count).map(({ x, z, y, a }, i) => (
    <Spawn key={i} position={[x, y + 0.2, z]} rotation={-a + Math.PI / 2} delay={i * 0.05}>
      <group scale={0.6}>
        <Ballista />
      </group>
    </Spawn>
  ))
}

// --- the aqueduct marches toward the city span by span ---------------------------

const AQUEDUCT_TOP = 1.9
const AQ_POINTS = aqueductPoints(14)
const archGeometry = new THREE.TorusGeometry(1, 0.12, 6, 12, Math.PI)

export function Aqueduct({ spans }) {
  return AQ_POINTS.slice(0, spans).map(([x, z], i) => {
    const [nx, nz] = AQ_POINTS[i + 1] ?? AQ_POINTS[i]
    const len = Math.hypot(nx - x, nz - z)
    const ground = terrainHeight(x, z)
    const pillar = AQUEDUCT_TOP - ground
    const angle = Math.atan2(nz - z, nx - x)
    return (
      <Spawn key={i} position={[x, ground, z]} rotation={-angle} delay={i * 0.06}>
        <mesh geometry={G.box} material={M.travertine} position={[0, pillar / 2, 0]} scale={[0.2, pillar, 0.26]} castShadow />
        <mesh
          geometry={archGeometry}
          material={M.travertine}
          position={[len / 2, pillar - 0.62, 0]}
          scale={[len / 2 - 0.1, len / 2 - 0.1, 1]}
          castShadow
        />
        <mesh geometry={G.box} material={M.travertine} position={[len / 2, pillar - 0.12, 0]} scale={[len + 0.02, 0.24, 0.3]} castShadow />
      </Spawn>
    )
  })
}

// --- the Flavian Amphitheatre ------------------------------------------------------

let arcadeTexture
function getArcadeTexture() {
  if (arcadeTexture) return arcadeTexture
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#dccdaa'
  ctx.fillRect(0, 0, 64, 128)
  ctx.fillStyle = '#5b4a36'
  for (const top of [100, 66, 32]) {
    ctx.beginPath()
    ctx.moveTo(16, top + 26)
    ctx.lineTo(16, top + 8)
    ctx.arc(32, top + 8, 16, Math.PI, 0)
    ctx.lineTo(48, top + 26)
    ctx.closePath()
    ctx.fill()
  }
  for (const x of [12, 40]) ctx.fillRect(x, 8, 12, 10) // attic windows
  arcadeTexture = new THREE.CanvasTexture(canvas)
  arcadeTexture.wrapS = THREE.RepeatWrapping
  arcadeTexture.repeat.set(40, 1)
  arcadeTexture.colorSpace = THREE.SRGBColorSpace
  return arcadeTexture
}

export function Colosseum() {
  const outer = useMemo(
    () => new THREE.MeshStandardMaterial({ map: getArcadeTexture(), side: THREE.DoubleSide, roughness: 0.9 }),
    [],
  )
  const [x, z] = COLOSSEUM_POS
  return (
    <Spawn position={[x, terrainHeight(x, z), z]}>
      <group scale={[1, 1, 0.84]}>
        <mesh position={[0, 0.55, 0]} material={outer} castShadow receiveShadow>
          <cylinderGeometry args={[1.75, 1.75, 1.1, 48, 1, true]} />
        </mesh>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.7, 1.05, 0.8, 48, 1, true]} />
          <meshStandardMaterial color="#c9b78f" side={THREE.DoubleSide} flatShading />
        </mesh>
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[1.08, 40]} />
          <meshStandardMaterial color="#e6cf95" />
        </mesh>
      </group>
    </Spawn>
  )
}

export function TrajansColumn() {
  const [x, z] = TRAJAN_POS
  return (
    <Spawn position={[x, terrainHeight(x, z), z]}>
      <mesh geometry={G.box} material={M.marble} position={[0, 0.15, 0]} scale={[0.4, 0.3, 0.4]} castShadow />
      <mesh geometry={G.column} material={M.marble} position={[0, 1.3, 0]} scale={[0.1, 2.0, 0.1]} castShadow />
      <mesh geometry={G.box} material={M.marble} position={[0, 2.32, 0]} scale={[0.24, 0.06, 0.24]} castShadow />
      <mesh geometry={G.column} material={M.gold} position={[0, 2.48, 0]} scale={[0.04, 0.26, 0.04]} castShadow />
    </Spawn>
  )
}

// --- life in the sky --------------------------------------------------------------

function Bird({ radius, height, speed, phase }) {
  const ref = useRef()
  const left = useRef()
  const right = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + phase
    ref.current.position.set(Math.cos(t) * radius, height + Math.sin(t * 2) * 0.3, Math.sin(t) * radius)
    ref.current.rotation.y = -t
    const flap = Math.sin(clock.elapsedTime * 6 + phase) * 0.5
    left.current.rotation.z = flap
    right.current.rotation.z = -flap
  })
  return (
    <group ref={ref}>
      <group ref={left}>
        <mesh geometry={G.box} material={M.dark} position={[0, 0, -0.18]} scale={[0.08, 0.015, 0.36]} />
      </group>
      <group ref={right}>
        <mesh geometry={G.box} material={M.dark} position={[0, 0, 0.18]} scale={[0.08, 0.015, 0.36]} />
      </group>
      <mesh geometry={G.box} material={M.dark} scale={[0.22, 0.05, 0.06]} />
    </group>
  )
}

export function Birds() {
  return (
    <>
      <Bird radius={7} height={6} speed={0.25} phase={0} />
      <Bird radius={9} height={7} speed={0.18} phase={2} />
      <Bird radius={5.5} height={5.2} speed={0.3} phase={4} />
    </>
  )
}

const cloudMaterial = new THREE.MeshStandardMaterial({ color: '#fff8ec', roughness: 1, flatShading: true })

function Cloud({ radius, height, speed, phase, size }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + phase
    ref.current.position.set(Math.cos(t) * radius, height, Math.sin(t) * radius)
  })
  return (
    <group ref={ref} scale={size}>
      <mesh geometry={G.sphere} material={cloudMaterial} scale={[1, 0.6, 0.8]} />
      <mesh geometry={G.sphere} material={cloudMaterial} position={[0.9, -0.1, 0.1]} scale={[0.7, 0.45, 0.6]} />
      <mesh geometry={G.sphere} material={cloudMaterial} position={[-0.8, -0.15, 0]} scale={[0.65, 0.4, 0.55]} />
    </group>
  )
}

export function Clouds() {
  return (
    <>
      <Cloud radius={13} height={8} speed={0.02} phase={0} size={1.2} />
      <Cloud radius={17} height={9.5} speed={0.015} phase={2.1} size={1.6} />
      <Cloud radius={11} height={10} speed={0.025} phase={4.2} size={1} />
      <Cloud radius={19} height={7} speed={0.012} phase={5.3} size={1.4} />
    </>
  )
}
