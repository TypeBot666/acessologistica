"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { useSpring, animated } from "@react-spring/three"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"

// Componente personalizado de estrelas para substituir o Stars que está causando erro
function CustomStars({ count = 5000 }) {
  const starsRef = useRef<THREE.Points>(null)

  // Criar geometria de estrelas
  const [geometry, material] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    // Gerar posições aleatórias em uma esfera
    for (let i = 0; i < count; i++) {
      // Distribuição esférica
      const radius = 50 + Math.random() * 50 // Entre 50 e 100
      const theta = Math.random() * Math.PI * 2 // 0 a 2π
      const phi = Math.acos(Math.random() * 2 - 1) // Distribuição uniforme na esfera

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      // Tamanhos variados
      sizes[i] = Math.random() * 2
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))

    // Material para as estrelas
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    return [geometry, material]
  }, [count])

  // Animação sutil das estrelas
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0001
      starsRef.current.rotation.x += 0.00005
    }
  })

  return <points ref={starsRef} geometry={geometry} material={material} />
}

// Componente da esfera de rede (pontos e linhas) que reage ao áudio
function NetworkSphere({ audioData = [], bassLevel = 0 }) {
  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const groupRef = useRef<THREE.Group>(null)
  const originalPositions = useRef<Float32Array | null>(null)
  const lineOriginalPositions = useRef<Float32Array | null>(null)

  // Animação de escala baseada no grave do áudio
  const { scale } = useSpring({
    scale: 1 + bassLevel * 0.4,
    config: { tension: 300, friction: 10 },
  })

  // Criar geometria de pontos e linhas
  const [pointsGeometry, linesGeometry, pointsMaterial, linesMaterial] = useMemo(() => {
    // Parâmetros da esfera
    const radius = 1
    const detail = 3 // Detalhe suficiente para visual interessante sem sobrecarregar

    // Criar geometria base para extrair pontos
    const sphereGeometry = new THREE.IcosahedronGeometry(radius, detail)

    // Extrair vértices para pontos
    const pointsGeometry = new THREE.BufferGeometry()
    const positions = sphereGeometry.attributes.position.array.slice()
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    originalPositions.current = new Float32Array(positions)

    // Criar material para pontos
    const pointsMaterial = new THREE.PointsMaterial({
      color: "#ff3333",
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
    })

    // Criar geometria para linhas com abordagem mais eficiente
    const linesGeometry = new THREE.BufferGeometry()
    const vertices = []
    const posArray = sphereGeometry.attributes.position.array
    const positionsCount = posArray.length / 3

    // Abordagem mais segura: conectar pontos estrategicamente
    const maxConnections = 2 // Limitar número de conexões por ponto
    const threshold = 0.8 // Distância máxima para conectar pontos

    for (let i = 0; i < positionsCount; i++) {
      const x1 = posArray[i * 3]
      const y1 = posArray[i * 3 + 1]
      const z1 = posArray[i * 3 + 2]

      let connections = 0

      // Conectar apenas com os próximos pontos e limitar o número de conexões
      for (let j = i + 1; j < positionsCount && connections < maxConnections; j++) {
        const x2 = posArray[j * 3]
        const y2 = posArray[j * 3 + 1]
        const z2 = posArray[j * 3 + 2]

        // Calcular distância entre pontos
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2))

        // Se os pontos estiverem próximos o suficiente, criar uma linha
        if (distance < threshold) {
          vertices.push(x1, y1, z1)
          vertices.push(x2, y2, z2)
          connections++
        }
      }
    }

    // Verificar se temos vértices suficientes para criar linhas
    if (vertices.length > 0) {
      linesGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
      lineOriginalPositions.current = new Float32Array(vertices)
    } else {
      // Fallback: criar pelo menos uma linha invisível para evitar erros
      linesGeometry.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0.001], 3))
      lineOriginalPositions.current = new Float32Array([0, 0, 0, 0, 0, 0.001])
    }

    // Criar material para linhas
    const linesMaterial = new THREE.LineBasicMaterial({
      color: "#ff3333",
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    })

    return [pointsGeometry, linesGeometry, pointsMaterial, linesMaterial]
  }, [])

  // Animação e reação ao áudio
  useFrame((state) => {
    if (!groupRef.current) return

    // Rotação suave
    groupRef.current.rotation.y += 0.002
    groupRef.current.rotation.x += 0.001

    // Reagir ao áudio para os pontos
    if (pointsRef.current && pointsRef.current.geometry && originalPositions.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array

      // Aplicar distorção baseada no áudio para cada ponto
      for (let i = 0; i < positions.length; i += 3) {
        const idx = Math.floor(i / 3) % Math.max(1, audioData.length)
        const audioValue = audioData.length ? audioData[idx] / 255 : 0

        // Distorção baseada no áudio
        positions[i] = originalPositions.current[i] * (1 + audioValue * 0.2)
        positions[i + 1] = originalPositions.current[i + 1] * (1 + audioValue * 0.2)
        positions[i + 2] = originalPositions.current[i + 2] * (1 + audioValue * 0.2)
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true

      // Pulsar tamanho dos pontos com o grave
      const material = pointsRef.current.material as THREE.PointsMaterial
      material.size = 0.05 + bassLevel * 0.1
    }

    // Reagir ao áudio para as linhas
    if (linesRef.current && linesRef.current.geometry && lineOriginalPositions.current) {
      const positions = linesRef.current.geometry.attributes.position.array as Float32Array

      // Aplicar distorção baseada no áudio para cada linha
      for (let i = 0; i < positions.length; i += 3) {
        const idx = Math.floor(i / 6) % Math.max(1, audioData.length) // Cada linha tem 6 valores (2 pontos x 3 coordenadas)
        const audioValue = audioData.length ? audioData[idx] / 255 : 0

        // Distorção mais sutil para as linhas
        positions[i] = lineOriginalPositions.current[i] * (1 + audioValue * 0.15)
        positions[i + 1] = lineOriginalPositions.current[i + 1] * (1 + audioValue * 0.15)
        positions[i + 2] = lineOriginalPositions.current[i + 2] * (1 + audioValue * 0.15)
      }

      linesRef.current.geometry.attributes.position.needsUpdate = true

      // Pulsar opacidade das linhas com o grave
      const material = linesRef.current.material as THREE.LineBasicMaterial
      material.opacity = 0.4 + bassLevel * 0.6
    }
  })

  return (
    <animated.group ref={groupRef} scale={scale}>
      <points ref={pointsRef} geometry={pointsGeometry} material={pointsMaterial} />
      <lineSegments ref={linesRef} geometry={linesGeometry} material={linesMaterial} />
    </animated.group>
  )
}

