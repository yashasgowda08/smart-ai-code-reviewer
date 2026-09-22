import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, Layers, Compass, Play, Pause, Sparkles } from 'lucide-react';

export default function CyberSpace3D() {
  const mountRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [sceneMode, setSceneMode] = useState('neural'); // 'neural' | 'grid' | 'quantum'
  const [hudOpen, setHudOpen] = useState(false);
  const pausedRef = useRef(false);
  const sceneModeRef = useRef('neural');

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    sceneModeRef.current = sceneMode;
  }, [sceneMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      console.warn('WebGL not supported, falling back to CSS space:', e);
      return;
    }
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080b12, 0.0018);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.z = 180;
    camera.position.y = 20;

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent to blend with gradient
    container.appendChild(renderer.domElement);

    // 2. Starfield / Quantum Particles
    const particleCount = 1400;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const palette = [
      new THREE.Color(0x38bdf8), // cyan
      new THREE.Color(0x818cf8), // indigo
      new THREE.Color(0xc084fc), // purple
      new THREE.Color(0x34d399), // emerald
      new THREE.Color(0x60a5fa)  // blue
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 800;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 600;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 800;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom circle particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(120,200,255,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 4,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 3. Floating Geometric Wireframes (Polyhedra)
    // A. Icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(28, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const icosahedron = new THREE.Mesh(icoGeo, icoMat);
    icosahedron.position.set(-160, 40, -60);
    scene.add(icosahedron);

    // Inner glowing core
    const icoCoreGeo = new THREE.IcosahedronGeometry(12, 0);
    const icoCoreMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    const icoCore = new THREE.Mesh(icoCoreGeo, icoCoreMat);
    icosahedron.add(icoCore);

    // B. Torus Knot
    const knotGeo = new THREE.TorusKnotGeometry(22, 5, 80, 16);
    const knotMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const torusKnot = new THREE.Mesh(knotGeo, knotMat);
    torusKnot.position.set(170, -20, -70);
    scene.add(torusKnot);

    // C. Octahedrons drifting in background
    const octaGeo = new THREE.OctahedronGeometry(16, 0);
    const octaMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const octa1 = new THREE.Mesh(octaGeo, octaMat);
    octa1.position.set(-80, -90, -100);
    scene.add(octa1);

    const octa2 = new THREE.Mesh(octaGeo, octaMat);
    octa2.position.set(110, 100, -120);
    scene.add(octa2);

    // 4. Undulating Cyber Horizon Grid Plane
    const gridWidth = 700;
    const gridDepth = 700;
    const gridSegments = 45;
    const gridGeo = new THREE.PlaneGeometry(gridWidth, gridDepth, gridSegments, gridSegments);
    gridGeo.rotateX(-Math.PI / 2);
    gridGeo.translate(0, -90, -50);

    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    scene.add(gridMesh);

    // 5. Mouse Parallax Tracking with Lerp
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      mouseX = (e.clientX - halfW) / halfW;
      mouseY = (e.clientY - halfH) / halfH;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Handle Window Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onResize);

    // 6. Animation Loop
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (pausedRef.current) {
        renderer.render(scene, camera);
        return;
      }

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera parallax
      targetX += (mouseX * 35 - targetX) * 0.04;
      targetY += (-mouseY * 25 - targetY) * 0.04;

      camera.position.x = targetX;
      camera.position.y = 20 + targetY;
      camera.lookAt(0, 0, 0);

      // Rotate polyhedra
      icosahedron.rotation.x += delta * 0.35;
      icosahedron.rotation.y += delta * 0.45;
      icoCore.rotation.y -= delta * 0.7;

      torusKnot.rotation.x += delta * 0.25;
      torusKnot.rotation.y += delta * 0.35;
      torusKnot.rotation.z += delta * 0.15;

      octa1.rotation.y += delta * 0.5;
      octa1.rotation.z += delta * 0.3;
      octa2.rotation.x -= delta * 0.4;
      octa2.rotation.y += delta * 0.4;

      // Animate starfield slow drift
      particles.rotation.y = elapsed * 0.02;
      particles.rotation.x = Math.sin(elapsed * 0.03) * 0.05;

      // Mode-specific animations
      const mode = sceneModeRef.current;
      if (mode === 'grid') {
        gridMesh.visible = true;
        // Undulate grid vertices
        const posAttr = gridGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const u = posAttr.getX(i);
          const w = posAttr.getZ(i);
          const elevation = Math.sin(u * 0.02 + elapsed * 2.0) * Math.cos(w * 0.02 + elapsed * 1.5) * 7.5;
          posAttr.setY(i, elevation - 90);
        }
        posAttr.needsUpdate = true;
      } else if (mode === 'neural') {
        gridMesh.visible = true;
        const posAttr = gridGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const u = posAttr.getX(i);
          const elevation = Math.sin(u * 0.015 + elapsed * 1.2) * 4;
          posAttr.setY(i, elevation - 95);
        }
        posAttr.needsUpdate = true;
      } else {
        // Quantum: minimal grid, amplified starfield
        gridMesh.visible = false;
        particles.rotation.y = elapsed * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      icoGeo.dispose();
      icoMat.dispose();
      knotGeo.dispose();
      knotMat.dispose();
      gridGeo.dispose();
      gridMat.dispose();
    };
  }, []);

  return (
    <>
      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.85
        }}
      />

      {/* Floating 3D HUD Controller Widget */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          right: '1.25rem',
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.5rem'
        }}
      >
        {hudOpen && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
              minWidth: '220px',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Compass size={13} />
                3D Space Dynamics
              </span>
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                style={{
                  background: isPaused ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  border: 'none',
                  borderRadius: '4px',
                  color: isPaused ? '#f87171' : '#34d399',
                  padding: '0.2rem 0.4rem',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                {isPaused ? <Play size={10} /> : <Pause size={10} />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[
                { id: 'neural', label: 'Neural Constellation' },
                { id: 'grid', label: 'Cyber Matrix Grid' },
                { id: 'quantum', label: 'Quantum Deep Space' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSceneMode(m.id)}
                  style={{
                    background: sceneMode === m.id ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    border: sceneMode === m.id ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
                    color: sceneMode === m.id ? '#fff' : '#94a3b8',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* HUD Toggle Pill */}
        <button
          type="button"
          onClick={() => setHudOpen(!hudOpen)}
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            color: '#93c5fd',
            borderRadius: '20px',
            padding: '0.4rem 0.85rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease'
          }}
          title="Toggle 3D Viewport Controls"
        >
          <Sparkles size={13} color="#38bdf8" />
          <span>3D Space FX</span>
        </button>
      </div>
    </>
  );
}
