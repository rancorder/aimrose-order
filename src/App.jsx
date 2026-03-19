import { useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'

// ── ROUTING ─────────────────────────────────────────────────────────────────
function getRoute() {
  return window.location.pathname === '/presenter' ? 'presenter' : 'customer'
}

// ── BROADCAST CHANNEL ────────────────────────────────────────────────────────
const CHANNEL = 'aimrose-slide-sync'
function useSyncSend() {
  const ch = useRef(null); const ready = useRef(false)
  useEffect(() => {
    ch.current = new BroadcastChannel(CHANNEL); ready.current = true
    return () => { ch.current.close(); ready.current = false }
  }, [])
  const send = useRef((id) => {
    if (ready.current) ch.current.postMessage({ sectionId: id })
    else setTimeout(() => ch.current?.postMessage({ sectionId: id }), 150)
  })
  return send.current
}
function useSyncReceive(onSection) {
  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL)
    ch.onmessage = (e) => { if (e.data?.sectionId) onSection(e.data.sectionId) }
    return () => ch.close()
  }, [onSection])
}
const CUSTOMER_MAP = {
  intro:'intro', background:'background', strength:'strength', service:'service',
  method1:'method1', method2:'method2', pricing:'pricing', wholesale:'wholesale',
  steps:'steps', contact:'contact',
}

// ── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  ivory:'#f5f0e8', cream:'#ede7d9', warmWhite:'#faf7f2',
  charcoal:'#1a1612', gold:'#b8924a', goldLight:'#d4aa6a', goldDark:'#8a6830',
  muted:'#7a7068', slate:'#4a4540',
  bg:'#0d0c0a', surface:'#181614', border:'#2a2520',
  textDim:'#6a6058', textMid:'#a09080', textLight:'#e8ddd0',
}

// ────────────────────────────────────────────────────────────────────────────
// ROBUST THREE.JS HOOK
// Waits for real dimensions via ResizeObserver before initializing
// ────────────────────────────────────────────────────────────────────────────
function useThreeScene(initFn) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let cleanup = null
    let animId = null

    const start = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (w === 0 || h === 0) return  // not ready yet

      // Create canvas
      const canvas = document.createElement('canvas')
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;'
      mount.appendChild(canvas)

      try {
        cleanup = initFn(canvas, w, h, (id) => { animId = id })
      } catch (e) {
        console.error('Three.js init error:', e)
        canvas.remove()
      }
    }

    const ro = new ResizeObserver(() => {
      if (!cleanup) start()
    })
    ro.observe(mount)

    // Also try immediately
    start()

    return () => {
      ro.disconnect()
      if (animId) cancelAnimationFrame(animId)
      if (cleanup) cleanup()
      // remove canvas
      const canvas = mount.querySelector('canvas')
      if (canvas) canvas.remove()
    }
  }, [])

  return mountRef
}

// ── HERO SCENE ───────────────────────────────────────────────────────────────
function HeroScene() {
  const ref = useThreeScene((canvas, W, H, setId) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200)
    camera.position.set(0, 0, 13)

    // Central wireframe icosahedra
    const mesh1 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.4, 1),
      new THREE.MeshBasicMaterial({ color: 0xb8924a, wireframe: true, transparent: true, opacity: 0.6 })
    )
    scene.add(mesh1)

    const mesh2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3.8, 1),
      new THREE.MeshBasicMaterial({ color: 0xd4aa6a, wireframe: true, transparent: true, opacity: 0.15 })
    )
    scene.add(mesh2)

    // Torus rings
    const rings = [
      [4.4, 0.016, Math.PI / 2, 0, 0],
      [5.2, 0.011, Math.PI / 3, Math.PI / 4, 0.2],
      [3.8, 0.014, 0.1, Math.PI / 5, Math.PI / 6],
      [6.0, 0.009, Math.PI / 7, Math.PI / 3, Math.PI / 5],
    ].map(([r, tube, rx, ry, rz]) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(r, tube, 8, 120),
        new THREE.MeshBasicMaterial({ color: 0xb8924a, transparent: true, opacity: 0.28 })
      )
      m.rotation.set(rx, ry, rz)
      scene.add(m)
      return m
    })

    // Thread curves
    for (let i = 0; i < 18; i++) {
      const pts = Array.from({ length: 7 }, () =>
        new THREE.Vector3((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 4)
      )
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 36, 0.008 + Math.random() * 0.012, 4, false)
      const mat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xd4aa6a : 0x8a6830,
        transparent: true, opacity: 0.1 + Math.random() * 0.18,
      })
      scene.add(new THREE.Mesh(geo, mat))
    }

    // Particles
    const N = 3000
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3)
    const ca = new THREE.Color(0xd4aa6a), cb = new THREE.Color(0xc4857a)
    for (let i = 0; i < N; i++) {
      const r = 5 + Math.random() * 10
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1)
      pos[i*3] = r * Math.sin(ph) * Math.cos(th)
      pos[i*3+1] = r * Math.sin(ph) * Math.sin(th)
      pos[i*3+2] = r * Math.cos(ph)
      const c = ca.clone().lerp(cb, Math.random())
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b
    }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    pg.setAttribute('color', new THREE.BufferAttribute(col, 3))
    scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.7 })))

    const mouse = { x: 0, y: 0 }
    const onMouse = e => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouse)

    const onResize = () => {
      const w = canvas.parentElement?.clientWidth || W
      const h = canvas.parentElement?.clientHeight || H
      if (w && h) { renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix() }
    }
    window.addEventListener('resize', onResize)

    let f = 0
    const animate = () => {
      const id = requestAnimationFrame(animate)
      setId(id)
      f += 0.004
      mesh1.rotation.x = f * 0.28; mesh1.rotation.y = f * 0.38
      mesh2.rotation.x = -f * 0.18; mesh2.rotation.y = f * 0.22
      rings[0].rotation.z = f * 0.14
      rings[1].rotation.x = f * 0.16
      rings[2].rotation.y = f * 0.11
      rings[3].rotation.z = -f * 0.09
      camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.05
      camera.position.y += (mouse.y * 1.0 - camera.position.y) * 0.05
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  })
  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />
}

