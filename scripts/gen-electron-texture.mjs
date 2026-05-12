import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCanvas } from 'canvas'

const SIZE = 128
const canvas = createCanvas(SIZE, SIZE)
const ctx = canvas.getContext('2d')

const gradient = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, SIZE / 2)
gradient.addColorStop(0, 'rgba(255, 245, 180, 1)')
gradient.addColorStop(0.35, 'rgba(255, 224, 124, 0.85)')
gradient.addColorStop(0.7, 'rgba(255, 200, 60, 0.2)')
gradient.addColorStop(1, 'rgba(255, 200, 60, 0)')
ctx.fillStyle = gradient
ctx.fillRect(0, 0, SIZE, SIZE)

const out = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'textures',
  'electron.png',
)
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, canvas.toBuffer('image/png'))
console.log('Wrote', out)
