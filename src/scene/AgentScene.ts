/**
 * AgentScene - 3D Scene for Agent Visualization
 *
 * Creates a 3D environment with hexagonal zones for each agent.
 * Features:
 * - 10+ agent states with unique visual indicators
 * - State-specific animations (thinking, working, waiting, etc.)
 * - Particle effects for different states
 * - Progress indicators for active tasks
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { AgentZone, AgentStatus } from '@shared/types'

// 状态颜色配置
const STATUS_COLORS: Record<AgentStatus, number> = {
  online: 0x22c55e,        // green
  offline: 0x6b7280,       // gray
  error: 0xef4444,         // red
  busy: 0xf59e0b,          // amber
  thinking: 0x8b5cf6,      // purple (思考中)
  ready: 0x3b82f6,         // blue (就绪)
  waiting: 0xf97316,       // orange (等待)
  paused: 0xa855f7,        // purple (暂停)
  stopped: 0x64748b,       // slate (停止)
  initializing: 0x0ea5e9,  // sky (初始化)
}

// Agent 动画状态
interface AgentAnimationState {
  status: AgentStatus
  animTime: number
  floatOffset: number
  rotationSpeed: number
  pulseIntensity: number
  particleActive: boolean
}

export class AgentScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls

  private agentZones: Map<string, AgentZone> = new Map()
  private agentMeshes: Map<string, THREE.Group> = new Map()
  private agentAnimations: Map<string, AgentAnimationState> = new Map()
  private zoneMeshes: Map<string, THREE.Group> = new Map()
  private particleSystems: Map<string, THREE.Points> = new Map()

  private readonly colors = [0x4ade80, 0x60a5fa, 0xf472b6, 0xa78bfa, 0xfbbf24, 0x2dd4bf]

  private focusedZoneId: string | null = null

  constructor(container: HTMLElement) {
    // Scene setup
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a0f)
    this.scene.fog = new THREE.Fog(0x0a0a0f, 50, 150)

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 30, 40)
    this.camera.lookAt(0, 0, 0)

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.BasicShadowMap
    container.appendChild(this.renderer.domElement)

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.maxPolarAngle = Math.PI / 2.2
    this.controls.minDistance = 15
    this.controls.maxDistance = 100

    // Lighting
    this.setupLighting()

    // Ground
    this.createGround()

    // Handle resize
    window.addEventListener('resize', this.onResize.bind(this))

    // Start animation loop
    this.animate()
  }

  private setupLighting(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambient)

    // Hemisphere light
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6)
    hemi.position.set(0, 20, 0)
    this.scene.add(hemi)

    // Directional light (sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(10, 20, 10)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 1024
    dirLight.shadow.mapSize.height = 1024
    this.scene.add(dirLight)
  }

  private createGround(): void {
    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(200, 200)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
      metalness: 0.1,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.1
    ground.receiveShadow = true
    this.scene.add(ground)

    // Hex grid pattern
    this.createWorldHexGrid()
  }

  private createWorldHexGrid(): void {
    const hexSize = 2
    const gridRadius = 8
    const hexGroup = new THREE.Group()

    // Create hex grid using axial coordinates
    for (let q = -gridRadius; q <= gridRadius; q++) {
      for (let r = -gridRadius; r <= gridRadius; r++) {
        if (Math.abs(q + r) <= gridRadius) {
          const { x, z } = this.hexToCartesian(q, r)
          const hex = this.createHexOutline(hexSize)
          hex.position.set(x, 0.02, z)
          hexGroup.add(hex)
        }
      }
    }

    this.scene.add(hexGroup)
  }

  private createHexOutline(size: number): THREE.Line {
    const points: THREE.Vector3[] = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      points.push(new THREE.Vector3(
        Math.cos(angle) * size,
        0,
        Math.sin(angle) * size
      ))
    }
    // Close the hexagon
    points.push(points[0].clone())

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: 0x333355,
      transparent: true,
      opacity: 0.3,
    })
    return new THREE.Line(geometry, material)
  }

  private hexToCartesian(q: number, r: number): { x: number; z: number } {
    const size = 4.5 // Hex size (center to corner)
    const x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r)
    const z = size * (3 / 2 * r)
    return { x, z }
  }

  private indexToHexCoord(index: number): { q: number; r: number } {
    if (index === 0) return { q: 0, r: 0 }

    let ring = 1
    let count = 1
    let firstInRing = 1

    // Find which ring the index is in
    while (count + ring * 6 <= index) {
      count += ring * 6
      firstInRing = count
      ring++
    }

    const offset = index - firstInRing
    const side = Math.floor(offset / ring)
    const sideOffset = offset % ring

    // Convert to axial coordinates
    const directions = [
      { dq: 1, dr: 0 },   // right
      { dq: 0, dr: 1 },   // bottom right
      { dq: -1, dr: 1 },  // bottom left
      { dq: -1, dr: 0 },  // left
      { dq: 0, dr: -1 },  // top left
      { dq: 1, dr: -1 },  // top right
    ]

    // Start position for this ring
    let q = ring
    let r = 0

    // Move along the ring to the correct side
    for (let i = 0; i < side; i++) {
      q += directions[i].dq
      r += directions[i].dr
    }

    // Move along the side to the correct position
    const lastDir = directions[side]
    for (let i = 0; i < sideOffset; i++) {
      q += lastDir.dq
      r += lastDir.dr
    }

    return { q, r }
  }

  // ========================================================================
  // Agent Zone Management
  // ========================================================================

  createAgentZone(agentId: string, index: number): AgentZone {
    const hexCoord = this.indexToHexCoord(index)
    const { x, z } = this.hexToCartesian(hexCoord.q, hexCoord.r)
    const color = this.colors[index % this.colors.length]

    const zone: AgentZone = {
      id: agentId,
      agentId,
      position: { x, y: 0, z },
      color,
      status: 'offline',
    }

    // Create zone mesh
    const zoneMesh = this.createZoneMesh(color, agentId)
    zoneMesh.position.set(x, 0, z)
    this.scene.add(zoneMesh)
    this.zoneMeshes.set(agentId, zoneMesh)

    // Create agent character
    const agentMesh = this.createAgentMesh(color)
    agentMesh.position.set(x, 0, z)
    this.scene.add(agentMesh)
    this.agentMeshes.set(agentId, agentMesh)

    // Initialize animation state
    this.agentAnimations.set(agentId, {
      status: 'offline',
      animTime: 0,
      floatOffset: 0,
      rotationSpeed: 0,
      pulseIntensity: 0,
      particleActive: false,
    })

    this.agentZones.set(agentId, zone)
    return zone
  }

  private createZoneMesh(color: number, _label: string): THREE.Group {
    const group = new THREE.Group()

    // Hexagonal platform
    const shape = new THREE.Shape()
    const size = 3.5
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      const x = Math.cos(angle) * size
      const y = Math.sin(angle) * size
      if (i === 0) {
        shape.moveTo(x, y)
      } else {
        shape.lineTo(x, y)
      }
    }
    shape.closePath()

    const extrudeSettings = { depth: 0.3, bevelEnabled: false }
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    const material = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.15,
      roughness: 0.5,
      metalness: 0.5,
    })
    const platform = new THREE.Mesh(geometry, material)
    platform.rotation.x = -Math.PI / 2
    platform.receiveShadow = true
    group.add(platform)

    // Edge highlight
    const edgeGeo = new THREE.EdgesGeometry(geometry)
    const edgeMat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
    })
    const edges = new THREE.LineSegments(edgeGeo, edgeMat)
    edges.rotation.x = -Math.PI / 2
    edges.position.y = 0.01
    group.add(edges)

    return group
  }

  private createAgentMesh(color: number): THREE.Group {
    const group = new THREE.Group()

    // Body (robot-like character - capsule)
    const bodyGeo = new THREE.CapsuleGeometry(0.5, 1, 8, 16)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x4444aa,
      roughness: 0.3,
      metalness: 0.7,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 1.5
    body.castShadow = true
    group.add(body)

    // Head (sphere)
    const headGeo = new THREE.SphereGeometry(0.4, 16, 16)
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x6666cc,
      roughness: 0.3,
      metalness: 0.7,
    })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 2.6
    head.castShadow = true
    group.add(head)

    // Eyes (glowing)
    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8)
    const eyeMat = new THREE.MeshBasicMaterial({ color })
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
    leftEye.position.set(-0.15, 2.65, 0.3)
    group.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
    rightEye.position.set(0.15, 2.65, 0.3)
    group.add(rightEye)

    // Status ring (torus)
    const ringGeo = new THREE.TorusGeometry(0.8, 0.08, 8, 32)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x666666 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.1
    ring.name = 'statusRing'
    group.add(ring)

    // Antenna (for thinking state visualization)
    const antennaGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8)
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0x888888 })
    const antenna = new THREE.Mesh(antennaGeo, antennaMat)
    antenna.position.set(0, 3.1, 0)
    antenna.name = 'antenna'
    antenna.visible = false
    group.add(antenna)

    // Antenna bulb
    const bulbGeo = new THREE.SphereGeometry(0.12, 8, 8)
    const bulbMat = new THREE.MeshBasicMaterial({ color })
    const bulb = new THREE.Mesh(bulbGeo, bulbMat)
    bulb.position.set(0, 3.35, 0)
    bulb.name = 'antennaBulb'
    bulb.visible = false
    group.add(bulb)

    return group
  }

  updateAgentStatus(agentId: string, status: AgentStatus): void {
    const agentMesh = this.agentMeshes.get(agentId)
    if (!agentMesh) return

    const animState = this.agentAnimations.get(agentId)
    if (!animState) return

    // Update animation state based on status
    animState.status = status
    animState.animTime = 0

    // Configure animation parameters per status
    switch (status) {
      case 'online':
        animState.rotationSpeed = 0.05
        animState.pulseIntensity = 0.15
        animState.particleActive = false
        this.removeParticleSystem(agentId)
        break
      case 'thinking':
        animState.rotationSpeed = 1.0
        animState.pulseIntensity = 0.5
        animState.particleActive = true
        this.createParticleSystem(agentId, STATUS_COLORS.thinking)
        break
      case 'busy':
        animState.rotationSpeed = 0.5
        animState.pulseIntensity = 0.3
        animState.particleActive = true
        this.createParticleSystem(agentId, STATUS_COLORS.busy)
        break
      case 'ready':
        animState.rotationSpeed = 0.1
        animState.pulseIntensity = 0.2
        animState.particleActive = false
        this.removeParticleSystem(agentId)
        break
      case 'waiting':
        animState.rotationSpeed = 0.2
        animState.pulseIntensity = 0.4
        animState.particleActive = true
        this.createParticleSystem(agentId, STATUS_COLORS.waiting)
        break
      case 'error':
        animState.rotationSpeed = 0
        animState.pulseIntensity = 0.8
        animState.particleActive = true
        this.createParticleSystem(agentId, STATUS_COLORS.error)
        break
      case 'paused':
        animState.rotationSpeed = 0
        animState.pulseIntensity = 0.1
        animState.particleActive = false
        this.removeParticleSystem(agentId)
        break
      case 'stopped':
        animState.rotationSpeed = 0
        animState.pulseIntensity = 0
        animState.particleActive = false
        this.removeParticleSystem(agentId)
        break
      case 'initializing':
        animState.rotationSpeed = 0.8
        animState.pulseIntensity = 0.6
        animState.particleActive = true
        this.createParticleSystem(agentId, STATUS_COLORS.initializing)
        break
      default:
        animState.rotationSpeed = 0
        animState.pulseIntensity = 0
        animState.particleActive = false
        this.removeParticleSystem(agentId)
    }

    // Update status ring color
    const ring = agentMesh.children.find(c => c.name === 'statusRing') as THREE.Mesh
    if (ring && ring.material) {
      (ring.material as THREE.MeshBasicMaterial).color = new THREE.Color(STATUS_COLORS[status])
    }

    // Show/hide antenna for thinking state
    const antenna = agentMesh.children.find(c => c.name === 'antenna')
    const bulb = agentMesh.children.find(c => c.name === 'antennaBulb')
    if (antenna && bulb) {
      const showAntenna = status === 'thinking' || status === 'busy'
      antenna.visible = showAntenna
      bulb.visible = showAntenna
      if (bulb.children[0] && (bulb.children[0] as THREE.Mesh).material) {
        ((bulb.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).color =
          new THREE.Color(STATUS_COLORS[status])
      }
    }

    // Update zone opacity based on status
    const zoneMesh = this.zoneMeshes.get(agentId)
    if (zoneMesh) {
      const platform = zoneMesh.children[0] as THREE.Mesh
      if (platform.material) {
        const opacityMap: Record<AgentStatus, number> = {
          offline: 0.05,
          online: 0.15,
          error: 0.2,
          busy: 0.2,
          thinking: 0.25,
          ready: 0.15,
          waiting: 0.2,
          paused: 0.1,
          stopped: 0.08,
          initializing: 0.2,
        }
        ;(platform.material as THREE.MeshStandardMaterial).opacity = opacityMap[status]
      }
    }

    // Update zone data
    const zone = this.agentZones.get(agentId)
    if (zone) {
      zone.status = status
    }
  }

  private createParticleSystem(agentId: string, color: number): void {
    // Remove existing particles
    this.removeParticleSystem(agentId)

    const particleCount = 50
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    const colorObj = new THREE.Color(color)

    for (let i = 0; i < particleCount; i++) {
      // Random position in a sphere around the agent
      const radius = 2 + Math.random() * 2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = 1.5 + radius * Math.cos(phi)
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)

      colors[i * 3] = colorObj.r
      colors[i * 3 + 1] = colorObj.g
      colors[i * 3 + 2] = colorObj.b

      sizes[i] = Math.random() * 0.1 + 0.05
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)
    this.particleSystems.set(agentId, particles)
  }

  private removeParticleSystem(agentId: string): void {
    const particles = this.particleSystems.get(agentId)
    if (particles) {
      this.scene.remove(particles)
      particles.geometry.dispose()
      ;(particles.material as THREE.Material).dispose()
      this.particleSystems.delete(agentId)
    }
  }

  setFocusedZone(agentId: string | null): void {
    this.focusedZoneId = agentId

    // Reset all zones
    this.zoneMeshes.forEach((mesh, id) => {
      const platform = mesh.children[0] as THREE.Mesh
      if (platform.material) {
        const focused = this.focusedZoneId !== null && id === this.focusedZoneId
        ;(platform.material as THREE.MeshStandardMaterial).opacity = focused ? 0.3 : 0.15
        ;(platform.material as THREE.MeshStandardMaterial).emissive =
          new THREE.Color(focused ? 0x333366 : 0x000000)
      }
    })
  }

  getZoneWorldPosition(agentId: string): THREE.Vector3 | null {
    const zone = this.agentZones.get(agentId)
    return zone ? new THREE.Vector3(zone.position.x, zone.position.y, zone.position.z) : null
  }

  // ========================================================================
  // Animation Loop
  // ========================================================================

  private animate = (): void => {
    requestAnimationFrame(this.animate)

    const time = Date.now() * 0.001

    // Animate agents
    this.agentMeshes.forEach((mesh, agentId) => {
      const animState = this.agentAnimations.get(agentId)
      if (!animState) return

      animState.animTime += 0.016 // ~60fps

      // Floating animation (all states)
      const floatSpeed = animState.status === 'thinking' ? 1.5 :
                        animState.status === 'busy' ? 1.0 : 0.5
      mesh.position.y = Math.sin(time * floatSpeed + mesh.position.x) * 0.15

      // Rotation animation (for thinking state)
      if (animState.rotationSpeed > 0) {
        mesh.rotation.y += animState.rotationSpeed * 0.02
      }

      // Pulse animation
      if (animState.pulseIntensity > 0) {
        const pulse = 1 + Math.sin(time * 3) * animState.pulseIntensity * 0.1
        mesh.scale.set(pulse, pulse, pulse)
      } else {
        mesh.scale.set(1, 1, 1)
      }

      // Animate particles
      const particles = this.particleSystems.get(agentId)
      if (particles && animState.particleActive) {
        particles.rotation.y += 0.005
        const positions = particles.geometry.attributes.position.array as Float32Array
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += Math.sin(time + i) * 0.005
        }
        particles.geometry.attributes.position.needsUpdate = true
      }

      // Animate antenna bulb (for thinking state)
      const bulb = mesh.children.find(c => c.name === 'antennaBulb')
      if (bulb && bulb.visible) {
        const bulbPulse = (Math.sin(time * 5) + 1) * 0.5
        ;(bulb as THREE.Mesh).scale.setScalar(1 + bulbPulse * 0.3)
      }
    })

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  // ========================================================================
  // Public API
  // ========================================================================

  getScene(): THREE.Scene {
    return this.scene
  }

  getCamera(): THREE.Camera {
    return this.camera
  }

  getControls(): OrbitControls {
    return this.controls
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize.bind(this))

    // Dispose all particle systems
    this.particleSystems.forEach(particles => {
      this.scene.remove(particles)
      particles.geometry.dispose()
      ;(particles.material as THREE.Material).dispose()
    })
    this.particleSystems.clear()

    this.renderer.dispose()
  }
}
