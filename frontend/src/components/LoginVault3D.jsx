import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function LoginVault3D({ status = 'idle' }) {
  const mountRef = useRef(null);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.z = 150;
    camera.position.y = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const size = Math.min(container.clientWidth || 360, 420);
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Central 3D Shield / Vault Core
    // Icosahedron with inner light
    const coreGeo = new THREE.IcosahedronGeometry(26, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Inner glowing nucleus
    const nucGeo = new THREE.OctahedronGeometry(14, 0);
    const nucMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.9
    });
    const nucleus = new THREE.Mesh(nucGeo, nucMat);
    core.add(nucleus);

    // 3. Concentric Gyroscope Hologram Rings
    const ring1Geo = new THREE.TorusGeometry(38, 0.9, 16, 60);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    scene.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(46, 0.8, 16, 60);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.6 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    scene.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(54, 0.7, 16, 60);
    const ring3Mat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.5 });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    scene.add(ring3);

    // 4. Orbiting Agent Node Satellites
    const agentCount = 5;
    const agentColors = [0x10b981, 0x3b82f6, 0x8b5cf6, 0x06b6d4, 0xf59e0b];
    const satellites = [];

    agentColors.forEach((color, idx) => {
      const satGeo = new THREE.SphereGeometry(3, 12, 12);
      const satMat = new THREE.MeshBasicMaterial({ color });
      const sat = new THREE.Mesh(satGeo, satMat);
      scene.add(sat);
      satellites.push({
        mesh: sat,
        radius: 64,
        speed: 1.0 + idx * 0.2,
        offset: (idx * Math.PI * 2) / agentCount
      });
    });

    // 5. Floating Data Dust Particles
    const dustCount = 180;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 140;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 140;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 140;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 2.5,
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // 6. Mouse Interaction tracking
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // 7. Animation Loop
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const st = statusRef.current;

      // Status color response
      if (st === 'authenticating') {
        coreMat.color.setHex(0xc084fc); // purple pulse
        core.rotation.y = elapsed * 2.5;
        core.rotation.x = elapsed * 1.5;
      } else if (st === 'success') {
        coreMat.color.setHex(0x10b981); // emerald success
        core.rotation.y = elapsed * 1.8;
      } else if (st === 'error') {
        coreMat.color.setHex(0xef4444); // red alert
        core.rotation.y = elapsed * 0.5;
      } else {
        coreMat.color.setHex(0x38bdf8); // calm cyan
        core.rotation.y = elapsed * 0.5;
        core.rotation.x = elapsed * 0.3;
      }

      nucleus.rotation.y = -elapsed * 0.8;

      // Mouse Parallax
      camera.position.x += (mouseX * 25 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 20 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Spinning gyroscope rings
      ring1.rotation.x = Math.PI / 4 + elapsed * 0.4;
      ring1.rotation.y = elapsed * 0.3;

      ring2.rotation.y = Math.PI / 3 - elapsed * 0.35;
      ring2.rotation.z = elapsed * 0.25;

      ring3.rotation.x = -Math.PI / 6 + elapsed * 0.2;
      ring3.rotation.z = -elapsed * 0.3;

      // Orbiting Satellites
      satellites.forEach((sat) => {
        const angle = elapsed * sat.speed + sat.offset;
        sat.mesh.position.x = Math.cos(angle) * sat.radius;
        sat.mesh.position.z = Math.sin(angle) * sat.radius;
        sat.mesh.position.y = Math.sin(angle * 3) * 14;
      });

      // Dust twinkle & rotation
      dust.rotation.y = elapsed * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      nucGeo.dispose();
      nucMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      ring3Geo.dispose();
      ring3Mat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        maxWidth: '380px',
        height: '380px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    />
  );
}
