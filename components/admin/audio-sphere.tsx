"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

// Componente da esfera reativa ao áudio
function AudioReactiveSphere({ audioData = new Uint8Array(), bassLevel = 0 }) {
  // Refs para os objetos 3D
  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const groupRef = useRef<THREE.Group>(null)

  // Refs para armazenar as posições originais
  const originalPositions = useRef<Float32Array | null>(null)
  const originalLinePositions = useRef<Float32Array | null>(null)

  // Configuração da esfera
  const radius = 1
  const segments = 32
  const rings = 16

  // Efeito de inicialização - cria a geometria uma vez
  useEffect(() => {
    if (!pointsRef.current || !linesRef.current || originalPositions.current) return

    // Criar geometria da esfera
    const sphereGeometry = new THREE.SphereGeometry(radius, segments, rings)

    // Extrair posições dos vértices para os pontos
    const positions = sphereGeometry.attributes.position.array.slice()
    originalPositions.current = new Float32Array(positions)

    // Atualizar a geometria dos pontos
    if (pointsRef.current.geometry) {
      pointsRef.current.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3))
    }

    // Criar linhas conectando pontos próximos
    const indices = []
    const vertices = []
    const posArray = sphereGeometry.attributes.position.array
    const vertexCount = posArray.length / 3

    // Conectar pontos em anéis horizontais
    for (let ring = 0; ring < rings; ring++) {
      const verticesInRing = segments + 1
      const startIdx = ring * verticesInRing

      for (let i = 0; i < segments; i++) {
        const idx1 = startIdx + i
        const idx2 = startIdx + ((i + 1) % segments)

        if (idx1 < vertexCount && idx2 < vertexCount) {
          // Adicionar linha horizontal
          vertices.push(
            posArray[idx1 * 3],
            posArray[idx1 * 3 + 1],
            posArray[idx1 * 3 + 2],
            posArray[idx2 * 3],
            posArray[idx2 * 3 + 1],
            posArray[idx2 * 3 + 2],
          )

          // Adicionar linha vertical (conectando com o próximo anel)
          if (ring < rings - 1) {
            const idx3 = (ring + 1) * verticesInRing + i
            if (idx3 < vertexCount) {
              vertices.push(
                posArray[idx1 * 3],
                posArray[idx1 * 3 + 1],
                posArray[idx1 * 3 + 2],
                posArray[idx3 * 3],
                posArray[idx3 * 3 + 1],
                posArray[idx3 * 3 + 2],
              )
            }
          }
        }
      }
    }

    // Armazenar posições originais das linhas
    originalLinePositions.current = new Float32Array(vertices)

    // Atualizar a geometria das linhas
    if (linesRef.current.geometry) {
      linesRef.current.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3))
    }
  }, [radius, segments, rings])

  // Animação e reação ao áudio
  useFrame((state) => {
    if (!groupRef.current) return

    // Rotação suave
    groupRef.current.rotation.y += 0.002
    groupRef.current.rotation.x += 0.001

    // Reagir ao áudio para os pontos
    if (pointsRef.current?.geometry && originalPositions.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array

      // Aplicar distorção baseada no áudio para cada ponto
      for (let i = 0; i < positions.length; i += 3) {
        const idx = Math.floor(i / 3) % audioData.length
        const audioValue = audioData[idx] / 255

        // Distorção baseada no áudio
        const distortionFactor = 1 + audioValue * 0.3 * (Math.sin(i * 0.01) * 0.5 + 0.5)
        positions[i] = originalPositions.current[i] * distortionFactor
        positions[i + 1] = originalPositions.current[i + 1] * distortionFactor
        positions[i + 2] = originalPositions.current[i + 2] * distortionFactor
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true

      // Pulsar tamanho dos pontos com o grave
      if (pointsRef.current.material) {
        const material = pointsRef.current.material as THREE.PointsMaterial
        material.size = 0.03 + bassLevel * 0.1
        material.opacity = 0.7 + bassLevel * 0.3
      }
    }

    // Reagir ao áudio para as linhas
    if (linesRef.current?.geometry && originalLinePositions.current) {
      const positions = linesRef.current.geometry.attributes.position.array as Float32Array

      // Aplicar distorção baseada no áudio para cada linha
      for (let i = 0; i < positions.length; i += 3) {
        const idx = Math.floor(i / 6) % audioData.length
        const audioValue = audioData[idx] / 255

        // Distorção mais sutil para as linhas
        const distortionFactor = 1 + audioValue * 0.2 * (Math.sin(i * 0.01) * 0.5 + 0.5)
        positions[i] = originalLinePositions.current[i] * distortionFactor
        positions[i + 1] = originalLinePositions.current[i + 1] * distortionFactor
        positions[i + 2] = originalLinePositions.current[i + 2] * distortionFactor
      }

      linesRef.current.geometry.attributes.position.needsUpdate = true

      // Pulsar opacidade das linhas com o grave
      if (linesRef.current.material) {
        const material = linesRef.current.material as THREE.LineBasicMaterial
        material.opacity = 0.3 + bassLevel * 0.7
      }
    }
  })

  return (
    <group ref={groupRef}>
      {/* Pontos */}
      <points ref={pointsRef}>
        <bufferGeometry />
        <pointsMaterial
          size={0.03}
          color="#ff3333"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {/* Linhas */}
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#ff3333" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  )
}

// Componente de estrelas simples
function SimpleStars({ count = 2000 }) {
  const starsRef = useRef<THREE.Points>(null)

  // Criar geometria de estrelas
  useEffect(() => {
    if (!starsRef.current) return

    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100
    }

    if (starsRef.current.geometry) {
      starsRef.current.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    }
  }, [count])

  return (
    <points ref={starsRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.1}
        color="#ffffff"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

export default function AudioSphereScene() {
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128).fill(0))
  const [bassLevel, setBassLevel] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  // Inicializa o sistema de áudio e reproduz o arquivo de áudio
  useEffect(() => {
    // Criar elemento de áudio
    const audio = new Audio("/audio/welcome.mp3")
    audioRef.current = audio
    audio.preload = "auto"

    // Configurar eventos
    audio.addEventListener("canplaythrough", () => {
      try {
        // Inicializar o contexto de áudio
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContext) {
          console.error("AudioContext não suportado")
          return
        }

        const audioContext = new AudioContext()
        audioContextRef.current = audioContext

        // Criar analisador
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyserRef.current = analyser

        // Conectar o áudio ao analisador
        const source = audioContext.createMediaElementSource(audio)
        source.connect(analyser)
        analyser.connect(audioContext.destination)

        // Reproduzir o áudio após um pequeno delay
        setTimeout(() => {
          audio.play().catch((err) => {
            console.error("Erro ao reproduzir áudio:", err)
            // Iniciar simulação de áudio se a reprodução falhar
            startAudioSimulation()
          })
          setIsPlaying(true)
        }, 1000)
      } catch (error) {
        console.error("Erro ao inicializar o contexto de áudio:", error)
        // Iniciar simulação de áudio se houver erro
        startAudioSimulation()
      }
    })

    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      startAudioSimulation()
    })

    audio.addEventListener("error", (e) => {
      console.error("Erro no áudio:", e)
      setIsPlaying(false)
      startAudioSimulation()
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

      try {
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
          audioContextRef.current.close().catch((err) => {
            console.error("Erro ao fechar o contexto de áudio:", err)
          })
        }
      } catch (error) {
        console.error("Erro durante a limpeza do componente:", error)
      }
    }
  }, [])

  // Analisar o áudio em tempo real
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) return

    const analyzeAudio = () => {
      if (!analyserRef.current) return

      // Analisar frequências
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyserRef.current.getByteFrequencyData(dataArray)

      // Atualizar dados de áudio para visualização
      setAudioData(dataArray)

      // Calcular nível de grave (média das frequências baixas)
      const bassFrequencies = Array.from(dataArray.slice(0, 8))
      const bassAvg = bassFrequencies.reduce((sum, val) => sum + val, 0) / Math.max(1, bassFrequencies.length)
      setBassLevel(bassAvg / 255)

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

  // Função para simular dados de áudio quando não há áudio real
  const startAudioSimulation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const simulatePulse = () => {
      const time = Date.now() / 1000
      const value = (Math.sin(time) + 1) / 4 // Valor entre 0 e 0.5
      setBassLevel(value)

      // Simular dados de frequência
      const simulatedData = new Uint8Array(128)
      for (let i = 0; i < 128; i++) {
        const phase = (i / 128) * Math.PI * 2
        simulatedData[i] = Math.max(0, Math.min(255, 50 + Math.sin(time * 2 + phase) * 30))
      }
      setAudioData(simulatedData)

      animationRef.current = requestAnimationFrame(simulatePulse)
    }

    simulatePulse()
  }

  return (
    <div className="w-full h-64">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <AudioReactiveSphere audioData={audioData} bassLevel={bassLevel} />
        <SimpleStars />
        <mesh>
          <sphereGeometry args={[50, 16, 8]} />
          <meshBasicMaterial color="black" side={THREE.BackSide} />
        </mesh>
      </Canvas>
    </div>
  )
}
