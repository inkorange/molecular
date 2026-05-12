'use client'

import { useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import { AdditiveBlending, Sprite, SpriteMaterial, type Vector3Tuple } from 'three'

interface ElectronSpriteProps {
  position: Vector3Tuple
  scale?: number
  color?: string
}

export function ElectronSprite({ position, scale = 0.08, color = '#ffe07c' }: ElectronSpriteProps) {
  const texture = useTexture('/textures/electron.png')
  // Memoize the material so all sprites share one instance per color.
  const material = useMemo(() => {
    return new SpriteMaterial({
      map: texture,
      color,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
  }, [texture, color])

  return (
    <primitive object={new Sprite(material)} position={position} scale={[scale, scale, scale]} />
  )
}
