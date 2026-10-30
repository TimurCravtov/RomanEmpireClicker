import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Aqueduct, Ballistae, Birds, Clouds, Colosseum, Land, ServianWall, TOWERS, TrajansColumn } from './landmarks.jsx'
import { ROMULUS_HUTS, SLOTS, WOLF_POS, ZONES, riverX, shownCount, terrainHeight } from './layout.js'
import { CapitolineWolf, Castra, Century, Farm, Forum, G, House, M, Market, Senate, Spawn, Temple, Trireme } from './models.jsx'

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const coarsePointer = () => window.matchMedia?.('(pointer: coarse)').matches

// On touch screens the orbit controls would swallow every gesture and trap the
// page. Instead the browser keeps vertical swipes (page scroll) and we take the
// rest: a horizontal swipe spins the island, a pinch zooms.
const UP = new THREE.Vector3(0, 1, 0)

// radians of spin for a pixel of horizontal swipe: a full phone-width swipe is about half a turn
const SWIPE_RADIANS_PER_PX = 0.008

function attachTouch(controls, element, onStart, onEnd) {
  const camera = controls.object
  const pointers = new Map()
  // Gestures are measured from where they began, not move by move, so extra or
  // coalesced pointer events can never compound into a runaway spin.
  let gesture = null

  controls.enabled = false
  element.style.touchAction = 'pan-y'

  const spread = () => {
    const [a, b] = [...pointers.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const begin = () => {
    const first = [...pointers.values()][0]
    gesture = {
      offset: camera.position.clone().sub(controls.target),
      x: first.x,
      spread: pointers.size === 2 ? spread() : 0,
    }
  }

  const down = (e) => {
    if (e.pointerType !== 'touch') return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.size === 1) onStart()
    begin()
  }

  const move = (e) => {
    if (!pointers.has(e.pointerId) || !gesture) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const offset = gesture.offset.clone()
    if (pointers.size === 1) {
      offset.applyAxisAngle(UP, -(e.clientX - gesture.x) * SWIPE_RADIANS_PER_PX)
    } else if (pointers.size === 2 && gesture.spread > 0) {
      const length = offset.length() * (gesture.spread / spread())
      offset.setLength(Math.min(controls.maxDistance, Math.max(controls.minDistance, length)))
    }
    camera.position.copy(controls.target).add(offset)
  }

  const up = (e) => {
    if (!pointers.delete(e.pointerId)) return
    if (pointers.size === 0) {
      gesture = null
      onEnd()
    } else {
      begin() // pinch ended with a finger still down: carry on rotating from here
    }
  }

  element.addEventListener('pointerdown', down)
  element.addEventListener('pointermove', move)
  // a vertical swipe becomes a page scroll and cancels the pointer
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) element.addEventListener(type, up)
  return () => {
    element.removeEventListener('pointerdown', down)
    element.removeEventListener('pointermove', move)
    for (const type of ['pointerup', 'pointercancel', 'pointerleave']) element.removeEventListener(type, up)
  }
}

// how much of the island must fit on screen, in world units: nearly the full
// width (it may tuck slightly under the panels) and its top plus some underside
const FIT_HALF_WIDTH = 14.5
const FIT_HALF_HEIGHT = 9.5

function CameraRig({ frame }) {
  const { camera, gl, scene, size } = useThree()
  const [controls, setControls] = useState(null)

  // The controls are created and disposed by this effect, so none can leak:
  // a stray instance (StrictMode mounts twice in dev) would still answer drags.
  useEffect(() => {
    const reduced = prefersReducedMotion()
    const orbit = new OrbitControls(camera, gl.domElement)
    orbit.target.set(0, 0.4, 0)
    orbit.enableDamping = true
    orbit.enablePan = false
    orbit.minPolarAngle = 0.55
    orbit.maxPolarAngle = 1.25
    orbit.autoRotate = !reduced
    orbit.autoRotateSpeed = 0.35
    let resume
    const onStart = () => {
      orbit.autoRotate = false
      clearTimeout(resume)
    }
    const onEnd = () => {
      resume = setTimeout(() => (orbit.autoRotate = !reduced), 4000)
    }
    orbit.addEventListener('start', onStart)
    orbit.addEventListener('end', onEnd)
    const detachTouch = coarsePointer() ? attachTouch(orbit, gl.domElement, onStart, onEnd) : () => {}
    setControls(orbit)
    return () => {
      clearTimeout(resume)
      detachTouch()
      orbit.removeEventListener('start', onStart)
      orbit.removeEventListener('end', onEnd)
      orbit.dispose()
    }
  }, [camera, gl])

  // Frame Rome in the open space between the HUD panels: shift the projection
  // so the island is centered there, and pick the distance that fills it.
  useEffect(() => {
    if (!controls) return
    const freeWidth = Math.max(size.width - frame.left - frame.right, size.width * 0.4)
    const freeHeight = Math.max(size.height - frame.top, size.height * 0.6)
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    const pxPerUnitAt1 = size.height / (2 * tanHalfFov) // screen px per world unit at distance 1
    const distance = Math.max(
      (FIT_HALF_WIDTH * pxPerUnitAt1) / (freeWidth / 2),
      (FIT_HALF_HEIGHT * pxPerUnitAt1) / (freeHeight / 2),
    )

    camera.setViewOffset(size.width, size.height, (frame.right - frame.left) / 2, -frame.top / 2, size.width, size.height)
    const dir = camera.position.clone().sub(controls.target).normalize()
    camera.position.copy(controls.target).addScaledVector(dir, distance)
    camera.far = distance * 3
    camera.updateProjectionMatrix()

    controls.minDistance = distance * 0.45
    controls.maxDistance = distance * 1.3
    // the desktop HUD doesn't scroll, so the wheel is free to zoom the city
    controls.enableZoom = frame.left > 0
    if (scene.fog) {
      scene.fog.near = distance * 1.1
      scene.fog.far = distance * 2.4
    }
  }, [size.width, size.height, frame, camera, controls, scene])

  useFrame(() => controls?.update())
  return null
}

