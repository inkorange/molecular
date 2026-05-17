'use client'

import { Environment, OrbitControls, Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { type ReactNode, useEffect, useState } from 'react'
import { type DeviceTier, detectDeviceTier } from '@/src/lib/deviceTier'
import { MotionBlur } from './MotionBlur'

/**
 * Recovery fallback rendered when the WebGL context is lost (the
 * browser dropped the renderer — typically because too many contexts
 * are alive across the app, or the GPU itself crashed). Replaces the
 * blank white screen so the user has a way out.
 */
function ContextLostFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-extrabold text-[#dffaff] text-sm uppercase tracking-wider">
        3D renderer lost
      </p>
      <p className="max-w-[320px] text-[#9aa0c8] text-xs">
        The browser dropped the WebGL context. Reload the page to bring it back.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="button-glow inline-flex min-h-[40px] items-center gap-2 rounded-full px-5 py-1.5 font-extrabold text-white text-xs uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
        }}
      >
        Reload
      </button>
    </div>
  )
}

interface SceneProps {
  children: ReactNode
  enableBloom?: boolean
  /** Mount OrbitControls so the user can rotate/zoom the scene. Defaults to
   *  true (the /app uses it). Set false for decorative / preview scenes —
   *  e.g. the landing-page feature cards — where you don't want the user
   *  to fiddle with the camera. */
  interactive?: boolean
}

export function Scene({ children, enableBloom = true, interactive = true }: SceneProps) {
  // One-shot device-tier check on mount. Bloom + motion blur cost is
  // disproportionate on phones with ≤4 cores, so skip the entire
  // EffectComposer on `mobile-lite`. SSR defaults to 'desktop' so the
  // postprocessing path also runs in the production HTML preview.
  const [tier, setTier] = useState<DeviceTier>('desktop')
  useEffect(() => {
    setTier(detectDeviceTier())
  }, [])
  const useBloom = enableBloom && tier !== 'mobile-lite'

  // Track context-lost events so we can swap to a recovery UI instead of
  // letting the page go white. Browsers cap simultaneous WebGL contexts
  // (Chrome ~16) and forcibly drop the oldest when the cap is exceeded;
  // a hung GPU driver can also trigger this. Reload is the only reliable
  // way to get a fresh context after the loss.
  const [contextLost, setContextLost] = useState(false)
  if (contextLost) return <ContextLostFallback />

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{
        background: 'radial-gradient(circle at 50% 50%, #1a1135 0%, #07051a 100%)',
      }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement
        // Ignore context-lost events that arrive in the first 600ms
        // after Canvas creation. Some browsers fire a spurious
        // contextlost during the initial init handshake before the
        // context is actually usable — without this guard the user
        // saw the "renderer lost" recovery UI on a clean first load.
        const createdAt = performance.now()
        canvas.addEventListener(
          'webglcontextlost',
          (e) => {
            e.preventDefault()
            const age = performance.now() - createdAt
            if (age < 600) {
              console.warn('[Scene] Ignoring early context-lost event', { ageMs: Math.round(age) })
              return
            }
            console.warn('[Scene] WebGL context lost (real)')
            setContextLost(true)
          },
          { passive: false },
        )
        canvas.addEventListener('webglcontextrestored', () => {
          console.warn('[Scene] WebGL context restored')
          setContextLost(false)
        })
        // Explicitly release the GPU context when the renderer is torn
        // down. R3F's default dispose path doesn't always free the
        // context on its own, so navigations between pages with Canvases
        // accumulate live contexts until the browser cap (~16) is hit
        // and the OLDEST one is forcibly killed. We call the original
        // dispose FIRST so the renderer's internal cleanup runs, THEN
        // forceContextLoss to release the slot.
        gl.dispose = ((orig) =>
          function disposeWithCtxLoss(this: typeof gl) {
            const ret = orig.call(this)
            try {
              gl.forceContextLoss()
            } catch {
              // ignore — context may already be lost
            }
            return ret
          })(gl.dispose)
      }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} />
      {/* Subtle environment map — adds reflections to any metalness>0 material
          without rendering a visible skybox. ~256KB one-time load, ~free per frame. */}
      <Environment preset="night" background={false} environmentIntensity={0.45} />
      <Stars radius={50} depth={50} count={3000} factor={4} fade speed={1} />
      {interactive && (
        <OrbitControls
          makeDefault
          enablePan={false}
          enableRotate
          enableZoom
          minDistance={2}
          maxDistance={40}
          target={[0, 0, 0]}
        />
      )}
      <group>{children}</group>
      {useBloom && (
        <EffectComposer>
          <Bloom intensity={0.8} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
          <MotionBlur intensity={0.3} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
