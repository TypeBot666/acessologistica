require("dotenv").config()
const express = require("express")
const cors = require("cors")
const { Client, LocalAuth } = require("whatsapp-web.js")
const qrcode = require("qrcode")
const fs = require("fs")
const path = require("path")

// Configuração do servidor
const app = express()
const PORT = process.env.WHATSAPP_SERVER_PORT || 3001
const API_KEY = process.env.WHATSAPP_API_KEY || "chave-secreta"

// Middleware
app.use(cors())
app.use(express.json())

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Não autorizado" })
  }

  const token = authHeader.split(" ")[1]

  if (token !== API_KEY) {
    return res.status(401).json({ success: false, error: "Token inválido" })
  }

  next()
}

// Diretório para armazenar dados de sessão
const SESSION_DIR = path.join(__dirname, "sessions")
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true })
}

// Armazenar sessões ativas
const sessions = new Map()

// Estatísticas de mensagens
const stats = {
  sent: 0,
  failed: 0,
  queued: 0,
}

// Rota para verificar status do servidor
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    status: "online",
    sessions: sessions.size,
    stats,
  })
})

// Rota para listar todas as sessões
app.get("/api/sessions", authMiddleware, (req, res) => {
  const sessionList = []

  sessions.forEach((session, id) => {
    sessionList.push({
      id,
      status: session.status,
      qrCode: session.qrCode,
      lastActivity: session.lastActivity,
    })
  })

  res.json({
    success: true,
    sessions: sessionList,
  })
})

// Rota para obter detalhes de uma sessão específica
app.get("/api/sessions/:sessionId", authMiddleware, (req, res) => {
  const { sessionId } = req.params

  if (!sessions.has(sessionId)) {
    return res.status(404).json({
      success: false,
      error: "Sessão não encontrada",
    })
  }

  const session = sessions.get(sessionId)

  res.json({
    success: true,
    session: {
      id: sessionId,
      status: session.status,
      qrCode: session.qrCode,
      lastActivity: session.lastActivity,
    },
  })
})

// Rota para criar uma nova sessão
app.post("/api/sessions", authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.body

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "ID da sessão é obrigatório",
      })
    }

    if (sessions.has(sessionId)) {
      return res.status(400).json({
        success: false,
        error: "Sessão já existe",
      })
    }

    // Criar nova sessão
    const sessionData = {
      status: "initializing",
      qrCode: null,
      client: null,
      lastActivity: new Date(),
    }

    sessions.set(sessionId, sessionData)

    // Configurar cliente WhatsApp
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: SESSION_DIR,
      }),
      puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    })

    // Evento de QR Code
    client.on("qr", async (qr) => {
      try {
        const qrDataURL = await qrcode.toDataURL(qr)
        sessionData.qrCode = qrDataURL
        sessionData.status = "qr_ready"
      } catch (error) {
        console.error(`Erro ao gerar QR code para sessão ${sessionId}:`, error)
      }
    })

    // Evento de autenticação
    client.on("authenticated", () => {
      sessionData.status = "authenticated"
      sessionData.qrCode = null
    })

    // Evento de pronto
    client.on("ready", () => {
      sessionData.status = "ready"
      sessionData.lastActivity = new Date()
    })

    // Evento de desconexão
    client.on("disconnected", (reason) => {
      sessionData.status = "disconnected"
      console.log(`Sessão ${sessionId} desconectada: ${reason}`)
    })

    // Inicializar cliente
    await client.initialize()
    sessionData.client = client

    res.json({
      success: true,
      session: {
        id: sessionId,
        status: sessionData.status,
        qrCode: sessionData.qrCode,
        lastActivity: sessionData.lastActivity,
      },
    })
  } catch (error) {
    console.error("Erro ao criar sessão:", error)
    res.status(500).json({
      success: false,
      error: "Erro ao criar sessão",
    })
  }
})

// Rota para excluir uma sessão
app.delete("/api/sessions/:sessionId", authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params

    if (!sessions.has(sessionId)) {
      return res.status(404).json({
        success: false,
        error: "Sessão não encontrada",
      })
    }

    const session = sessions.get(sessionId)

    // Destruir cliente WhatsApp
    if (session.client) {
      await session.client.destroy()
    }

    // Remover sessão
    sessions.delete(sessionId)

    res.json({
      success: true,
      message: `Sessão ${sessionId} excluída com sucesso`,
    })
  } catch (error) {
    console.error("Erro ao excluir sessão:", error)
    res.status(500).json({
      success: false,
      error: "Erro ao excluir sessão",
    })
  }
})

// Rota para enviar mensagem
app.post("/api/send-message", authMiddleware, async (req, res) => {
  try {
    const { sessionId, phone, message } = req.body

    // Validação básica
    if (!sessionId || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros inválidos. Forneça sessionId, phone e message.",
      })
    }

    // Verificar se a sessão existe
    if (!sessions.has(sessionId)) {
      return res.status(404).json({
        success: false,
        error: "Sessão não encontrada",
      })
    }

    const session = sessions.get(sessionId)

    // Verificar se a sessão está pronta
    if (session.status !== "ready") {
      return res.status(400).json({
        success: false,
        error: `Sessão não está pronta (status: ${session.status})`,
      })
    }

    // Formatar número de telefone
    let formattedPhone = phone.replace(/\D/g, "")
    if (!formattedPhone.startsWith("55")) {
      formattedPhone = "55" + formattedPhone
    }

    // Incrementar contador de mensagens na fila
    stats.queued++

    // Enviar mensagem
    const response = await session.client.sendMessage(`${formattedPhone}@c.us`, message)

    // Atualizar estatísticas
    stats.sent++
    stats.queued--
    session.lastActivity = new Date()

    res.json({
      success: true,
      messageId: response.id._serialized,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)

    // Atualizar estatísticas
    stats.failed++
    stats.queued--

    res.status(500).json({
      success: false,
      error: "Erro ao enviar mensagem",
    })
  }
})

// Rota para obter estatísticas da fila
app.get("/api/queue/stats", authMiddleware, (req, res) => {
  res.json({
    success: true,
    stats: {
      waiting: stats.queued,
      active: 0,
      completed: stats.sent,
      failed: stats.failed,
      delayed: 0,
    },
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor WhatsApp rodando na porta ${PORT}`)
})