// ── TRIANGLE / THREE SPHERES SCENE ───────────────────────────────────────────
function TriangleScene() {
  const ref = useThreeScene((canvas, W, H, setId) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100)
    camera.position.set(0, 2, 10); camera.lookAt(0, 0, 0)

    // Lights
    const pl = new THREE.PointLight(0xd4aa6a, 4, 22)
    pl.position.set(0, 4, 6)
    scene.add(pl)
    scene.add(new THREE.AmbientLight(0x332a20, 2))

    // 3 orbiting spheres
    const sphereData = [
      { color: 0xb8924a, angle: Math.PI * 0.5 },
      { color: 0xd4aa6a, angle: Math.PI * 1.17 },
      { color: 0x8a6830, angle: Math.PI * 1.83 },
    ]
    const R = 3.2
    const meshes = sphereData.map(({ color, angle }) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 32, 32),
        new THREE.MeshStandardMaterial({
          color, metalness: 0.7, roughness: 0.3,
          emissive: new THREE.Color(color).multiplyScalar(0.12),
        })
      )
      mesh.position.set(Math.cos(angle) * R, 0, Math.sin(angle) * R * 0.45)
      scene.add(mesh)
      return { mesh, angle }
    })

    // Center gem
    const center = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.45, 0),
      new THREE.MeshStandardMaterial({ color: 0xd4aa6a, metalness: 0.9, roughness: 0.08, emissive: 0xb8924a, emissiveIntensity: 0.4 })
    )
    scene.add(center)

    // Connecting lines (static, drawn once)
    const lineMat = new THREE.LineBasicMaterial({ color: 0xb8924a, transparent: true, opacity: 0.25 })
    const lineGroup = new THREE.Group()
    scene.add(lineGroup)

    let f = 0
    const animate = () => {
      const id = requestAnimationFrame(animate); setId(id)
      f += 0.006
      // Update sphere positions
      meshes.forEach(({ mesh, angle }) => {
        mesh.position.x = Math.cos(angle + f) * R
        mesh.position.z = Math.sin(angle + f) * R * 0.45
        mesh.rotation.y += 0.012
      })
      // Rebuild lines each frame
      lineGroup.clear()
      for (let i = 0; i < 3; i++) {
        const j = (i + 1) % 3
        const pts = [meshes[i].mesh.position.clone(), meshes[j].mesh.position.clone()]
        lineGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat))
      }
      center.rotation.y += 0.015
      renderer.render(scene, camera)
    }
    animate()

    return () => renderer.dispose()
  })
  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />
}

// ── SPOOL SCENE ──────────────────────────────────────────────────────────────
function SpoolScene() {
  const ref = useThreeScene((canvas, W, H, setId) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100)
    camera.position.set(0, 2, 11); camera.lookAt(0, 0, 0)

    scene.add(new THREE.AmbientLight(0x332a20, 2.5))
    const pl1 = new THREE.PointLight(0xd4aa6a, 8, 25); pl1.position.set(3, 5, 5); scene.add(pl1)
    const pl2 = new THREE.PointLight(0xc4857a, 4, 18); pl2.position.set(-4, -2, 3); scene.add(pl2)

    const colors = [0xb8924a, 0xd4aa6a, 0xc4857a, 0x8a6830, 0xe8d0a0, 0xa07840]
    const spools = []

    for (let i = 0; i < 6; i++) {
      const grp = new THREE.Group()
      const bodyMat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], metalness: 0.3, roughness: 0.65 })
      grp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.72, 32), bodyMat))

      // Flanges
      for (const y of [-0.4, 0.4]) {
        const fl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.56, 0.56, 0.09, 32),
          new THREE.MeshStandardMaterial({ color: 0x7a5820, metalness: 0.6, roughness: 0.4 })
        )
        fl.position.y = y; grp.add(fl)
      }
      // Thread rings
      for (let j = 0; j < 7; j++) {
        const t = new THREE.Mesh(
          new THREE.TorusGeometry(0.42, 0.018, 8, 32),
          new THREE.MeshStandardMaterial({ color: colors[i % colors.length], metalness: 0.1, roughness: 0.9 })
        )
        t.rotation.x = Math.PI / 2; t.position.y = -0.27 + j * 0.09; grp.add(t)
      }

      const angle = (i / 6) * Math.PI * 2, r = 3.0 + (i % 2) * 0.7
      grp.position.set(Math.cos(angle) * r, (Math.random() - 0.5) * 1.6, Math.sin(angle) * r * 0.5)
      grp.rotation.z = (Math.random() - 0.5) * 0.5
      scene.add(grp)
      spools.push({ grp, angle, r, phase: Math.random() * Math.PI * 2, spd: 0.004 + Math.random() * 0.003 })
    }

    // Thread lines
    for (let i = 0; i < 10; i++) {
      const pts = Array.from({ length: 8 }, () =>
        new THREE.Vector3((Math.random() - 0.5) * 13, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4)
      )
      scene.add(new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 50, 0.009, 4, false),
        new THREE.MeshBasicMaterial({ color: 0xd4aa6a, transparent: true, opacity: 0.18 })
      ))
    }

    let f = 0
    const animate = () => {
      const id = requestAnimationFrame(animate); setId(id); f += 0.01
      spools.forEach(({ grp, angle, r, phase, spd }) => {
        const a = angle + f * spd * 8
        grp.position.x = Math.cos(a) * r
        grp.position.z = Math.sin(a) * r * 0.5
        grp.position.y = Math.sin(f * 0.7 + phase) * 0.45
        grp.rotation.y += 0.014
      })
      pl1.position.x = Math.cos(f * 0.35) * 5
      pl1.position.y = Math.sin(f * 0.25) * 3
      renderer.render(scene, camera)
    }
    animate()
    return () => renderer.dispose()
  })
  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />
}

// ── FABRIC WAVE SCENE ────────────────────────────────────────────────────────
function FabricScene({ dark = false }) {
  const ref = useThreeScene((canvas, W, H, setId) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100)
    camera.position.set(0, 4, 9); camera.lookAt(0, 0, 0)

    scene.add(new THREE.AmbientLight(0x332a20, dark ? 1.8 : 3))
    const pl = new THREE.PointLight(0xd4aa6a, 5, 18); pl.position.set(2, 4, 5); scene.add(pl)

    const SEG = 44
    const geo1 = new THREE.PlaneGeometry(13, 13, SEG, SEG)
    const geo2 = new THREE.PlaneGeometry(13, 13, SEG, SEG)
    scene.add(new THREE.Mesh(geo1, new THREE.MeshStandardMaterial({
      color: dark ? 0x1a1612 : 0xf0ebe0, wireframe: true, transparent: true, opacity: dark ? 0.22 : 0.32,
    })))
    scene.add(new THREE.Mesh(geo2, new THREE.MeshBasicMaterial({
      color: 0xb8924a, wireframe: true, transparent: true, opacity: dark ? 0.07 : 0.05,
    })))

    // Cache original XY positions
    const src1 = Float32Array.from(geo1.attributes.position.array)
    const src2 = Float32Array.from(geo2.attributes.position.array)
    const vCount = (SEG + 1) * (SEG + 1)

    // Pins
    for (let i = 0; i < 14; i++) {
      const pin = new THREE.Group()
      pin.add(new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.005, 0.65, 6),
        new THREE.MeshStandardMaterial({ color: 0xd4aa6a, metalness: 0.95, roughness: 0.05 })
      ))
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xd4aa6a, metalness: 0.8, roughness: 0.2 })
      )
      head.position.y = 0.34; pin.add(head)
      pin.position.set((Math.random() - 0.5) * 9, 0.35 + Math.random() * 0.4, (Math.random() - 0.5) * 5)
      pin.rotation.z = (Math.random() - 0.5) * 0.4
      scene.add(pin)
    }

    let f = 0
    const animate = () => {
      const id = requestAnimationFrame(animate); setId(id); f += 0.016
      const a1 = geo1.attributes.position.array
      const a2 = geo2.attributes.position.array
      for (let k = 0; k < vCount; k++) {
        const i3 = k * 3
        const x = src1[i3], y = src1[i3 + 1]
        const z = Math.sin(x * 0.6 + f) * Math.cos(y * 0.5 + f * 0.7) * 0.38
        a1[i3 + 2] = z; a2[i3 + 2] = z * 0.75
      }
      geo1.attributes.position.needsUpdate = true
      geo2.attributes.position.needsUpdate = true
      geo1.computeVertexNormals()
      renderer.render(scene, camera)
    }
    animate()
    return () => renderer.dispose()
  })
  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />
}

