"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      canvas.style.display = "none";
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.25, 8.5);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.35 : 1.8));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const device = new THREE.Group();
    device.rotation.set(-0.18, -0.54, -0.04);
    scene.add(device);

    const silver = new THREE.MeshPhysicalMaterial({
      color: 0xb9c2d2,
      metalness: 0.92,
      roughness: 0.19,
      clearcoat: 0.7,
      clearcoatRoughness: 0.16,
    });
    const darkMetal = new THREE.MeshPhysicalMaterial({
      color: 0x101722,
      metalness: 0.88,
      roughness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.14,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x07111e,
      metalness: 0.1,
      roughness: 0.04,
      transmission: 0.16,
      transparent: true,
      opacity: 0.88,
      clearcoat: 1,
    });

    const base = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.18, 2.74, 7, 3, 7), silver);
    base.position.y = -0.82;
    base.rotation.x = -0.025;
    device.add(base);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.73, 0.025, 2.36), darkMetal);
    deck.position.set(0, -0.71, -0.02);
    deck.rotation.x = -0.025;
    device.add(deck);

    const screenGroup = new THREE.Group();
    screenGroup.position.set(0, 0.63, 1.12);
    screenGroup.rotation.x = -0.17;
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(4.1, 2.61, 0.14, 6, 6, 2), darkMetal);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(3.82, 2.33, 0.035), glass);
    screen.position.z = 0.09;
    screenGroup.add(bezel, screen);
    device.add(screenGroup);

    const screenGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.9),
      new THREE.MeshBasicMaterial({ color: 0x244b79, transparent: true, opacity: 0.18 }),
    );
    screenGlow.position.set(0, 0, 0.125);
    screenGroup.add(screenGlow);

    const keyMaterial = new THREE.MeshBasicMaterial({ color: 0x6c88aa, transparent: true, opacity: 0.55 });
    for (let x = -1.35; x <= 1.35; x += 0.3) {
      for (let z = -0.55; z <= 0.35; z += 0.25) {
        const key = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.016, 0.12), keyMaterial);
        key.position.set(x, -0.68, z);
        key.rotation.x = -0.025;
        device.add(key);
      }
    }

    const haloMaterial = new THREE.MeshBasicMaterial({ color: 0x85b4ff, transparent: true, opacity: 0.2 });
    const haloA = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.008, 4, 128), haloMaterial);
    haloA.rotation.set(1.12, 0.28, 0.22);
    const haloB = new THREE.Mesh(new THREE.TorusGeometry(4.15, 0.008, 4, 128), haloMaterial.clone());
    haloB.material.opacity = 0.1;
    haloB.rotation.set(0.7, -0.35, -0.5);
    scene.add(haloA, haloB);

    const particleCount = window.innerWidth < 768 ? 620 : 1450;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.9 + Math.random() * 2.3;
      const wobble = (Math.random() - 0.5) * 1.7;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle * 2.1) * 0.58 + wobble;
      positions[i * 3 + 2] = Math.sin(angle) * radius * 0.45 + (Math.random() - 0.5) * 2;
    }
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particlesGeometry,
      new THREE.PointsMaterial({ color: 0xb8d5ff, size: 0.025, transparent: true, opacity: 0.78, sizeAttenuation: true }),
    );
    scene.add(particles);

    scene.add(new THREE.AmbientLight(0x94a9c8, 1.5));
    const keyLight = new THREE.PointLight(0xa7c7ff, 26, 18, 2);
    keyLight.position.set(-3.5, 3.8, 4.7);
    const rimLight = new THREE.PointLight(0x3e7eff, 30, 16, 2);
    rimLight.position.set(3.8, -1.2, 2.5);
    scene.add(keyLight, rimLight);

    let pointerX = 0;
    let pointerY = 0;
    let scrollProgress = 0;
    const onPointerMove = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => {
      scrollProgress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
    };
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    resize();

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const time = clock.getElapsedTime();
      if (!reduceMotion) {
        device.rotation.y += ((-0.54 + pointerX * 0.11 + scrollProgress * 0.45) - device.rotation.y) * 0.032;
        device.rotation.x += ((-0.18 + pointerY * -0.05 + scrollProgress * 0.1) - device.rotation.x) * 0.032;
        device.position.y = Math.sin(time * 0.7) * 0.08 - scrollProgress * 0.42;
        particles.rotation.y = time * 0.055;
        haloA.rotation.z = time * 0.05;
        haloB.rotation.z = -time * 0.033;
      }
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      particlesGeometry.dispose();
      keyMaterial.dispose();
      silver.dispose();
      darkMetal.dispose();
      glass.dispose();
      haloMaterial.dispose();
      (haloB.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}
