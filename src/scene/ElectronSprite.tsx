'use client'

import { useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import { AdditiveBlending, Sprite, SpriteMaterial, type Vector3Tuple } from 'three'

interface ElectronSpriteProps {
  position: Vector3Tuple
  scale?: number
  color?: string
  opacity?: number
}

export function ElectronSprite({
  position,
  scale = 0.08,
  color = '#ffe07c',
  opacity = 1,
}: ElectronSpriteProps) {
  const texture = useTexture('/textures/electron.png')
  // New material per (color, opacity) combo so trail sprites have their own alpha.
  const material = useMemo(() => {
    return new SpriteMaterial({
      map: texture,
      color,
      opacity,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
  }, [texture, color, opacity])

  return (
    <primitive object={new Sprite(material)} position={position} scale={[scale, scale, scale]} />
  )
}