// ── GEM SCENE ────────────────────────────────────────────────────────────────
function GemScene() {
  const ref = useThreeScene((canvas, W, H, setId) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100)
    camera.position.set(0, 0, 11)

    scene.add(new THREE.AmbientLight(0x332a20, 2.5))
    const pl1 = new THREE.PointLight(0xd4aa6a, 10, 22); pl1.position.set(4, 4, 4); scene.add(pl1)
    const pl2 = new THREE.PointLight(0xc4857a, 5, 18); pl2.position.set(-4, -3, 3); scene.add(pl2)

    const gColors = [0xb8924a, 0xd4aa6a, 0xc4857a, 0xe8d0a0, 0x8a6830, 0xd4b896]
    const gems = Array.from({ length: 16 }, (_, i) => {
      const sz = 0.2 + Math.random() * 0.65
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(sz, 0),
        new THREE.MeshStandardMaterial({
          color: gColors[i % gColors.length], metalness: 0.85, roughness: 0.1,
          emissive: 0xb8924a, emissiveIntensity: 0.12, transparent: true, opacity: 0.82,
        })
      )
      mesh.position.set((Math.random() - 0.5) * 13, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 5)
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      scene.add(mesh)
      return { mesh, phase: Math.random() * Math.PI * 2, spd: 0.4 + Math.random() * 0.9, oy: mesh.position.y }
    })

    let f = 0
    const animate = () => {
      const id = requestAnimationFrame(animate); setId(id); f += 0.01
      gems.forEach(({ mesh, phase, spd, oy }) => {
        mesh.rotation.x += 0.005 * spd; mesh.rotation.y += 0.008 * spd
        mesh.position.y = oy + Math.sin(f * spd + phase) * 0.32
      })
      pl1.position.x = Math.cos(f * 0.28) * 5; pl1.position.y = Math.sin(f * 0.2) * 3
      renderer.render(scene, camera)
    }
    animate()
    return () => renderer.dispose()
  })
  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />
}

// ── ROSE PARTICLE SCENE ──────────────────────────────────────────────────────
function RoseScene() {
  const ref = useThreeScene((canvas, W, H, setId) => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100)
    camera.position.set(0, 0, 11)

    const N = 5500
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3)
    const c1 = new THREE.Color(0xd4aa6a), c2 = new THREE.Color(0xc4857a), c3 = new THREE.Color(0xb8924a)
    for (let i = 0; i < N; i++) {
      const theta = (i / N) * Math.PI * 22
      const r = 4 * Math.cos(3 * theta) + (Math.random() - 0.5) * 0.85
      pos[i*3] = r * Math.cos(theta) + (Math.random() - 0.5) * 0.28
      pos[i*3+1] = r * Math.sin(theta) + (Math.random() - 0.5) * 0.28
      pos[i*3+2] = (Math.random() - 0.5) * 2.6
      const t = Math.random()
      const c = t < 0.45 ? c1.clone().lerp(c2, t / 0.45) : c2.clone().lerp(c3, (t - 0.45) / 0.55)
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b
    }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    pg.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const points = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.048, vertexColors: true, transparent: true, opacity: 0.88 }))
    scene.add(points)

    for (let i = 0; i < 5; i++) {
      scene.add(new THREE.Mesh(
        new THREE.TorusGeometry(0.5 + i * 0.42, 0.022, 8, 64),
        new THREE.MeshBasicMaterial({ color: 0xd4aa6a, transparent: true, opacity: Math.max(0.04, 0.28 - i * 0.05) })
      ))
    }

    let f = 0
    const animate = () => {
      const id = requestAnimationFrame(animate); setId(id); f += 0.005
      points.rotation.z = f * 0.14
      points.rotation.x = Math.sin(f * 0.3) * 0.12
      renderer.render(scene, camera)
    }
    animate()
    return () => renderer.dispose()
  })
  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />
}

