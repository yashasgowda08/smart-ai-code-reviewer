import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HoloSphere3D({ size = 200 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.z = 110;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Core Wireframe Sphere
    const sphereGeo = new THREE.SphereGeometry(28, 16, 12);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Inner glowing core
    const coreGeo = new THREE.IcosahedronGeometry(14, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    sphere.add(core);

    // 3 Concentric Orbital Rings
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.6 });
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xc084fc, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.6 });
    const ringMat3 = new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.5 });

    const ring1 = new THREE.Mesh(new THREE.RingGeometry(36, 37.5, 32), ringMat1);
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(42, 43.5, 32), ringMat2);
    const ring3 = new THREE.Mesh(new THREE.RingGeometry(48, 49.5, 32), ringMat3);

    ring1.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 4;
    ring3.rotation.x = -Math.PI / 4;

    scene.add(ring1);
    scene.add(ring2);
    scene.add(ring3);

    // 5 Orbiting Satellites representing 5 AI Agents
    const satelliteGeo = new THREE.SphereGeometry(2.5, 8, 8);
    const agentColors = [0x10b981, 0x3b82f6, 0x8b5cf6, 0x06b6d4, 0xf59e0b];
    const satellites = [];

    agentColors.forEach((col, idx) => {
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const sat = new THREE.Mesh(satelliteGeo, mat);
      scene.add(sat);
      satellites.push({ mesh: sat, radius: 44, speed: 0.8 + idx * 0.25, offset: (idx * Math.PI * 2) / 5 });
    });

    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      sphere.rotation.y = elapsed * 0.4;
      sphere.rotation.x = elapsed * 0.2;
      core.rotation.y = -elapsed * 0.6;

      ring1.rotation.z = elapsed * 0.3;
      ring2.rotation.z = -elapsed * 0.25;
      ring3.rotation.y = elapsed * 0.35;

      satellites.forEach((sat) => {
        const angle = elapsed * sat.speed + sat.offset;
        sat.mesh.position.x = Math.cos(angle) * sat.radius;
        sat.mesh.position.z = Math.sin(angle) * sat.radius;
        sat.mesh.position.y = Math.sin(angle * 2) * 10;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      ringMat3.dispose();
      satelliteGeo.dispose();
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
      title="3D Multi-Agent Neural Core"
    />
  );
}
