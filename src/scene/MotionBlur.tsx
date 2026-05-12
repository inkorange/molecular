'use client'

import { useThree } from '@react-three/fiber'
import { BlendFunction, Effect } from 'postprocessing'
import { useEffect, useMemo } from 'react'
import {
  HalfFloatType,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  ShaderMaterial,
  Scene as ThreeScene,
  Uniform,
  type WebGLRenderer,
  WebGLRenderTarget,
} from 'three'

interface MotionBlurProps {
  /**
   * 0 → off, 1 → previous frame fully replaces current frame. Subtle defaults
   * to ~0.35 — gives a soft smear behind moving things without making the
   * scene look stuttery.
   */
  intensity?: number
}

const fragmentShader = /* glsl */ `
  uniform sampler2D tPrevious;
  uniform float intensity;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec4 prev = texture2D(tPrevious, uv);
    outputColor = mix(inputColor, prev, intensity);
  }
`

/**
 * Frame-feedback motion blur. Each frame's output is a low-alpha blend of
 * the current frame with the previous frame, sampled from a feedback render
 * target. Two render targets are ping-ponged so the read target always holds
 * the prior frame's input while the write target is being filled.
 *
 * Not physically correct (no velocity buffer) but matches the "slight motion
 * blur" feel — anything moving or rotating in the scene leaves a soft trail.
 * Static frames cost only the texture copy + one extra shader invocation.
 */
class MotionBlurEffect extends Effect {
  private readonly targetA: WebGLRenderTarget
  private readonly targetB: WebGLRenderTarget
  private readTarget: WebGLRenderTarget
  private writeTarget: WebGLRenderTarget
  private readonly copyScene: ThreeScene
  private readonly copyCamera: OrthographicCamera
  private readonly copyMaterial: ShaderMaterial

  constructor(intensity = 0.35) {
    super('MotionBlurEffect', fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ['tPrevious', new Uniform(null)],
        ['intensity', new Uniform(intensity)],
      ]),
    })

    const targetOpts = {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      type: HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
    } as const
    this.targetA = new WebGLRenderTarget(1, 1, targetOpts)
    this.targetB = new WebGLRenderTarget(1, 1, targetOpts)
    this.readTarget = this.targetA
    this.writeTarget = this.targetB

    // Tiny scene with a fullscreen quad for copying inputBuffer → writeTarget.
    this.copyScene = new ThreeScene()
    this.copyCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.copyMaterial = new ShaderMaterial({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
          gl_FragColor = texture2D(tDiffuse, vUv);
        }
      `,
      depthWrite: false,
      depthTest: false,
    })
    this.copyScene.add(new Mesh(new PlaneGeometry(2, 2), this.copyMaterial))
  }

  override update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget): void {
    // 1. Point the fragment shader at last frame's saved input.
    this.uniforms.get('tPrevious')!.value = this.readTarget.texture

    // 2. Copy this frame's inputBuffer into the write target so the NEXT
    //    frame's read sees it.
    this.copyMaterial.uniforms.tDiffuse!.value = inputBuffer.texture
    const prevRT = renderer.getRenderTarget()
    renderer.setRenderTarget(this.writeTarget)
    renderer.render(this.copyScene, this.copyCamera)
    renderer.setRenderTarget(prevRT)

    // 3. Ping-pong for next frame.
    const tmp = this.readTarget
    this.readTarget = this.writeTarget
    this.writeTarget = tmp
  }

  override setSize(width: number, height: number): void {
    this.targetA.setSize(width, height)
    this.targetB.setSize(width, height)
  }

  setIntensity(value: number): void {
    this.uniforms.get('intensity')!.value = value
  }

  override dispose(): void {
    this.targetA.dispose()
    this.targetB.dispose()
    this.copyMaterial.dispose()
    this.copyScene.traverse((obj) => {
      if (obj instanceof Mesh) obj.geometry.dispose()
    })
    super.dispose()
  }
}

/**
 * `<MotionBlur />` — use as a child of `<EffectComposer>`. The custom Effect
 * gets auto-wrapped in an `EffectPass` by @react-three/postprocessing.
 */
export function MotionBlur({ intensity = 0.35 }: MotionBlurProps) {
  const size = useThree((s) => s.size)
  const effect = useMemo(() => new MotionBlurEffect(intensity), [intensity])

  // Sync intensity changes without re-creating the effect (which would lose
  // the feedback buffer mid-frame).
  useEffect(() => {
    effect.setIntensity(intensity)
  }, [effect, intensity])

  // Resize the feedback render targets when the canvas resizes.
  useEffect(() => {
    effect.setSize(size.width, size.height)
  }, [effect, size.width, size.height])

  // Dispose when the wrapper unmounts.
  useEffect(() => () => effect.dispose(), [effect])

  return <primitive object={effect} />
}
