"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export type ExtrudeSpec = {
  type: "extrude";
  points: { x: number; y: number }[];
  color: string;
  height: number;
  shape?: string;
  depth?: number;
  bevelEnabled?: boolean;
  bevelThickness?: number;
  bevelSize?: number;
  bevelSegments?: number;
  materialType?: "standard" | "physical" | "basic" | "lambert" | "phong";
  metalness?: number;
  roughness?: number;
  transparent?: boolean;
  opacity?: number;
};

type ThreeViewProps = {
  className?: string;
  shapes?: ExtrudeSpec[];
  backgroundColor?: string;
  autoRotate?: boolean;
  showGrid?: boolean;
};

export default function ThreeView({
  className,
  shapes = [],
  backgroundColor = "#f0f0f0",
  autoRotate = true,
  showGrid = true,
}: ThreeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);

    const width = container.clientWidth;
    const height = container.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(backgroundColor, 1);
    container.appendChild(renderer.domElement);

    // Scene and camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 100);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 50, 50);
    scene.add(dirLight);

    // OrbitControls for rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = autoRotate;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    setIsLoading(false);

    return () => {
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [shapes, backgroundColor, autoRotate, showGrid]);

  return (
    <div ref={containerRef} className={className}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
}