export default function NetworkSphereScene() {
  const [audioData, setAudioData] = useState<number[]>([])
  const [bassLevel, setBassLevel] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const isInitializedRef = useRef(false)

  // Inicializa o sistema de áudio e reproduz o arquivo de áudio
  useEffect(() => {
    // Evita inicialização múltipla
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    // Criar elemento de áudio
    const audio = new Audio("/audio/welcome.mp3")
    audioRef.current = audio
    audio.preload = "auto"

    // Configurar eventos
    audio.addEventListener("canplaythrough", () => {
      // Inicializar o contexto de áudio quando o arquivo estiver pronto
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        const audioContext = new AudioContext()
        audioContextRef.current = audioContext

        // Criar analisador
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 128 // Valor maior para mais detalhes de frequência
        analyserRef.current = analyser

        // Conectar o áudio ao analisador
        const source = audioContext.createMediaElementSource(audio)
        source.connect(analyser)
        analyser.connect(audioContext.destination)
        sourceRef.current = source

        // Reproduzir o áudio após um pequeno delay
        setTimeout(() => {
          audio.play().catch((err) => console.error("Erro ao reproduzir áudio:", err))
          setIsPlaying(true)
        }, 1000)
      } catch (error) {
        console.error("Erro ao inicializar o contexto de áudio:", error)
      }
    })

    audio.addEventListener("ended", () => {
      setIsPlaying(false)
    })

    audio.addEventListener("error", (e) => {
      console.error("Erro no áudio:", e)
      setIsPlaying(false)
    })

    // Limpar recursos quando o componente for desmontado
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch((err) => {
          console.error("Erro ao fechar o contexto de áudio:", err)
        })
      }
    }
  }, [])

  // Analisar o áudio em tempo real
  useEffect(() => {
    if (!isPlaying) return

    const analyzeAudio = () => {
      if (!analyserRef.current) return

      // Analisar frequências
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyserRef.current.getByteFrequencyData(dataArray)

      // Atualizar dados de áudio para visualização
      setAudioData(Array.from(dataArray))

      // Calcular nível de grave (média das frequências baixas)
      const bassFrequencies = dataArray.slice(0, 8) // Primeiras 8 frequências (graves)
      const bassAvg = bassFrequencies.reduce((sum, val) => sum + val, 0) / bassFrequencies.length
      setBassLevel(bassAvg / 255) // Normalizar para 0-1

      // Continuar analisando
      animationRef.current = requestAnimationFrame(analyzeAudio)
    }

    analyzeAudio()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  // Efeito para simular pulso quando não há áudio
  useEffect(() => {
    if (isPlaying) return

    const simulatePulse = () => {
      const time = Date.now() / 1000
      const value = (Math.sin(time) + 1) / 4 // Valor entre 0 e 0.5
      setBassLevel(value)

      // Simular dados de frequência
      const simulatedData = Array(64)
        .fill(0)
        .map((_, i) => {
          const phase = (i / 64) * Math.PI * 2
          return Math.max(0, Math.min(255, 50 + Math.sin(time * 2 + phase) * 30))
        })
      setAudioData(simulatedData)

      animationRef.current = requestAnimationFrame(simulatePulse)
    }

    simulatePulse()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  return (
    <div className="w-full h-64">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <NetworkSphere audioData={audioData} bassLevel={bassLevel} />
        <CustomStars count={3000} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  )
}