// ════════════════════════════════════════════════════════════════════════════
// PRESENTER DATA
// ════════════════════════════════════════════════════════════════════════════
const BANT_ITEMS = [
  { id: 'budget',    label: '予算：外注にかけられる予算感はどれくらいか？' },
  { id: 'authority', label: '決裁者：最終判断は誰が担当されるか？' },
  { id: 'needs',     label: 'ニーズ：特に興味を持ったポイントはどこか？' },
  { id: 'timeline',  label: 'タイムライン：いつ頃から導入をお考えか？' },
]
const OBJECTIONS = [
  { trigger: '検討したい', response: 'ありがとうございます。仕様・納期の詳細は技術者との打ち合わせでないと正確にお伝えできない部分が多いです。30分ほどのお時間で御社の案件に当てはめた具体的な進め方をご提示できますので、次回のお時間だけいただければと思います。' },
  { trigger: '見送りたい', response: '率直にお話しいただきありがとうございます。外注先としてどこまでお役に立てるかは詳細を確認してみないと判断が難しい部分があります。情報整理の場として、次回30分ほどお時間をいただければ御社にとってメリットがあるかどうかを一緒に確認できればと思います。' },
  { trigger: '会社の確認が必要', response: '承知いたしました。慎重に進められるのは良いことだと思います。判断材料を揃える意味でも、仕様や納期の詳細は二次商談で具体的にお伝えできます。次回は御社の体制に合わせた具体例をご用意いたしますので、30分ほどお時間をいただければと思います。' },
]
const P_SECTIONS = [
  { id:'intro',      label:'イントロ',     cs:'intro',      script:`本日はお時間をいただきありがとうございます。\n株式会社aim roseの〇〇と申します。\n\n本日は、御社で対応が難しいフルオーダー案件や特殊案件を、弊社が外注先としてお手伝いできる可能性についてお話しできればと思っております。\n\nメリットを感じていただける内容になっているかと思いますので、ぜひ気軽にお聞きいただければ幸いです。` },
  { id:'icebreak',   label:'アイスブレイク', cs:null,        script:`●●様、最初に1点お伺いしてもよろしいでしょうか？\n先日は突然のお電話にも関わらず、ご興味をいただけた理由を先にお伺いしてもよろしいでしょうか？\n\n（相手の回答を受ける）\n\nありがとうございます。そういった背景からご興味をお持ちいただいたんですね。\n\nもしよろしければ、現在どのような案件でお困りの場面が多いのか、少しお聞かせいただけますでしょうか。` },
  { id:'background', label:'提携の背景',   cs:'background',  script:`三方よしの考え方でご説明いたします。\n\n【御社のメリット】フルオーダー対応で受注機会が広がり、機会損失が減ります。\n\n【お客様のメリット】より幅広い選択肢と高品質な製品で満足度がアップします。\n\n【弊社のメリット】長年培ってきた技術と経験を最大限に活用できます。` },
  { id:'strength',   label:'弊社の強み',   cs:'strength',    script:`①職人の技術\nジバンシー、コムデギャルソンなどのハイブランドを担う縫製工場で修得した技術。20年以上の実績。\n\n②総合的な製作能力\nデザイン、パターン、企画、縫製全てを経験し、フルオーダー製作のノウハウを持っています。\n\n③過去の実績\n小澤征爾指揮演劇衣装・森英恵サンプル・東京/関西コレクション・宝塚歌劇団番組での製作指導など。` },
  { id:'usp',        label:'USPサマリー',  cs:null,          script:`3つのメリット：\n\n【1. 対応範囲の広さ】特殊体型・特殊素材・特殊仕様の案件でも柔軟に対応できます。\n\n【2. 制作キャパシティの柔軟さ】一点物から複数着まで対応。急な案件もご相談いただけます。\n\n【3. ブランド価値を損なわない品質】著名な経営者層のスーツ制作実績あり。` },
  { id:'service',    label:'サービス内容', cs:'service',     script:`外注としてご依頼いただく場合は、まず案件内容をヒアリングし、仕様・素材・納期などを確認したうえで制作に入ります。\n\n提携方法は2種類ございます：\n① 非対面式受注（フリーサイズサンプルによる）\n② 対面式受注（フルオーダー出張対応）` },
  { id:'method1',    label:'提携方法①',   cs:'method1',     script:`【提携方法1：非対面式受注】\nフリーサイズ（S〜L対応）のデザインサンプルを店内またはHP上に展示。丈だけの簡単な調整で受注できます。\n\n料金例（税別）：コート ¥50,000〜 / スーツ ¥50,000〜 / ジャケット ¥35,000〜\n\n納期：材料が揃ってから1ヶ月半〜2ヶ月` },
  { id:'method2',    label:'提携方法②',   cs:'method2',     script:`【提携方法2：フルオーダー対面式受注】\nお客様からフルオーダーの依頼を受けたら、弊社に出張依頼いただきます。\n\n出張費：近距離(20km以内) ¥10,000 / 中距離(〜50km) ¥20,000 / 長距離(50km以上) ¥40,000\n＋交通費（受注日・仮縫い日の計2〜3回分含む）\n\n納期：2〜3ヶ月` },
  { id:'pricing',    label:'料金表',       cs:'pricing',     script:`フルオーダー料金表（税別）：\n・コート：パターン ¥55,000〜 / 製作 ¥90,000〜\n・ジャケット・ブルゾン：¥50,000〜 / ¥70,000〜\n・ワンピース：¥45,000〜 / ¥60,000〜\n・パンツ・スカート：¥35,000〜 / ¥30,000〜\n・シャツ：¥35,000〜 / ¥35,000〜\n\n✦ ご紹介リピート → 御社に20%キャッシュバック` },
  { id:'hearing',    label:'ヒアリング',   cs:null,  bant:true, script:`ここからは御社の現状を伺えればと思います。\n\n・特殊体型のお客様をお断りする場面はどれくらいあるか\n・仕様の制約で対応が難しいケースはあるか\n・外注先を探されたことがあるか、その際の不安\n・今後強化したいサービス領域\n\n【BANT確認 ↓ チェックリストを活用】` },
  { id:'qa',         label:'Q&A想定',     cs:null,          script:`Q1: 仕様対応範囲は？ → 特殊体型・素材含め柔軟に。詳細は技術者との打ち合わせで。\nQ2: 納期は？ → 案件内容により変動。詳細は二次商談で。\nQ3: 一点物でも？ → はい、むしろ一点物フルオーダーは得意です。\nQ4: 複数着も？ → 可能。ロット少ない場合は単価が上がりますが事前にご相談。\nQ5: 品質面は？ → 著名な経営者層のスーツ制作実績あり。\nQ6: 料金は？ → 仕様確認後にご提示。\nQ7: 急ぎの案件は？ → 内容により可能な範囲で調整。` },
  { id:'closing',    label:'クロージング', cs:'steps', objections:true, script:`ありがとうございます。\nもしよろしければ、まずは御社の体制やご希望を伺いながら、最適なプランを具体化させていただければと思っています。\n\n「〇月〇日（〇曜日）」か「〇月〇日（〇曜日）」にお時間いただくことは可能でしょうか？\n\n【日程調整トーク】\nお時間は午前と午後はどちらがご都合よろしいでしょうか。\n●時と●時ではどちらがよろしいでしょうか。` },
  { id:'contact',    label:'お問い合わせ', cs:'contact',     script:`本日はありがとうございました。\n\n株式会社 aim-rose（エイムローズ）\n〒542-0081 大阪市中央区南船場2-2-28\nジェイ・プライド順慶ビル205\n\nTEL: 06-6261-7373 / FAX: 06-6261-7372\nHP: https://aim-rose-order.com/` },
]

