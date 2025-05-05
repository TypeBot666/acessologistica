"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

export default function ParticleCloud({ isListening = true, theme = { primary: "#06b6d4", secondary: "#0891b2" } }) {
  const mountRef = useRef()
  const [audioContext, setAudioContext] = useState(null)
  const [analyser, setAnalyser] = useState(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const particlesRef = useRef(null)
  const animationIdRef = useRef(null)
  const isComponentMounted = useRef(true)

  // Configuração de sensibilidade - aumentada para efeito visual mais dramático
  const sensitivityConfig = {
    overall: 1.2, // Aumentado para efeito mais dramático
    rotation: 1.0, // Aumentado para rotação mais visível
    position: 0.8, // Aumentado para movimento mais visível
    scale: 0.7, // Aumentado para pulsação mais visível
    particleSize: 1.0, // Aumentado para partículas mais visíveis
  }

  useEffect(() => {
    // Set mounted flag
    isComponentMounted.current = true

    // Convert hex to THREE.js color
    const primaryColor = new THREE.Color(theme.primary)
    const secondaryColor = new THREE.Color(theme.secondary)

    // Setup THREE.js scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.z = 2.2 // Aproximado para compensar o tamanho menor
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    })

    // Ajustar o tamanho para preencher o contêiner
    const containerSize = Math.min(window.innerWidth, window.innerHeight) * 0.9
    renderer.setSize(containerSize, containerSize)
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer

    // Clear previous canvas
    if (mountRef.current && mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild)
    }

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement)
    }

    // Create particles - otimizado para visual mais impressionante
    const particleCount = 2500 // Aumentado para mais partículas
    const particleGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const originalPositions = new Float32Array(particleCount * 3)

    // Criar diferentes camadas de partículas para efeito visual mais interessante
    for (let i = 0; i < particleCount; i++) {
      let radius, x, y, z

      // 70% das partículas em uma esfera, 30% em um toro para efeito visual interessante
      if (i < particleCount * 0.7) {
        // Posição em esfera
        radius = Math.random() * 1.0 + 0.2 // Entre 0.2 e 1.2
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)

        x = radius * Math.sin(phi) * Math.cos(theta)
        y = radius * Math.sin(phi) * Math.sin(theta)
        z = radius * Math.cos(phi)
      } else {
        // Posição em toro (anel)
        const toroRadius = 0.8
        const tubeRadius = 0.2
        const u = Math.random() * Math.PI * 2
        const v = Math.random() * Math.PI * 2

        x = (toroRadius + tubeRadius * Math.cos(v)) * Math.cos(u)
        y = (toroRadius + tubeRadius * Math.cos(v)) * Math.sin(u)
        z = tubeRadius * Math.sin(v)
      }

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      // Armazena as posições originais para poder voltar a elas
      originalPositions[i * 3] = x
      originalPositions[i * 3 + 1] = y
      originalPositions[i * 3 + 2] = z

      // Cores com gradiente mais suave entre primária e secundária
      const mixFactor = Math.random()
      const colorFactor = Math.pow(mixFactor, 1.5) // Exponencial para distribuição não linear de cores

      colors[i * 3] = primaryColor.r * colorFactor + secondaryColor.r * (1 - colorFactor)
      colors[i * 3 + 1] = primaryColor.g * colorFactor + secondaryColor.g * (1 - colorFactor)
      colors[i * 3 + 2] = primaryColor.b * colorFactor + secondaryColor.b * (1 - colorFactor)

      // Tamanhos variados para efeito visual mais interessante
      const distFromCenter = Math.sqrt(x * x + y * y + z * z)
      sizes[i] = Math.random() * 0.05 + 0.03 + (1.0 - Math.min(distFromCenter, 1.0)) * 0.03
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))

    // Armazena as posições originais como um atributo personalizado
    particleGeometry.setAttribute("originalPosition", new THREE.BufferAttribute(originalPositions, 3))

    // Create shader material for better looking particles
    const particleMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)
    particlesRef.current = particles

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Adicionar luz pontual para efeito de brilho
    const pointLight = new THREE.PointLight(new THREE.Color(theme.primary).multiplyScalar(1.5), 1, 5)
    pointLight.position.set(0, 0, 2)
    scene.add(pointLight)

    // Initial animation
    let time = 0
    const animate = () => {
      if (!isComponentMounted.current) return

      time += 0.005 // Velocidade de rotação aumentada

      if (particles && isComponentMounted.current) {
        particles.rotation.y = time * 0.2 // Aumentado para ser mais visível
        particles.rotation.x = time * 0.1 // Aumentado para ser mais visível
      }

      if (renderer && scene && camera && isComponentMounted.current) {
        renderer.render(scene, camera)
      }

      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    if (isListening) {
      setupAudio()
    }

    // Ajustar tamanho ao redimensionar a janela
    const handleResize = () => {
      if (!isComponentMounted.current || !rendererRef.current || !cameraRef.current) return

      const containerSize = Math.min(window.innerWidth, window.innerHeight) * 0.9
      rendererRef.current.setSize(containerSize, containerSize)

      if (cameraRef.current) {
        cameraRef.current.aspect = 1
        cameraRef.current.updateProjectionMatrix()
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      isComponentMounted.current = false

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = null
      }

      if (audioContext && audioContext.state !== "closed") {
        try {
          audioContext.close()
        } catch (error) {
          console.log("Aviso: Erro ao fechar AudioContext", error)
        }
      }

      // Clean up THREE.js resources
      if (particlesRef.current) {
        if (particlesRef.current.geometry) {
          particlesRef.current.geometry.dispose()
        }
        if (particlesRef.current.material) {
          particlesRef.current.material.dispose()
        }
        particlesRef.current = null
      }

      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current = null
      }

      sceneRef.current = null
      cameraRef.current = null
    }
  }, [theme])

  useEffect(() => {
    if (isListening) {
      setupAudio()
    } else {
      cleanupAudio()
    }

    return () => {
      if (isComponentMounted.current) {
        cleanupAudio()
      }
    }
  }, [isListening])

  const setupAudio = async () => {
    try {
      if (!isComponentMounted.current) return

      // Verificar se o audioContext existe e não está fechado antes de tentar fechá-lo
      if (audioContext && audioContext.state !== "closed") {
        try {
          await audioContext.close()
        } catch (closeError) {
          console.log("Aviso: AudioContext já estava fechado ou não pôde ser fechado", closeError)
        }
      }

      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      setAudioContext(ctx)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const source = ctx.createMediaStreamSource(stream)
      const newAnalyser = ctx.createAnalyser()
      newAnalyser.fftSize = 128
      source.connect(newAnalyser)
      setAnalyser(newAnalyser)

      const data = new Uint8Array(newAnalyser.frequencyBinCount)

      // Cancel previous animation
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = null
      }

      // Animate with audio
      const animate = () => {
        if (!isComponentMounted.current) return

        animationIdRef.current = requestAnimationFrame(animate)

        if (!particlesRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return

        newAnalyser.getByteFrequencyData(data)

        // Calculate average volume and frequency distribution
        const volume = data.reduce((a, b) => a + b) / data.length / 255
        const bassVolume = data.slice(0, 4).reduce((a, b) => a + b) / 4 / 255
        const midVolume = data.slice(4, 12).reduce((a, b) => a + b) / 8 / 255
        const trebleVolume = data.slice(12, 24).reduce((a, b) => a + b) / 12 / 255

        // Aplicar a configuração de sensibilidade
        const adjustedVolume = volume * sensitivityConfig.overall
        const adjustedBass = bassVolume * sensitivityConfig.overall
        const adjustedMid = midVolume * sensitivityConfig.overall
        const adjustedTreble = trebleVolume * sensitivityConfig.overall

        // Update particle positions based on audio
        if (particlesRef.current && particlesRef.current.geometry) {
          const positions = particlesRef.current.geometry.attributes.position.array
          const originalPositions = particlesRef.current.geometry.attributes.originalPosition.array
          const sizes = particlesRef.current.geometry.attributes.size.array

          for (let i = 0; i < positions.length / 3; i++) {
            // Determine which frequency band affects this particle
            const distFromCenter = Math.sqrt(
              originalPositions[i * 3] ** 2 + originalPositions[i * 3 + 1] ** 2 + originalPositions[i * 3 + 2] ** 2,
            )

            // Retornar gradualmente à posição original com um fator de suavização
            const returnFactor = 0.85 // Aumentado de 0.8 para 0.85 - retorna mais lentamente
            positions[i * 3] = positions[i * 3] * returnFactor + originalPositions[i * 3] * (1 - returnFactor)
            positions[i * 3 + 1] =
              positions[i * 3 + 1] * returnFactor + originalPositions[i * 3 + 1] * (1 - returnFactor)
            positions[i * 3 + 2] =
              positions[i * 3 + 2] * returnFactor + originalPositions[i * 3 + 2] * (1 - returnFactor)

            // Apply different effects based on distance (frequency band)
            if (distFromCenter < 0.5) {
              // Bass affects inner particles - efeito mais perceptível
              const scale = 1 + adjustedBass * 0.6 * sensitivityConfig.position // Aumentado para ser mais visível
              positions[i * 3] *= scale
              positions[i * 3 + 1] *= scale
              positions[i * 3 + 2] *= scale
              sizes[i] = Math.random() * 0.04 + 0.03 + adjustedBass * 0.2 * sensitivityConfig.particleSize // Aumentado
            } else if (distFromCenter < 1.0) {
              // Mids affect middle layer - movimento angular mais perceptível
              const angle = adjustedMid * 0.4 * sensitivityConfig.position // Aumentado
              const x = positions[i * 3]
              const z = positions[i * 3 + 2]
              positions[i * 3] = x * Math.cos(angle) + z * Math.sin(angle)
              positions[i * 3 + 2] = -x * Math.sin(angle) + z * Math.cos(angle)
              sizes[i] = Math.random() * 0.04 + 0.03 + adjustedMid * 0.15 * sensitivityConfig.particleSize // Aumentado
            } else {
              // Treble affects outer particles - movimento mais perceptível
              positions[i * 3] += (Math.random() - 0.5) * adjustedTreble * 0.2 * sensitivityConfig.position // Aumentado
              positions[i * 3 + 1] += (Math.random() - 0.5) * adjustedTreble * 0.2 * sensitivityConfig.position
              positions[i * 3 + 2] += (Math.random() - 0.5) * adjustedTreble * 0.2 * sensitivityConfig.position
              sizes[i] = Math.random() * 0.04 + 0.03 + adjustedTreble * 0.15 * sensitivityConfig.particleSize // Aumentado
            }
          }

          particlesRef.current.geometry.attributes.position.needsUpdate = true
          particlesRef.current.geometry.attributes.size.needsUpdate = true

          // Overall scale based on volume - mais perceptível
          const scaleValue = 1 + adjustedVolume * 0.4 * sensitivityConfig.scale // Aumentado
          particlesRef.current.scale.set(scaleValue, scaleValue, scaleValue)

          // Rotate based on different frequency bands - rotação mais perceptível
          particlesRef.current.rotation.x += 0.001 + adjustedBass * 0.01 * sensitivityConfig.rotation // Aumentado
          particlesRef.current.rotation.y += 0.0015 + adjustedMid * 0.01 * sensitivityConfig.rotation // Aumentado
          particlesRef.current.rotation.z += 0.0008 + adjustedTreble * 0.008 * sensitivityConfig.rotation // Aumentado
        }

        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current)
        }
      }

      animate()
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const cleanupAudio = () => {
    if (!isComponentMounted.current) return

    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
      animationIdRef.current = null
    }

    // Verificar se o audioContext existe e não está fechado antes de tentar fechá-lo
    if (audioContext && audioContext.state !== "closed") {
      try {
        audioContext.close()
      } catch (closeError) {
        console.log("Aviso: AudioContext já estava fechado ou não pôde ser fechado", closeError)
      }
    }

    // Reset particles
    if (particlesRef.current && isComponentMounted.current) {
      particlesRef.current.scale.set(1, 1, 1)
      particlesRef.current.rotation.set(0, 0, 0)

      // Restaurar posições originais
      if (particlesRef.current.geometry) {
        const positions = particlesRef.current.geometry.attributes.position.array
        const originalPositions = particlesRef.current.geometry.attributes.originalPosition.array

        for (let i = 0; i < positions.length; i++) {
          positions[i] = originalPositions[i]
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true
      }

      // Start basic animation again
      let time = 0
      const animate = () => {
        if (!isComponentMounted.current) return

        time += 0.005 // Velocidade aumentada

        if (particlesRef.current) {
          particlesRef.current.rotation.y = time * 0.2
          particlesRef.current.rotation.x = time * 0.1
        }

        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current)
        }

        animationIdRef.current = requestAnimationFrame(animate)
      }

      animate()
    }
  }

  return (
    <div ref={mountRef} className="w-full h-full flex items-center justify-center">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle, ${theme.primary}30 0%, transparent 70%)`,
        }}
      />
    </div>
  )
}
