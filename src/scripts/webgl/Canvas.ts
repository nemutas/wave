import * as THREE from 'three'
import { mouse2d } from './Mouse2D'
import { three } from './core/Three'
import vertexShader from './shader/quadVs.glsl'
import fragmentShader from './shader/screenFs.glsl'
import { gui } from './Gui'

type Wave = { position: [number, number]; progress: number; direction: [number, number] }

export class Canvas {
  private readonly SIZE = 200
  private wave!: THREE.Mesh<THREE.BufferGeometry, THREE.RawShaderMaterial>

  constructor(canvas: HTMLCanvasElement) {
    this.loadTextures().then((textures) => {
      this.init(canvas)
      this.wave = this.createWave(textures.find(({ name }) => name === 'unsplash')!)
      this.addEvents()
      three.animation(this.anime)
    })
  }

  private async loadTextures() {
    const loader = new THREE.TextureLoader()
    const paths = ['unsplash.jpg']

    return await Promise.all(
      paths.map(async (path) => {
        const texture = await loader.loadAsync(import.meta.env.BASE_URL + 'images/' + path)
        texture.name = path.split('.')[0]
        return texture
      }),
    )
  }

  private init(canvas: HTMLCanvasElement) {
    three.setup(canvas)
    three.scene.background = new THREE.Color('#000')
  }

  private createWave(texture: THREE.Texture) {
    const waves: Wave[] = []
    for (let i = 0; i < this.SIZE; i++) {
      waves.push({ position: [0, 0], progress: 1, direction: [0, 0] })
    }

    const fs = fragmentShader.replaceAll('SIZE', this.SIZE.toFixed(0))

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        uAspect: { value: three.size.aspect },
        uWaves: { value: waves },
        tImage: { value: texture },
        uCoveredScale: { value: three.coveredScale(texture.source.data.width / texture.source.data.height) },
        uDebug: { value: false },
      },
      vertexShader,
      fragmentShader: fs,
    })
    const mesh = new THREE.Mesh(geometry, material)
    three.scene.add(mesh)
    three.addDisposableObject(geometry, material, texture)

    gui.add(material.uniforms.uDebug, 'value').name('debug')

    return mesh
  }

  private addEvents() {
    three.addEventListener('resize', () => {
      const uniforms = this.wave.material.uniforms
      uniforms.uAspect.value = three.size.aspect

      const { width, height } = uniforms.tImage.value.source.data
      uniforms.uCoveredScale.value = three.coveredScale(width / height)
    })
  }

  private anime = () => {
    const waves = this.wave.material.uniforms.uWaves.value as Wave[]
    const velo = mouse2d.velocity()

    if (0.001 < Math.hypot(...velo)) {
      const wave = waves.pop()!
      wave.position = mouse2d.posArray
      wave.progress = 0
      wave.direction = velo
      waves.unshift(wave)
    }

    for (const wave of waves) {
      wave.progress += three.time.delta * 0.9
      wave.progress = Math.min(1, wave.progress)
    }

    three.render()
  }

  dispose() {
    three.dispose()
  }
}