// ════════════════════════════════════════════════════════════════════════════
// CUSTOMER VIEW
// ════════════════════════════════════════════════════════════════════════════
function CustomerView() {
  const [scrollPct, setScrollPct] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sectionRefs = useRef({})
  const sections = ['intro','background','strength','service','method1','method2','pricing','wholesale','steps','contact']
  const labels = { intro:'提携のご提案', background:'提携の背景', strength:'弊社の強み', service:'サービス内容', method1:'提携方法①', method2:'提携方法②', pricing:'料金表', wholesale:'卸販売', steps:'提携開始', contact:'お問い合わせ' }

  useEffect(() => {
    const h = () => {
      const el = document.documentElement
      setScrollPct(Math.min(1, el.scrollTop / (el.scrollHeight - el.clientHeight) || 0))
    }
    window.addEventListener('scroll', h); return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)' } }),
      { threshold: 0.07 }
    )
    document.querySelectorAll('.fi').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const handleSync = useCallback(id => sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), [])
  useSyncReceive(handleSync)

  const fi = { opacity: 0, transform: 'translateY(50px)', transition: 'opacity 0.9s ease, transform 0.9s ease' }

  return (
    <div style={{ background: C.warmWhite, color: C.charcoal, fontFamily: "'Noto Sans JP', sans-serif" }}>

      {/* Progress bar */}
      <div style={{ position:'fixed', top:0, left:0, right:0, height:3, zIndex:1000, background:'#e8e0d4' }}>
        <div style={{ height:'100%', width:`${scrollPct*100}%`, background:`linear-gradient(90deg,${C.goldDark},${C.goldLight})`, transition:'width 0.1s' }} />
      </div>

      {/* Sidebar */}
      <div style={{ position:'fixed', top:0, left:0, bottom:0, zIndex:900, width:sidebarOpen?220:48, transition:'width 0.3s ease', background:sidebarOpen?'rgba(26,22,18,0.97)':'transparent', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{ width:48,height:48,background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:sidebarOpen?C.goldLight:C.gold }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            {sidebarOpen?<><path d="M15 5L5 15"/><path d="M5 5l10 10"/></>:<><line x1="2" y1="5" x2="18" y2="5"/><line x1="2" y1="10" x2="18" y2="10"/><line x1="2" y1="15" x2="18" y2="15"/></>}
          </svg>
        </button>
        {sidebarOpen && (
          <nav style={{ padding:'16px 0', overflowY:'auto' }}>
            {sections.map(id => (
              <button key={id} onClick={() => { sectionRefs.current[id]?.scrollIntoView({ behavior:'smooth', block:'start' }); setSidebarOpen(false) }}
                style={{ display:'block', width:'100%', padding:'10px 24px', background:'none', border:'none', cursor:'pointer', color:C.goldLight, fontSize:12, textAlign:'left', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>
                {labels[id]}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* ── HERO ─────────────────────────────────── */}
      <section ref={el=>sectionRefs.current['intro']=el}
        style={{ minHeight:'100vh', position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden', background:C.charcoal, padding:'80px 60px 60px' }}>
        <HeroScene />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(26,22,18,0.2) 0%,rgba(26,22,18,0.05) 50%,rgba(26,22,18,0.55) 100%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:720 }}>
          <div style={{ fontFamily:"'Cormorant Garamond'", fontSize:12, color:C.gold, letterSpacing:'0.42em', textTransform:'uppercase', marginBottom:28 }}>Partnership Proposal</div>
          <h1 style={{ fontFamily:"'Cormorant Garamond'", fontWeight:300, fontSize:'clamp(50px,9vw,100px)', lineHeight:1.05, color:C.ivory, marginBottom:18, letterSpacing:'-0.01em' }}>提携のご提案</h1>
          <div style={{ width:60, height:1, background:C.gold, margin:'0 auto 24px' }} />
          <p style={{ fontFamily:"'Noto Serif JP'", fontSize:'clamp(15px,2vw,19px)', color:'#c8bfb0', lineHeight:1.9, fontWeight:300, marginBottom:44 }}>オーダースーツ店様向けの協業案</p>
          <div style={{ display:'inline-block', padding:'14px 44px', border:`1px solid ${C.gold}60`, color:C.goldLight, fontSize:12, letterSpacing:'0.2em' }}>株式会社 aim-rose（エイムローズ）</div>
        </div>
      </section>

      {/* ── BACKGROUND ─────────────────────────── */}
      <section ref={el=>sectionRefs.current['background']=el} className="fi"
        style={{ ...fi, minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', overflow:'hidden' }}>
        <div style={{ position:'relative', minHeight:520, background:C.charcoal }}>
          <TriangleScene />
          <div style={{ position:'absolute', bottom:44, left:0, right:0, textAlign:'center', pointerEvents:'none', zIndex:1 }}>
            <span style={{ fontFamily:"'Cormorant Garamond'", fontSize:34, color:C.gold, fontStyle:'italic' }}>三方よし</span>
          </div>
        </div>
        <div style={{ padding:'80px 56px', display:'flex', flexDirection:'column', justifyContent:'center', background:C.warmWhite }}>
          <SLabel en="Background" />
          <h2 style={hS(C.charcoal)}>Win-Win-Win の<br />提携モデル</h2>
          <div style={{ width:40, height:2, background:C.gold, marginBottom:40 }} />
          {[{icon:'🏪',title:'御社のメリット',desc:'フルオーダー対応で受注機会が広がり、機会損失が減ります。'},
            {icon:'👤',title:'お客様のメリット',desc:'より幅広い選択肢と高品質な製品で満足度がアップします。'},
            {icon:'🌹',title:'弊社のメリット',desc:'長年培ってきた技術と経験を最大限に活用できます。'}
          ].map((item,i)=>(
            <div key={i} style={{ display:'flex', gap:18, marginBottom:24, padding:'18px 22px', background:i%2===0?C.cream:C.warmWhite, borderLeft:`2px solid ${C.gold}` }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
              <div>
                <p style={{ fontFamily:"'Noto Serif JP'", fontSize:14, fontWeight:500, color:C.charcoal, marginBottom:5 }}>{item.title}</p>
                <p style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STRENGTH ──────────────────────────── */}
      <section ref={el=>sectionRefs.current['strength']=el} className="fi"
        style={{ ...fi, minHeight:'100vh', position:'relative', overflow:'hidden', background:C.charcoal }}>
        <SpoolScene />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(13,12,10,0.88) 0%,rgba(13,12,10,0.5) 40%,rgba(13,12,10,0.88) 100%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:1100, margin:'0 auto', padding:'100px 80px' }}>
          <SLabel en="Our Strengths" />
          <h2 style={hS(C.ivory)}>職人の技術と20年の実績</h2>
          <div style={{ width:40, height:2, background:C.gold, marginBottom:60 }} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:2 }}>
            {[{num:'01',title:'職人の技術',body:'ジバンシー、コムデギャルソンなどのハイブランドを担う縫製工場で修得した技術を持っています。20年以上の実績で多ジャンル、フルアイテムの製作をしてきました。'},
              {num:'02',title:'総合的な製作能力',body:'デザイン、パターン、企画、縫製全てを経験し、フルオーダー製作を進めるノウハウを持っています。'},
              {num:'03',title:'過去の実績',body:'小澤征爾指揮による演劇衣装製作・森英恵デザイナーのサンプル製作・東京/関西コレクション衣装製作・宝塚歌劇団番組での製作指導など幅広い分野での実績。'}
            ].map((item,i)=>(
              <div key={i} style={{ padding:'44px 32px', background:'rgba(24,22,20,0.88)', borderTop:`2px solid ${C.gold}` }}>
                <div style={{ fontFamily:"'Cormorant Garamond'", fontSize:62, fontWeight:300, color:`${C.gold}18`, lineHeight:1, marginBottom:20 }}>{item.num}</div>
                <h3 style={{ fontFamily:"'Noto Serif JP'", fontSize:16, fontWeight:500, color:C.ivory, marginBottom:12 }}>{item.title}</h3>
                <div style={{ width:22, height:1, background:C.gold, marginBottom:14 }} />
                <p style={{ fontSize:13, lineHeight:1.9, color:'#8a8070' }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICE ───────────────────────────── */}
      <section ref={el=>sectionRefs.current['service']=el} className="fi"
        style={{ ...fi, minHeight:'80vh', position:'relative', overflow:'hidden', background:C.cream }}>
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%' }}>
          <FabricScene />
        </div>
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%', background:'linear-gradient(270deg, transparent 60%, rgba(237,231,217,0.95) 100%)', pointerEvents:'none', zIndex:1 }} />
        <div style={{ position:'relative', zIndex:2, maxWidth:660, padding:'100px 80px' }}>
          <SLabel en="Services" />
          <h2 style={hS(C.charcoal)}>2つの提携方法</h2>
          <div style={{ width:40, height:2, background:C.gold, marginBottom:50 }} />
          {[{method:'提携方法 01',title:'非対面式受注',sub:'フリーサイズデザインサンプルによる',tag:'簡単スタート'},
            {method:'提携方法 02',title:'対面式受注',sub:'フルオーダーによる出張対応',tag:'完全フルオーダー'}
          ].map((item,i)=>(
            <div key={i} style={{ padding:'32px 40px', background:'rgba(250,247,242,0.95)', borderLeft:`3px solid ${C.gold}`, marginBottom:22 }}>
              <span style={{ fontFamily:"'Cormorant Garamond'", fontSize:12, color:C.gold, letterSpacing:'0.2em' }}>{item.method}</span>
              <h3 style={{ fontFamily:"'Noto Serif JP'", fontSize:21, fontWeight:500, color:C.charcoal, margin:'8px 0 6px' }}>{item.title}</h3>
              <p style={{ fontSize:13, color:C.muted, marginBottom:12 }}>{item.sub}</p>
              <span style={{ display:'inline-block', padding:'3px 14px', background:`${C.gold}15`, border:`1px solid ${C.gold}40`, color:C.goldDark, fontSize:11 }}>{item.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── METHOD 1 ──────────────────────────── */}
      <section ref={el=>sectionRefs.current['method1']=el} className="fi"
        style={{ ...fi, minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', overflow:'hidden' }}>
        <div style={{ position:'relative', minHeight:480 }}><FabricScene /></div>
        <div style={{ padding:'80px 56px', display:'flex', flexDirection:'column', justifyContent:'center', background:C.warmWhite }}>
          <SLabel en="Method 01" />
          <h2 style={hS(C.charcoal)}>非対面式受注</h2>
          <p style={{ fontSize:13, color:C.muted, marginBottom:36 }}>フリーサイズデザインサンプルによる</p>
          <FlowChart steps={[{n:1,t:'サンプル展示',d:'S〜L対応サンプルを店内またはHP上に展示'},{n:2,t:'受注（丈調整）',d:'丈だけの簡単な調整で受注'},{n:3,t:'資材発注',d:'受注内容に基づいて資材を発注'},{n:4,t:'エイムローズで製作',d:'熟練職人が丁寧に製作'},{n:5,t:'納品',d:'材料が揃ってから1ヶ月半〜2ヶ月'}]} />
          <div style={{ marginTop:32, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[['コート','¥100,000'],['スーツ','¥100,000'],['ジャケット','¥70,000'],['ブラウス','¥50,000']].map(([n,p],i)=>(
              <div key={i} style={{ padding:'14px 18px', background:C.cream, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, color:C.charcoal }}>{n}</span>
                <span style={{ fontFamily:"'Cormorant Garamond'", fontSize:16, color:C.gold }}>{p}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop:12, fontSize:11, color:C.muted }}>※税別 ／ 全てS〜L対応 ／ 生地はご準備ください</p>
        </div>
      </section>

      {/* ── METHOD 2 ──────────────────────────── */}
      <section ref={el=>sectionRefs.current['method2']=el} className="fi"
        style={{ ...fi, minHeight:'100vh', position:'relative', overflow:'hidden', background:C.charcoal }}>
        <FabricScene dark />
        <div style={{ position:'absolute', inset:0, background:'rgba(13,12,10,0.78)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:1100, margin:'0 auto', padding:'100px 80px' }}>
          <SLabel en="Method 02" />
          <h2 style={hS(C.ivory)}>フルオーダー対面式受注</h2>
          <div style={{ width:40, height:2, background:C.gold, marginBottom:60 }} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60 }}>
            <FlowChart dark steps={[{n:1,t:'お客様からの依頼',d:'フルオーダーの依頼を受けます'},{n:2,t:'エイムローズに出張依頼',d:'オーダー日を決定'},{n:3,t:'オーダー当日',d:'御社に訪問し、共同で受注'},{n:4,t:'仮縫い 1〜2回',d:'お客様の体型に合わせて調整'},{n:5,t:'エイムローズで製作',d:'納期は2〜3ヶ月'},{n:6,t:'納品',d:'完成した高品質なフルオーダー製品をお届け'}]} />
            <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:18 }}>
              <div style={{ padding:'28px 32px', background:'rgba(24,22,20,0.9)', borderLeft:`3px solid ${C.gold}` }}>
                <p style={{ fontSize:11, color:C.gold, letterSpacing:'0.1em', marginBottom:14 }}>出張費（受注日・仮縫い日含む）</p>
                {[['近距離（20km以内）','¥10,000 + 交通費'],['中距離（〜50km）','¥20,000 + 交通費'],['長距離（50km以上）','¥40,000 + 交通費']].map(([d,p],i)=>(
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                    <span style={{ color:'#9a9080' }}>{d}</span><span style={{ color:C.goldLight }}>{p}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding:'22px 28px', background:`${C.gold}10`, border:`1px solid ${C.gold}30` }}>
                <p style={{ fontSize:13, color:C.textLight, lineHeight:2.2 }}>✦ 販売価格は御社で自由設定<br />✦ 材料はご準備ください<br />✦ ご紹介リピート時に<strong style={{ color:C.goldLight }}>20% キャッシュバック</strong></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────── */}
      <section ref={el=>sectionRefs.current['pricing']=el} className="fi"
        style={{ ...fi, minHeight:'80vh', position:'relative', overflow:'hidden', background:C.warmWhite }}>
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%' }}><GemScene /></div>
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%', background:'linear-gradient(270deg, transparent 50%, rgba(250,247,242,0.98) 100%)', pointerEvents:'none', zIndex:1 }} />
        <div style={{ position:'relative', zIndex:2, maxWidth:680, padding:'100px 80px' }}>
          <SLabel en="Pricing" />
          <h2 style={hS(C.charcoal)}>フルオーダー料金</h2>
          <div style={{ width:40, height:2, background:C.gold, marginBottom:48 }} />
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, background:'rgba(250,247,242,0.97)' }}>
            <thead><tr style={{ background:C.charcoal, color:C.ivory }}>
              <th style={thS}>アイテム</th><th style={thS}>パターン</th><th style={thS}>製作</th>
            </tr></thead>
            <tbody>
              {[['コート','¥55,000〜','¥90,000〜'],['ジャケット・ブルゾン','¥50,000〜','¥70,000〜'],['ワンピース','¥45,000〜','¥60,000〜'],['パンツ・スカート','¥35,000〜','¥30,000〜'],['シャツ','¥35,000〜','¥35,000〜']].map(([n,p,m],i)=>(
                <tr key={i} style={{ borderBottom:`1px solid ${C.cream}` }}>
                  <td style={tdS}>{n}</td>
                  <td style={{ ...tdS, color:C.goldDark, fontFamily:"'Cormorant Garamond'", fontSize:16 }}>{p}</td>
                  <td style={{ ...tdS, color:C.goldDark, fontFamily:"'Cormorant Garamond'", fontSize:16 }}>{m}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop:20, padding:'18px 24px', background:`${C.gold}10`, border:`1px solid ${C.gold}30` }}>
            <p style={{ fontSize:12, color:C.charcoal, lineHeight:2.2 }}>✦ 革の場合 別途 ¥20,000 ／ 柄合わせ 別途 ¥10,000<br />✦ 2着目以降、同パターンはパターン代不要<br />✦ <strong>ご紹介リピート → 御社に20%キャッシュバック</strong></p>
          </div>
        </div>
      </section>

      {/* ── WHOLESALE ─────────────────────────── */}
      <section ref={el=>sectionRefs.current['wholesale']=el} className="fi"
        style={{ ...fi, padding:'100px 80px', background:C.cream }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <SLabel en="Wholesale" />
          <h2 style={hS(C.charcoal)}>アクセサリー卸</h2>
          <div style={{ width:40, height:2, background:C.gold, marginBottom:48 }} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
            {[{name:'ポケットチーフ',desc:'1柄タイプ\n定価 ¥2,900 → 卸値 ¥1,450\n\n2柄タイプ\n定価 ¥3,500 → 卸値 ¥1,750'},
              {name:'ミニネクタイ',desc:'定価 ¥3,900\n卸値半額 ¥1,950'},
              {name:'ミニ蝶ネクタイ',desc:'定価 ¥3,900\n卸値半額 ¥1,950'}
            ].map((item,i)=>(
              <div key={i} style={{ padding:'32px', background:C.warmWhite, borderTop:`2px solid ${C.gold}` }}>
                <h3 style={{ fontFamily:"'Noto Serif JP'", fontSize:17, color:C.charcoal, marginBottom:18 }}>{item.name}</h3>
                <pre style={{ fontSize:13, color:C.slate, whiteSpace:'pre-wrap', lineHeight:2.2, fontFamily:'inherit' }}>{item.desc}</pre>
              </div>
            ))}
          </div>
          <p style={{ marginTop:18, fontSize:11, color:C.muted, textAlign:'center' }}>※税別 ／ 最低発注 ¥10,000 ／ 送料別途 ／ aimrose.official.ec</p>
        </div>
      </section>

      {/* ── STEPS ─────────────────────────────── */}
      <section ref={el=>sectionRefs.current['steps']=el} className="fi"
        style={{ ...fi, minHeight:'70vh', display:'flex', alignItems:'center', padding:'100px 80px', background:C.charcoal }}>
        <div style={{ maxWidth:1100, margin:'0 auto', width:'100%' }}>
          <SLabel en="Getting Started" />
          <h2 style={hS(C.ivory)}>今すぐ始められます</h2>
          <div style={{ width:40, height:2, background:C.gold, marginBottom:56 }} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:2 }}>
            {[{n:'01',title:'提携方法1の場合',desc:'サンプル製作を行い、その後、受注方法の指導をさせていただきます。'},
              {n:'02',title:'提携方法2の場合',desc:'特別な準備は不要です。お客様からのフルオーダー依頼があった際に随時対応いたします。'},
              {n:'03',title:'契約手続き',desc:'提携内容の詳細について協議し、双方の合意のもと契約を締結いたします。'}
            ].map((item,i)=>(
              <div key={i} style={{ padding:'44px 32px', background:'#181614' }}>
                <div style={{ fontFamily:"'Cormorant Garamond'", fontSize:58, fontWeight:300, color:`${C.gold}22`, lineHeight:1, marginBottom:18 }}>{item.n}</div>
                <h3 style={{ fontFamily:"'Noto Serif JP'", fontSize:15, color:C.ivory, marginBottom:12 }}>{item.title}</h3>
                <div style={{ width:22, height:1, background:C.gold, marginBottom:12 }} />
                <p style={{ fontSize:13, color:'#8a8070', lineHeight:1.9 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ───────────────────────────── */}
      <section ref={el=>sectionRefs.current['contact']=el} className="fi"
        style={{ ...fi, minHeight:'80vh', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:C.charcoal }}>
        <RoseScene />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center,rgba(13,12,10,0.2) 0%,rgba(13,12,10,0.88) 65%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:680, padding:'80px 40px' }}>
          <SLabel en="Contact" />
          <h2 style={{ ...hS(C.ivory), marginBottom:44 }}>ご質問・ご相談はお気軽に</h2>
          <div style={{ padding:'44px 56px', background:'rgba(255,255,255,0.05)', border:`1px solid ${C.gold}30` }}>
            <p style={{ fontFamily:"'Cormorant Garamond'", fontSize:22, color:C.goldLight, marginBottom:6 }}>株式会社 aim-rose（エイムローズ）</p>
            <div style={{ width:40, height:1, background:C.gold, margin:'0 auto 28px' }} />
            {[['住所','〒542-0081 大阪市中央区南船場2-2-28'],['','ジェイ・プライド順慶ビル205'],['TEL','06-6261-7373'],['FAX','06-6261-7372'],['HP','https://aim-rose-order.com/']].map(([l,v],i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'center', gap:28, marginBottom:9, fontSize:13 }}>
                <span style={{ color:C.gold, minWidth:40, textAlign:'right' }}>{l}</span>
                <span style={{ color:'#c8bfb0' }}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop:24, fontSize:13, color:C.textDim }}>提携店様専用公式ラインもございます</p>
        </div>
      </section>

    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PRESENTER VIEW
// ════════════════════════════════════════════════════════════════════════════
function PresenterView() {
  const [current, setCurrent] = useState(0)
  const [bantChecked, setBantChecked] = useState({})
  const [openObj, setOpenObj] = useState(null)
  const sendSync = useSyncSend()
  const sec = P_SECTIONS[current]

  useEffect(() => {
    if (sec.cs && CUSTOMER_MAP[sec.cs]) sendSync(CUSTOMER_MAP[sec.cs])
  }, [current])

  useEffect(() => {
    const h = e => {
      if (e.key === 'ArrowRight') setCurrent(c => Math.min(c + 1, P_SECTIONS.length - 1))
      if (e.key === 'ArrowLeft') setCurrent(c => Math.max(c - 1, 0))
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  const progress = (current / (P_SECTIONS.length - 1)) * 100

  return (
    <div style={{ background:C.bg, color:C.textLight, fontFamily:"'Noto Sans JP', sans-serif", minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 24px', background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ padding:'4px 12px', background:`${C.gold}20`, border:`1px solid ${C.gold}50`, color:C.goldLight, fontSize:11, letterSpacing:'0.1em' }}>PRESENTER MODE</span>
          <span style={{ color:C.textDim, fontSize:12, fontFamily:"'Cormorant Garamond'" }}>aim-rose 提携プレゼン</span>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" style={{ padding:'6px 16px', background:'none', border:`1px solid ${C.border}`, color:C.textMid, fontSize:11, letterSpacing:'0.08em', textDecoration:'none' }}>↗ 顧客画面を開く</a>
      </div>
      <div style={{ height:2, background:C.border, flexShrink:0 }}>
        <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${C.goldDark},${C.goldLight})`, transition:'width 0.4s ease' }} />
      </div>
      <div style={{ display:'flex', overflow:'auto', background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0, scrollbarWidth:'none' }}>
        {P_SECTIONS.map((s,i) => (
          <button key={s.id} onClick={()=>setCurrent(i)} style={{ padding:'10px 18px', background:'none', border:'none', borderBottom:i===current?`2px solid ${C.gold}`:'2px solid transparent', color:i===current?C.goldLight:C.textDim, cursor:'pointer', fontSize:11, letterSpacing:'0.05em', whiteSpace:'nowrap', transition:'color 0.2s' }}>
            {s.label}
          </button>
        ))}
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'26px 40px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <span style={{ padding:'3px 10px', fontSize:11, background:sec.cs?`${C.gold}15`:'#1a2a1a', border:`1px solid ${sec.cs?C.gold+'40':'#2a4a2a'}`, color:sec.cs?C.gold:'#4a8a4a' }}>{sec.cs?'🔗 顧客画面と連動':'📋 カンペのみ'}</span>
          <span style={{ fontFamily:"'Cormorant Garamond'", fontSize:22, color:C.textLight, fontStyle:'italic' }}>{sec.label}</span>
          <span style={{ color:C.textDim, fontSize:11 }}>{current+1} / {P_SECTIONS.length}</span>
        </div>
        {sec.script && (
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, color:C.textDim, letterSpacing:'0.1em', marginBottom:7 }}>台本</div>
            <pre style={{ background:'#0d1a0d', border:`1px solid #1a3a1a`, padding:'20px', fontSize:13, lineHeight:2, color:'#b8e0b8', whiteSpace:'pre-wrap', fontFamily:"'Noto Sans JP'" }}>{sec.script}</pre>
          </div>
        )}
        {sec.bant && (
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, color:C.textDim, letterSpacing:'0.1em', marginBottom:8 }}>BANTチェックリスト</div>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {BANT_ITEMS.map(item => (
                <label key={item.id} style={{ display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer', padding:'11px 14px', background:bantChecked[item.id]?'#0f200f':'#141210', border:`1px solid ${bantChecked[item.id]?'#2a5a2a':C.border}`, transition:'all 0.2s' }}>
                  <div style={{ width:17, height:17, border:`1px solid ${bantChecked[item.id]?'#4a8a4a':C.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2, background:bantChecked[item.id]?'#2a5a2a':'transparent' }}>
                    {bantChecked[item.id] && <span style={{ color:'#7adc7a', fontSize:10 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:13, lineHeight:1.7, color:bantChecked[item.id]?'#6ab06a':C.textMid, textDecoration:bantChecked[item.id]?'line-through':'none' }}>{item.label}</span>
                  <input type="checkbox" checked={!!bantChecked[item.id]} onChange={() => setBantChecked(p => ({...p,[item.id]:!p[item.id]}))} style={{ display:'none' }} />
                </label>
              ))}
            </div>
          </div>
        )}
        {sec.objections && (
          <div>
            <div style={{ fontSize:11, color:C.textDim, letterSpacing:'0.1em', marginBottom:8 }}>切り返しトーク</div>
            {OBJECTIONS.map((obj,i) => (
              <div key={i} style={{ marginBottom:6 }}>
                <button onClick={() => setOpenObj(openObj===i?null:i)} style={{ width:'100%', padding:'12px 16px', background:'#141210', border:`1px solid ${openObj===i?C.gold+'50':C.border}`, color:openObj===i?C.goldLight:C.textMid, cursor:'pointer', display:'flex', justifyContent:'space-between', fontSize:13, fontFamily:"'Noto Sans JP'", textAlign:'left', transition:'all 0.2s' }}>
                  <span>🚫 「{obj.trigger}」と言われたら</span>
                  <span style={{ fontSize:9 }}>{openObj===i?'▲':'▼'}</span>
                </button>
                {openObj===i && <div style={{ padding:'16px 16px 16px 30px', background:'#16120e', border:`1px solid ${C.gold}30`, borderTop:'none', fontSize:13, lineHeight:2, color:'#c8b890' }}>{obj.response}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 40px', background:C.surface, borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
        <button onClick={() => setCurrent(c => Math.max(c-1,0))} disabled={current===0} style={{ padding:'9px 26px', background:'none', border:`1px solid ${current===0?C.border:C.gold+'60'}`, color:current===0?C.textDim:C.goldLight, cursor:current===0?'not-allowed':'pointer', fontSize:12, letterSpacing:'0.08em' }}>← 前へ</button>
        <div style={{ display:'flex', gap:5 }}>
          {P_SECTIONS.map((_,i) => <button key={i} onClick={() => setCurrent(i)} style={{ width:i===current?18:6, height:6, background:i===current?C.gold:C.border, border:'none', cursor:'pointer', padding:0, transition:'all 0.3s', borderRadius:3 }} />)}
        </div>
        <button onClick={() => setCurrent(c => Math.min(c+1,P_SECTIONS.length-1))} disabled={current===P_SECTIONS.length-1} style={{ padding:'9px 26px', background:current===P_SECTIONS.length-1?'none':`linear-gradient(135deg,${C.goldDark},${C.goldLight})`, border:`1px solid ${current===P_SECTIONS.length-1?C.border:'transparent'}`, color:current===P_SECTIONS.length-1?C.textDim:C.charcoal, cursor:current===P_SECTIONS.length-1?'not-allowed':'pointer', fontSize:12, letterSpacing:'0.08em' }}>次へ →</button>
      </div>
    </div>
  )
}

// ── SHARED COMPONENTS ────────────────────────────────────────────────────────
const SLabel = ({ en }) => (
  <div style={{ fontFamily:"'Cormorant Garamond'", fontSize:11, letterSpacing:'0.36em', color:C.gold, textTransform:'uppercase', marginBottom:14 }}>{en}</div>
)
const hS = (color) => ({ fontFamily:"'Cormorant Garamond'", fontSize:'clamp(26px,4vw,46px)', fontWeight:300, color, lineHeight:1.2, marginBottom:14, letterSpacing:'-0.01em' })
const thS = { padding:'12px 16px', textAlign:'left', fontSize:11, letterSpacing:'0.1em', fontWeight:500 }
const tdS = { padding:'13px 16px', fontSize:13, borderBottom:`1px solid #ede7d9`, color:C.charcoal }

function FlowChart({ steps, dark }) {
  return (
    <div style={{ display:'flex', flexDirection:'column' }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:18 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
            <div style={{ width:34, height:34, border:`2px solid ${C.gold}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cormorant Garamond'", fontSize:14, color:C.gold, background:dark?C.bg:C.warmWhite }}>
              {step.n}
            </div>
            {i < steps.length - 1 && <div style={{ width:1, height:32, background:`${C.gold}35` }} />}
          </div>
          <div style={{ paddingTop:5, paddingBottom:24 }}>
            <h4 style={{ fontFamily:"'Noto Serif JP'", fontSize:14, fontWeight:500, color:dark?C.ivory:C.charcoal, marginBottom:4 }}>{step.t}</h4>
            <p style={{ fontSize:12, color:dark?'#8a8070':C.muted, lineHeight:1.7 }}>{step.d}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [route, setRoute] = useState(getRoute())
  useEffect(() => {
    const h = () => setRoute(getRoute())
    window.addEventListener('popstate', h); return () => window.removeEventListener('popstate', h)
  }, [])
  return route === 'presenter' ? <PresenterView /> : <CustomerView />
}
