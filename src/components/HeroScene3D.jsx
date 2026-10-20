import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * HeroScene3D
 * Modelado y animación 3D realista de tijera de barbero profesional con Three.js:
 * - PivotGroup central anclado exactamente en (0, 0, 0).
 * - Perno/tornillo pivote central visible en latón dorado satinado con hendidura.
 * - Dos mitades articuladas simétricas (bladeGroupA y bladeGroupB) ancladas al perno central.
 *   * bladeGroupA: Hoja de corte cónica/afilada, vástago, anillo y tang curvo (apoyo meñique).
 *   * bladeGroupB: Hoja de corte opuesta, vástago y anillo para el pulgar.
 * - Animación de corte sincronizada:
 *     const angle = Math.sin(time * 2.0) * 0.20;
 *     bladeGroupA.rotation.z = angle;
 *     bladeGroupB.rotation.z = -angle;
 * - Inercia y balanceo suave con amortiguación lineal (lerp).
 * - Canvas no intrusivo con pointer-events: none.
 * - Rendimiento estricto: 60 FPS, pixelRatio <= 2, y pausa en document.hidden.
 */
export default function HeroScene3D() {
  const mountRef = useRef(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    let animationFrameId = null
    let isPaused = false
    let width = container.clientWidth || window.innerWidth
    let height = container.clientHeight || 600

    // Escena y cámara
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 0, 7.5)

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch (e) {
      console.warn('[HeroScene3D] WebGL no soportado:', e)
      return
    }

    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.pointerEvents = 'none'

    container.appendChild(renderer.domElement)

    // Grupo Maestro (posicionamiento de escena)
    const masterGroup = new THREE.Group()
    scene.add(masterGroup)

    const isDesktop = width > 860
    masterGroup.position.set(isDesktop ? 1.35 : 0, -0.1, 0)
    masterGroup.scale.setScalar(isDesktop ? 1.05 : 0.88)

    // Materiales prémium en latón cálido/oro satinado
    const goldShearMaterial = new THREE.MeshStandardMaterial({
      color: 0xc5a880,
      metalness: 0.85,
      roughness: 0.28,
    })

    const goldAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0xdfc59e,
      metalness: 0.92,
      roughness: 0.22,
    })

    const screwSlotMaterial = new THREE.MeshStandardMaterial({
      color: 0x242019,
      metalness: 0.7,
      roughness: 0.5,
    })

    // =========================================================
    // 1. PIVOT GROUP CENTRAL ANCLADO EN (0, 0, 0)
    // =========================================================
    const pivotGroup = new THREE.Group()
    pivotGroup.position.set(0, 0, 0)
    masterGroup.add(pivotGroup)

    // Perno / tornillo pivote central visible
    const screwGroup = new THREE.Group()

    // Cabeza del perno (cilindro achatado con bisel)
    const boltHeadGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.16, 32)
    const boltHead = new THREE.Mesh(boltHeadGeo, goldAccentMaterial)
    boltHead.rotation.x = Math.PI / 2
    screwGroup.add(boltHead)

    // Arandela decorativa biselada
    const washerGeo = new THREE.TorusGeometry(0.28, 0.035, 16, 32)
    const washer = new THREE.Mesh(washerGeo, goldShearMaterial)
    screwGroup.add(washer)

    // Hendidura/ranura del tornillo (slot visible de precisión)
    const slotGeo = new THREE.BoxGeometry(0.32, 0.035, 0.05)
    slotGeo.translate(0, 0, 0.08)
    const slotMesh = new THREE.Mesh(slotGeo, screwSlotMaterial)
    screwGroup.add(slotMesh)

    // Parte trasera del perno (tuerca de ajuste en el reverso)
    const boltNutGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.08, 32)
    boltNutGeo.translate(0, 0, -0.09)
    const boltNut = new THREE.Mesh(boltNutGeo, goldAccentMaterial)
    boltNut.rotation.x = Math.PI / 2
    screwGroup.add(boltNut)

    pivotGroup.add(screwGroup)

    // =========================================================
    // 2. FUNCIÓN DE CONSTRUCCIÓN DE HOJA DE CORTE DE BARBERÍA
    // =========================================================
    function createBladeGeometry(isLeft = false) {
      // Perfil afilado: filo interior recto en x=0, lomo convexo biselado en el exterior
      const shape = new THREE.Shape()
      const sign = isLeft ? 1 : -1

      shape.moveTo(0, 0)
      // Base ancha del filo
      shape.lineTo(sign * 0.28, 0.1)
      // Lomo exterior que se estrecha hacia la punta
      shape.quadraticCurveTo(sign * 0.26, 1.5, sign * 0.06, 2.7)
      // Punta redondeada afilada
      shape.quadraticCurveTo(0, 2.85, 0, 2.85)
      // Filo de corte interior plano
      shape.lineTo(0, 0)

      const extrudeSettings = {
        depth: 0.06,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.02,
        bevelThickness: 0.02,
      }

      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
      geo.center()
      // Alinear la base del filo exactamente con el pivote (0, 0)
      geo.translate(0, 1.45, 0)
      return geo
    }

    // =========================================================
    // 3. BRAZO A (bladeGroupA): HOJA, VÁSTAGO, ANILLO Y TANG
    // =========================================================
    const bladeGroupA = new THREE.Group()
    bladeGroupA.position.set(0, 0, 0.045) // Offset Z para traslape de corte real

    // Hoja A
    const bladeGeoA = createBladeGeometry(false)
    const bladeMeshA = new THREE.Mesh(bladeGeoA, goldShearMaterial)
    bladeGroupA.add(bladeMeshA)

    // Vástago/cuello A continuo desde el eje hacia el mango
    const shankCurveA = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.05, 0),
      new THREE.Vector3(-0.14, -0.65, 0),
      new THREE.Vector3(-0.32, -1.25, 0),
    ])
    const shankGeoA = new THREE.TubeGeometry(shankCurveA, 24, 0.068, 16, false)
    const shankMeshA = new THREE.Mesh(shankGeoA, goldShearMaterial)
    bladeGroupA.add(shankMeshA)

    // Anillo/ojo para el dedo A (Dedo anular)
    const ringGeoA = new THREE.TorusGeometry(0.38, 0.065, 20, 36)
    const ringMeshA = new THREE.Mesh(ringGeoA, goldAccentMaterial)
    ringMeshA.position.set(-0.44, -1.60, 0)
    ringMeshA.rotation.y = 0.08
    bladeGroupA.add(ringMeshA)

    // Tang / Apoyo curvado para el meñique (clásico de barbería profesional)
    const tangCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.78, -1.68, 0),
      new THREE.Vector3(-1.08, -1.78, 0.06),
      new THREE.Vector3(-1.26, -1.58, 0.12),
      new THREE.Vector3(-1.32, -1.42, 0.16),
    ])
    const tangGeo = new THREE.TubeGeometry(tangCurve, 24, 0.038, 12, false)
    const tangMesh = new THREE.Mesh(tangGeo, goldShearMaterial)
    bladeGroupA.add(tangMesh)

    // Terminal esférico suave del tang
    const tangTipGeo = new THREE.SphereGeometry(0.046, 16, 16)
    const tangTipMesh = new THREE.Mesh(tangTipGeo, goldAccentMaterial)
    tangTipMesh.position.set(-1.32, -1.42, 0.16)
    bladeGroupA.add(tangTipMesh)

    pivotGroup.add(bladeGroupA)

    // =========================================================
    // 4. BRAZO B (bladeGroupB): HOJA OPUESTA, VÁSTAGO Y ANILLO
    // =========================================================
    const bladeGroupB = new THREE.Group()
    bladeGroupB.position.set(0, 0, -0.045) // Offset Z para traslape simétrico

    // Hoja B (espejada)
    const bladeGeoB = createBladeGeometry(true)
    const bladeMeshB = new THREE.Mesh(bladeGeoB, goldShearMaterial)
    bladeGroupB.add(bladeMeshB)

    // Vástago/cuello B continuo hacia el anillo del pulgar
    const shankCurveB = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.05, 0),
      new THREE.Vector3(0.14, -0.65, 0),
      new THREE.Vector3(0.32, -1.25, 0),
    ])
    const shankGeoB = new THREE.TubeGeometry(shankCurveB, 24, 0.068, 16, false)
    const shankMeshB = new THREE.Mesh(shankGeoB, goldShearMaterial)
    bladeGroupB.add(shankMeshB)

    // Anillo para el pulgar B
    const ringGeoB = new THREE.TorusGeometry(0.38, 0.065, 20, 36)
    const ringMeshB = new THREE.Mesh(ringGeoB, goldAccentMaterial)
    ringMeshB.position.set(0.44, -1.60, 0)
    ringMeshB.rotation.y = -0.08
    bladeGroupB.add(ringMeshB)

    pivotGroup.add(bladeGroupB)

    // Inclinación inicial estética de la tijera
    pivotGroup.rotation.z = -0.28

    // =========================================================
    // 5. POLVO DE PARTÍCULAS DORADAS SUTILES (ATMÓSFERA PRÉMIUM)
    // =========================================================
    const particleCount = 180
    const particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 8.0
      positions[i3 + 1] = (Math.random() - 0.5) * 7.0
      positions[i3 + 2] = (Math.random() - 0.5) * 4.0
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const particleMat = new THREE.PointsMaterial({
      color: 0xc5a880,
      size: 0.038,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(particleGeo, particleMat)
    masterGroup.add(particles)

    // =========================================================
    // 6. ILUMINACIÓN METÁLICA DE ESTUDIO
    // =========================================================
    const ambientLight = new THREE.AmbientLight(0x181c26, 0.9)
    scene.add(ambientLight)

    // Luz principal direccional cálida
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.2)
    keyLight.position.set(4, 6, 5)
    scene.add(keyLight)

    // Luz de recorte (rim light) dorada para destacar los biseles
    const rimLight = new THREE.DirectionalLight(0xc5a880, 2.8)
    rimLight.position.set(-5, -3, -3)
    scene.add(rimLight)

    // Luz puntual que acompaña suavemente al cursor
    const interactiveLight = new THREE.PointLight(0xf5dfbe, 2.0, 9, 1.6)
    interactiveLight.position.set(0, 0, 3.2)
    scene.add(interactiveLight)

    // =========================================================
    // 7. INTERACCIÓN Y MANEJO DE EVENTOS (LERP)
    // =========================================================
    let mouseTargetX = 0
    let mouseTargetY = 0
    let mouseCurrentX = 0
    let mouseCurrentY = 0
    let scrollYOffset = 0

    const onPointerMove = (e) => {
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0
      mouseTargetX = (clientX / window.innerWidth) * 2 - 1
      mouseTargetY = -(clientY / window.innerHeight) * 2 + 1
    }

    const onScroll = () => {
      scrollYOffset = (window.scrollY || 0) * 0.0008
    }

    const onResize = () => {
      if (!container || !renderer) return
      const newW = container.clientWidth || window.innerWidth
      const newH = container.clientHeight || 600
      camera.aspect = newW / newH
      camera.updateProjectionMatrix()
      renderer.setSize(newW, newH)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

      const desk = newW > 860
      masterGroup.position.x = desk ? 1.35 : 0
      masterGroup.scale.setScalar(desk ? 1.05 : 0.88)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    // Pausa del ciclo de renderizado en pestañas inactivas
    const onVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true
        if (animationFrameId) cancelAnimationFrame(animationFrameId)
      } else {
        isPaused = false
        tick(performance.now())
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    // =========================================================
    // 8. CICLO DE ANIMACIÓN A 60 FPS
    // =========================================================
    const tick = (now) => {
      if (isPaused) return

      const time = now * 0.001

      // Interpolación lineal suave del cursor (lerp)
      mouseCurrentX += (mouseTargetX - mouseCurrentX) * 0.05
      mouseCurrentY += (mouseTargetY - mouseCurrentY) * 0.05

      // Animación de corte sincronizada de la tijera de barbero
      const angle = Math.sin(time * 2.0) * 0.20
      bladeGroupA.rotation.z = angle
      bladeGroupB.rotation.z = -angle

      // Flotación, balanceo e inercia de la composición completa
      masterGroup.rotation.y = time * 0.18 + mouseCurrentX * 0.42
      masterGroup.rotation.x = 0.10 - mouseCurrentY * 0.28 + scrollYOffset * 0.4
      pivotGroup.position.y = Math.sin(time * 0.9) * 0.10 - scrollYOffset * 0.6

      // Dinámica sutil de partículas de fondo
      particles.rotation.y = time * 0.04
      particles.rotation.x = Math.cos(time * 0.03) * 0.04

      // Luz puntual reactiva al cursor
      interactiveLight.position.x = mouseCurrentX * 3.5
      interactiveLight.position.y = mouseCurrentY * 2.8
      interactiveLight.position.z = 2.6 + Math.sin(time * 1.2) * 0.3

      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(tick)
    }

    animationFrameId = requestAnimationFrame(tick)

    // =========================================================
    // 9. LIMPIEZA TOTAL DE MEMORIA (DESMONTAJE)
    // =========================================================
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibilityChange)

      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material.dispose()
        }
      })

      if (renderer) {
        renderer.dispose()
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement)
        }
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="hero-3d-scene"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    />
  )
}
