"use client"

import { useEffect, useRef } from "react"
import { useThree, Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"

function ParticleSystem() {
  const { camera } = useThree()
  const pointsRef = useRef<THREE.Points>(null)

  useEffect(() => {
    camera.position.z = 1000
  }, [camera])

  useEffect(() => {
    if (!pointsRef.current) return

    const animate = () => {
      if (pointsRef.current) {
        pointsRef.current.rotation.x += 0.0003
        pointsRef.current.rotation.y += 0.0005
      }
      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  // Criar partículas
  const particleCount = 2000
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    positions[i3] = (Math.random() - 0.5) * 1000
    positions[i3 + 1] = (Math.random() - 0.5) * 1000
    positions[i3 + 2] = (Math.random() - 0.5) * 1000

    colors[i3] = 0
    colors[i3 + 1] = 0.5 + Math.random() * 0.5
    colors[i3 + 2] = 0.8 + Math.random() * 0.2
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 3,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}

export function ParticleCloud() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none", // Isso garante que os cliques passem através do canvas
      }}
    >
      <Canvas>
        <ParticleSystem />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  )
}

export default ParticleCloud