// the huts of Romulus on the Palatine, there from the very first click
function RomulusHuts() {
  return ROMULUS_HUTS.map(([x, z], i) => (
    <group key={i} position={[x, terrainHeight(x, z), z]}>
      <mesh geometry={G.column} material={M.wood} position={[0, 0.1, 0]} scale={[0.16, 0.2, 0.16]} castShadow />
      <mesh geometry={G.cone} material={M.hay} position={[0, 0.2, 0]} scale={[0.42, 0.26, 0.42]} castShadow />
    </group>
  ))
}

function Placed({ type, count, children }) {
  return SLOTS[type].slice(0, count).map((s, i) => (
    <Spawn key={i} position={[s.x, s.y, s.z]} rotation={s.rot} delay={i * 0.04}>
      {children(s, i)}
    </Spawn>
  ))
}

function Ship({ phase, lane }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.05 + phase
    const z = Math.sin(t) * 11.5
    const forward = Math.cos(t) >= 0 ? 1 : -1
    const slope = 0.4 * Math.cos(z * 0.25) // d riverX / dz
    ref.current.position.set(riverX(z) + lane * forward, -0.14 + Math.sin(clock.elapsedTime * 1.5 + phase) * 0.02, z)
    ref.current.rotation.y = Math.atan2(slope * forward, forward)
  })
  return (
    <group ref={ref} scale={0.85}>
      <Trireme />
    </group>
  )
}

function City({ owned, chapters }) {
  const n = (type) => shownCount(owned[type] ?? 0, ZONES[type]?.cap ?? 0)
  const has = (id) => chapters.includes(id)
  const ships = shownCount(owned.trireme ?? 0, 6)

  return (
    <>
      <RomulusHuts />
      <Spawn position={[WOLF_POS[0], terrainHeight(...WOLF_POS), WOLF_POS[1]]} rotation={0.5}>
        <group scale={1.3}>
          <CapitolineWolf />
        </group>
      </Spawn>
      <Placed type="farm" count={n('farm')}>
        {(s) => <Farm seed={s.seed} />}
      </Placed>
      <Placed type="colonus" count={n('colonus')}>
        {(s) => <House seed={s.seed} />}
      </Placed>
      <Placed type="amphora" count={n('amphora')}>
        {() => <Market />}
      </Placed>
      <Placed type="temple" count={n('temple')}>
        {() => <Temple />}
      </Placed>
      <Placed type="forum" count={n('forum')}>
        {() => <Forum />}
      </Placed>
      <Placed type="senate" count={n('senate')}>
        {() => <Senate />}
      </Placed>
      <Placed type="barracks" count={n('barracks')}>
        {() => <Castra />}
      </Placed>
      <Placed type="century" count={n('century')}>
        {(s, i) => <Century phase={i * 1.7} />}
      </Placed>
      <Aqueduct spans={shownCount(owned.aqueduct ?? 0, 13)} />
      {has('gauls') && <ServianWall />}
      <Ballistae count={shownCount(owned.ballista ?? 0, TOWERS.length)} />
      {has('colosseum') && <Colosseum />}
      {has('trajan') && <TrajansColumn />}
      {Array.from({ length: ships }, (_, i) => (
        <Ship key={i} phase={(i * Math.PI * 2) / Math.max(ships, 1)} lane={i % 2 ? 0.35 : -0.35} />
      ))}
    </>
  )
}

const NO_FRAME = { left: 0, right: 0, top: 0 }

export default function CityScene({ owned, chapters, frame = NO_FRAME }) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      camera={{ position: [15, 13.5, 15], fov: 34, near: 0.5, far: 150 }}
      gl={{ antialias: true, alpha: true }}
    >
      <fog attach="fog" args={['#e9b98a', 30, 70]} />
      <hemisphereLight args={['#ffe9c7', '#4d3b22', 1.1]} />
      <directionalLight
        position={[12, 16, 6]}
        intensity={2.4}
        color="#ffe0ad"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0005}
      />
      <CameraRig frame={frame} />
      <Land />
      <City owned={owned} chapters={chapters} />
      <Birds />
      <Clouds />
    </Canvas>
  )
}
