'use client'

import { Environment, OrbitControls, Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { type ReactNode, useEffect, useState } from 'react'
import { type DeviceTier, detectDeviceTier } from '@/src/lib/deviceTier'
import { MotionBlur } from './MotionBlur'

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
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      style={{
        background: 'radial-gradient(circle at 50% 50%, #1a1135 0%, #07051a 100%)',
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
