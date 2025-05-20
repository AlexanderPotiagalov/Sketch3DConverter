"use client";

import React, { useRef, useEffect } from "react";

type ThreeViewProps = {
  className?: string;
};

export default function ThreeView({ className }: ThreeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // initialization will go here
  }, []);

  return <div ref={containerRef} className={className} />;
}
