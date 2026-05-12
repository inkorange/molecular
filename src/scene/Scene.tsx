'use client'

import { OrbitControls, Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import type { ReactNode } from 'react'

interface SceneProps {
  children: ReactNode
  enableBloom?: boolean
}

export function Scene({ children, enableBloom = true }: SceneProps) {
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
      <Stars radius={50} depth={50} count={3000} factor={4} fade speed={1} />
      <OrbitControls
        enablePan
        enableRotate
        enableZoom
        minDistance={2}
        maxDistance={20}
        target={[0, 0, 0]}
      />
      <group>{children}</group>
      {enableBloom && (
        <EffectComposer>
          <Bloom intensity={0.8} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      )}
    </Canvas>
  )
}
