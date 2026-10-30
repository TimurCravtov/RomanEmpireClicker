import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Aqueduct, Ballistae, Birds, Clouds, Colosseum, Land, ServianWall, TOWERS, TrajansColumn } from './landmarks.jsx'
import { SLOTS, ZONES, riverX, shownCount, terrainHeight } from './layout.js'
import { Castra, Century, Farm, Forum, G, House, M, Market, Senate, Spawn, Temple, Trireme } from './models.jsx'

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const coarsePointer = () => window.matchMedia?.('(pointer: coarse)').matches

function CameraRig() {
  const { camera, gl, size } = useThree()
  const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl])

  // pull back on narrow screens so the whole island fits
  useEffect(() => {
    const aspect = size.width / size.height
    const distance = aspect < 1.6 ? 40 : aspect > 3 ? 31 : 34
    const dir = camera.position.clone().sub(controls.target).normalize()
    camera.position.copy(controls.target).addScaledVector(dir, distance)
  }, [size.width, size.height, camera, controls])

  useEffect(() => {
    const reduced = prefersReducedMotion()
    controls.target.set(0, 0.4, 0)
    controls.enableDamping = true
    controls.enablePan = false
    controls.enableZoom = false // don't hijack page scrolling
    controls.minPolarAngle = 0.55
    controls.maxPolarAngle = 1.25
    controls.autoRotate = !reduced
    controls.autoRotateSpeed = 0.35
    if (coarsePointer()) {
      // on touch screens let the page scroll; the city turns by itself
      controls.enabled = false
      gl.domElement.style.touchAction = 'pan-y'
    }
    let resume
    const onStart = () => {
      controls.autoRotate = false
      clearTimeout(resume)
    }
    const onEnd = () => {
      resume = setTimeout(() => (controls.autoRotate = !reduced), 4000)
    }
    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)
    return () => {
      clearTimeout(resume)
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
      controls.dispose()
    }
  }, [controls, gl])

  useFrame(() => controls.update())
  return null
}

// the huts of Romulus on the Palatine, there from the very first click
function RomulusHuts() {
  return [
    [0.2, 0.3],
    [-0.5, -0.2],
    [0.6, -0.5],
  ].map(([x, z], i) => (
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

export default function CityScene({ owned, chapters }) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      camera={{ position: [16, 11, 16], fov: 34, near: 0.5, far: 120 }}
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
      <CameraRig />
      <Land />
      <City owned={owned} chapters={chapters} />
      <Birds />
      <Clouds />
    </Canvas>
  )
}
