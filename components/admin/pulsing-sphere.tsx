"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { useSpring, animated } from "@react-spring/three"
import { Environment, OrbitControls } from "@react-three/drei"
import type * as THREE from "three"

function PulsingSphere({ audioData }: { audioData: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Animação de pulso baseada nos dados de áudio
  const { scale } = useSpring({
    scale: 1 + audioData * 0.3,
    config: { tension: 300, friction: 10 },
  })

  // Rotação suave
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
      meshRef.current.rotation.x += 0.002
    }
  })

  return (
    <animated.mesh ref={meshRef} scale={scale}>
      <sphereGeometry args={[1, 64, 64]} />
      <animated.meshStandardMaterial
        color="#ff3333"
        emissive="#ff0000"
        emissiveIntensity={0.5 + audioData * 0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </animated.mesh>
  )
}

export default function PulsingSphereScene() {
  const [audioData, setAudioData] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const isInitializedRef = useRef(false)

  // Inicializa o sistema de áudio e reproduz a mensagem de voz
  useEffect(() => {
    // Evita inicialização múltipla
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    const initAudioContext = () => {
      try {
        if (!audioContextRef.current || audioContextRef.current.state === "closed") {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
          analyserRef.current = audioContextRef.current.createAnalyser()
          analyserRef.current.fftSize = 32

          const bufferLength = analyserRef.current.frequencyBinCount
          dataArrayRef.current = new Uint8Array(bufferLength)

          // Conecta o analisador à saída de áudio
          const destination = audioContextRef.current.destination
          analyserRef.current.connect(destination)
        }
      } catch (error) {
        console.error("Erro ao inicializar o contexto de áudio:", error)
      }
    }

    const playWelcomeMessage = () => {
      try {
        initAudioContext()

        // Cria a mensagem de voz
        const utterance = new SpeechSynthesisUtterance("Olá chefe, como vai? Vamos começar?")
        utterance.rate = 1
        utterance.pitch = 0.9
        utterance.volume = 1
        utterance.lang = "pt-BR"

        // Seleciona uma voz feminina se disponível
        const voices = window.speechSynthesis.getVoices()
        const femaleVoice = voices.find(
          (voice) => voice.name.includes("female") || voice.name.includes("Google") || voice.lang.includes("pt"),
        )
        if (femaleVoice) {
          utterance.voice = femaleVoice
        }

        // Eventos para controlar a animação
        utterance.onstart = () => setIsPlaying(true)
        utterance.onend = () => setIsPlaying(false)

        // Reproduz a mensagem
        window.speechSynthesis.speak(utterance)
      } catch (error) {
        console.error("Erro ao reproduzir mensagem de voz:", error)
      }
    }

    // Carrega as vozes e reproduz a mensagem após um pequeno delay
    if (typeof window !== "undefined") {
      const timeoutId = setTimeout(() => {
        if (window.speechSynthesis.getVoices().length > 0) {
          playWelcomeMessage()
        } else {
          const voicesChangedHandler = () => {
            playWelcomeMessage()
            window.speechSynthesis.onvoiceschanged = null
          }
          window.speechSynthesis.onvoiceschanged = voicesChangedHandler
        }
      }, 1000)

      return () => {
        clearTimeout(timeoutId)
        window.speechSynthesis.cancel() // Cancela qualquer fala em andamento
      }
    }
  }, [])

  // Efeito separado para análise de áudio
  useEffect(() => {
    let animationFrameId: number

    // Função para analisar o áudio e atualizar os dados
    const analyzeAudio = () => {
      if (!isPlaying || !analyserRef.current || !dataArrayRef.current) return

      analyserRef.current.getByteFrequencyData(dataArrayRef.current)

      // Calcula a média dos graves (primeiros 4 bins de frequência)
      const bassAvg = Array.from(dataArrayRef.current.slice(0, 4)).reduce((sum, value) => sum + value, 0) / 4

      // Normaliza para um valor entre 0 e 1
      setAudioData(bassAvg / 255)

      animationFrameId = requestAnimationFrame(analyzeAudio)
    }

    if (isPlaying) {
      analyzeAudio()
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isPlaying])

  // Efeito de limpeza quando o componente é desmontado
  useEffect(() => {
    return () => {
      try {
        // Verifica se o contexto existe e não está fechado antes de tentar fechá-lo
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

  return (
    <div className="w-full h-64">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <PulsingSphere audioData={audioData} />
        <Environment preset="studio" />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  )
}
