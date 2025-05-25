"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import type { ExtrudeSpec } from "./ThreeView";

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

    // Renderer setup
    const width = container.clientWidth;
    const height = container.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(backgroundColor, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const canvasEl = renderer.domElement;
    container.appendChild(canvasEl);

    // Scene & camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 100, 500);
    camera.lookAt(0, 0, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dir1.position.set(50, 50, 100);
    dir1.castShadow = true;
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dir2.position.set(-50, 50, -100);
    scene.add(dir2);

    const point = new THREE.PointLight(0xffffff, 0.5);
    point.position.set(0, 150, 0);
    scene.add(point);

    // Grid
    if (showGrid) {
      scene.add(new THREE.GridHelper(500, 20, 0x555555, 0x333333));
    }

    // Controls
    const controls = new OrbitControls(camera, canvasEl);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;

    // Build extruded meshes
    const meshes: THREE.Mesh[] = [];
    shapes.forEach((spec) => {
      if (spec.type !== "extrude") return;

      // create 2D shape
      let shape2D: THREE.Shape;
      if (spec.shape === "circle" && spec.points.length >= 2) {
        const c = spec.points[0];
        const rPt = spec.points[1];
        const r = Math.hypot(rPt.x - c.x, rPt.y - c.y);
        shape2D = new THREE.Shape();
        shape2D.absarc(c.x, c.y, r, 0, Math.PI * 2, false);
      } else {
        shape2D = new THREE.Shape(
          spec.points.map((p) => new THREE.Vector2(p.x, p.y))
        );
      }

      // extrude settings
      const extrudeSettings = {
        depth: spec.height || 20,
        bevelEnabled: spec.bevelEnabled !== false,
        bevelThickness: spec.bevelThickness || 2,
        bevelSize: spec.bevelSize || 1,
        bevelSegments: spec.bevelSegments || 3,
      };

      // geometry + center
      const geom = new THREE.ExtrudeGeometry(shape2D, extrudeSettings);
      geom.center();

      let material: THREE.Material;
      switch (spec.materialType) {
        case "physical":
          material = new THREE.MeshPhysicalMaterial({
            color: spec.color,
            metalness: spec.metalness || 0.2,
            roughness: spec.roughness || 0.5,
            transparent: spec.transparent || false,
            opacity: spec.opacity || 1.0,
          });
          break;
        // … other material cases …
        default:
          material = new THREE.MeshBasicMaterial({
            color: spec.color,
            transparent: spec.transparent || false,
            opacity: spec.opacity || 1.0,
          });
      }

      const mesh = new THREE.Mesh(geom, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshes.push(mesh);
    });

    // Center camera on all meshes
    if (meshes.length) {
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 2;
      camera.position.set(center.x, center.y + maxDim / 2, center.z + distance);
      camera.lookAt(center);
      controls.target.copy(center);
      controls.update();
    }

    setIsLoading(false);

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      controls.dispose();

      // Dispose geometries & materials
      meshes.forEach((m) => {
        m.geometry.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else {
          (m.material as THREE.Material).dispose();
        }
      });

      renderer.dispose();
      if (canvasEl.parentElement === container) {
        container.removeChild(canvasEl);
      }
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
