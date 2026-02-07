/**
 * AgentScene - 3D Scene for Agent Visualization
 *
 * Creates a 3D environment with hexagonal zones for each agent.
 * Based on Vibecraft's WorkshopScene, simplified for agent monitoring.
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import type { AgentState, AgentZone, StationType, AgentStatus } from '@shared/types'

export class AgentScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls

  private agentZones: Map<string, AgentZone> = new Map()
  private agentMeshes: Map<string, THREE.Group> = new Map()
  private zoneMeshes: Map<string, THREE.Group> = new Map()

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

    this.agentZones.set(agentId, zone)
    return zone
  }

  private createZoneMesh(color: number, label: string): THREE.Group {
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

    // Body (robot-like character)
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

    // Head
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

    // Status ring
    const ringGeo = new THREE.TorusGeometry(0.8, 0.08, 8, 32)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x666666 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.1
    group.add(ring)

    return group
  }

  updateAgentStatus(agentId: string, status: AgentStatus): void {
    const agentMesh = this.agentMeshes.get(agentId)
    if (!agentMesh) return

    // Update status ring color
    const ring = agentMesh.children.find(c => c.geometry?.type === 'TorusGeometry') as THREE.Mesh
    if (ring && ring.material) {
      const statusColors = {
        online: 0x22c55e,
        offline: 0x6b7280,
        busy: 0xf59e0b,
        error: 0xef4444,
      }
      ;(ring.material as THREE.MeshBasicMaterial).color = new THREE.Color(statusColors[status])
    }

    // Update zone opacity based on status
    const zoneMesh = this.zoneMeshes.get(agentId)
    if (zoneMesh) {
      const platform = zoneMesh.children[0] as THREE.Mesh
      if (platform.material) {
        const opacity = status === 'offline' ? 0.05 : 0.15
        ;(platform.material as THREE.MeshStandardMaterial).opacity = opacity
      }
    }

    // Update zone data
    const zone = this.agentZones.get(agentId)
    if (zone) {
      zone.status = status
    }
  }

  setFocusedZone(agentId: string | null): void {
    this.focusedZoneId = agentId

    // Reset all zones
    this.zoneMeshes.forEach((mesh, id) => {
      const platform = mesh.children[0] as THREE.Mesh
      if (platform.material) {
        ;(platform.material as THREE.MeshStandardMaterial).opacity = id === agentId ? 0.25 : 0.15
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

    // Animate agents (idle floating)
    const time = Date.now() * 0.001
    this.agentMeshes.forEach((mesh, agentId) => {
      if (mesh) {
        mesh.position.y = Math.sin(time + mesh.position.x) * 0.1
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
    this.renderer.dispose()
  }
}
