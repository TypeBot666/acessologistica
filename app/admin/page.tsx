"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import ParticleCloud from "@/components/admin/particle-cloud"
import { Mic, MicOff, Lock, Loader2, AlertCircle, KeyRound } from "lucide-react"

export default function VoiceLoginPage() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [feedback, setFeedback] = useState("")
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "success" | "error">("idle")
  const [showTranscript, setShowTranscript] = useState(false)
  const [manualPassword, setManualPassword] = useState("")
  const [microphoneError, setMicrophoneError] = useState(false)
  const router = useRouter()

  // Referências
  const recognitionRef = useRef<any>(null)

  // A senha de voz (em minúsculas para facilitar a comparação)
  const VOICE_PASSWORD = "acesso logistica"

  // Verificar se já está autenticado
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin-auth")
    if (isAuthenticated === "true") {
      router.push("/admin/dashboard")
    }
  }, [router])

  // Função para iniciar a escuta
  const startListening = async () => {
    setTranscript("")
    setFeedback("")
    setShowTranscript(true)

    try {
      // Verificar permissão do microfone
      await navigator.mediaDevices.getUserMedia({ audio: true })

      // Inicializar reconhecimento de voz
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        throw new Error("Reconhecimento de voz não suportado")
      }

      // Criar nova instância a cada vez para evitar problemas
      const recognition = new SpeechRecognition()
      recognition.lang = "pt-BR"
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        console.log("Reconhecimento iniciado")
        setIsListening(true)
        setStatus("listening")
        setFeedback("Ouvindo... Fale 'acesso logistica'")
      }

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1
        const speechResult = event.results[last][0].transcript.toLowerCase()
        console.log("Texto reconhecido:", speechResult)

        setTranscript(speechResult)

        // Verificar se contém a senha
        if (speechResult.includes("acesso") && speechResult.includes("logistica")) {
          recognition.stop()
          setStatus("success")
          setFeedback("Acesso autorizado!")

          // Autenticar e redirecionar
          localStorage.setItem("admin-auth", "true")
          setTimeout(() => {
            router.push("/admin/dashboard")
          }, 1500)
        }
      }

      recognition.onerror = (event: any) => {
        console.error("Erro no reconhecimento:", event.error)
        setIsListening(false)
        setStatus("error")
        setMicrophoneError(true)
        setFeedback("Erro no reconhecimento. Use o login manual.")
      }

      recognition.onend = () => {
        console.log("Reconhecimento encerrado")
        setIsListening(false)
        if (status === "listening") {
          setStatus("idle")
        }
      }

      // Armazenar referência e iniciar
      recognitionRef.current = recognition
      recognition.start()
    } catch (error) {
      console.error("Erro ao iniciar reconhecimento:", error)
      setStatus("error")
      setMicrophoneError(true)
      setFeedback("Erro ao acessar microfone. Use o login manual.")
    }
  }

  // Função para parar a escuta
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.error("Erro ao parar reconhecimento:", e)
      }
    }
    setIsListening(false)
    setStatus("idle")
  }

  // Função para login manual
  const handleManualLogin = () => {
    setStatus("processing")

    setTimeout(() => {
      if (manualPassword.toLowerCase().includes("acesso") && manualPassword.toLowerCase().includes("logistica")) {
        setStatus("success")
        setFeedback("Acesso autorizado")

        // Autenticar e redirecionar
        localStorage.setItem("admin-auth", "true")
        setTimeout(() => {
          router.push("/admin/dashboard")
        }, 1000)
      } else {
        setStatus("error")
        setFeedback("Senha incorreta. Tente novamente.")
      }
    }, 300)
  }

  // Função para renderizar o ícone de status
  const renderStatusIcon = () => {
    switch (status) {
      case "listening":
        return <Mic className="h-6 w-6 text-red-500 animate-pulse" />
      case "processing":
        return <Loader2 className="h-6 w-6 text-yellow-500 animate-spin" />
      case "success":
        return <Lock className="h-6 w-6 text-green-500" />
      case "error":
        return <MicOff className="h-6 w-6 text-red-500" />
      default:
        return <Mic className="h-6 w-6 text-gray-400" />
    }
  }

  // Função para obter a mensagem de status
  const getStatusMessage = () => {
    if (feedback) return feedback

    switch (status) {
      case "listening":
        return "Ouvindo comando de voz... Fale 'acesso logistica'"
      case "processing":
        return "Verificando acesso..."
      case "success":
        return "Acesso autorizado"
      case "error":
        return "Acesso negado. Tente novamente."
      default:
        return "Clique para falar a senha: 'acesso logistica'"
    }
  }

  // Função para obter a cor do status
  const getStatusColor = () => {
    switch (status) {
      case "listening":
        return "text-red-400"
      case "processing":
        return "text-yellow-400"
      case "success":
        return "text-green-400"
      case "error":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 overflow-hidden">
      {/* Efeito de fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(50,0,0,0.3),rgba(0,0,0,0.8))]"></div>

      {/* Conteúdo principal */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Título */}
        <h1 className="text-2xl md:text-3xl font-light text-white mb-16 mt-[-120px] tracking-wider">
          SISTEMA DE SEGURANÇA RBS
        </h1>

        {/* Container principal */}
        <div className="bg-black bg-opacity-50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 w-full max-w-sm flex flex-col items-center">
          {/* Ícone de status */}
          <div className="mb-4">{renderStatusIcon()}</div>

          {/* Status */}
          <div className={`text-sm mb-6 ${getStatusColor()} text-center`}>{getStatusMessage()}</div>

          {/* Botão de nuvem de partículas */}
          <div
            className={`w-48 h-48 cursor-pointer rounded-full overflow-hidden border-2 ${
              isListening ? "border-red-500 animate-pulse" : "border-gray-800 hover:border-gray-700"
            } transition-all duration-300 flex items-center justify-center`}
            onClick={isListening ? stopListening : startListening}
          >
            <ParticleCloud
              isListening={isListening}
              theme={{
                primary: status === "success" ? "#10b981" : status === "error" ? "#ef4444" : "#f43f5e",
                secondary: "#ffffff",
              }}
            />
          </div>

          {/* Instrução */}
          <div className="text-gray-400 text-xs mt-6 text-center">
            {status === "idle" ? "Toque no círculo para ativar o reconhecimento de voz" : ""}
          </div>

          {/* Transcrição */}
          {showTranscript && (
            <div className="w-full px-4 py-3 bg-white bg-opacity-5 rounded-lg backdrop-blur-sm border border-white border-opacity-10 mt-6">
              <p className="text-xs text-white text-center opacity-80">{transcript || "Aguardando fala..."}</p>
            </div>
          )}

          {/* DESTAQUE: Login manual */}
          <div className="w-full mt-8 pt-6 border-t border-gray-800">
            <div className="bg-red-900 bg-opacity-20 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center mb-2">
                <KeyRound className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm font-medium text-red-300">Login Manual (Recomendado)</p>
              </div>

              <p className="text-xs text-gray-400 mb-4 text-center">Digite "acesso logistica" para entrar no sistema</p>

              <div className="flex">
                <input
                  type="password"
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  placeholder="Digite a senha"
                  className="flex-1 bg-black bg-opacity-50 border border-gray-800 rounded-l-md px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  onKeyDown={(e) => e.key === "Enter" && handleManualLogin()}
                />
                <button
                  onClick={handleManualLogin}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-r-md text-sm transition-colors"
                >
                  Entrar
                </button>
              </div>
            </div>

            {microphoneError && (
              <div className="flex items-center mt-3 text-xs text-amber-400">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>Problema com o microfone. Use o login manual.</span>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-8 text-gray-600 text-xs">
          <span>Sistema de Segurança RBS v2.0</span>
        </div>
      </div>
    </div>
  )
}
