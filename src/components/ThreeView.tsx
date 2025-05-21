"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";

type ThreeViewProps = {
  className?: string;
};

export default function ThreeView({ className }: ThreeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Renderer with white background
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xffffff, 1);
    containerRef.current.appendChild(renderer.domElement);
  }, []);

  return <div ref={containerRef} className={className} />;
}
