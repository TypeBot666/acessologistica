const { Client, LocalAuth } = require("whatsapp-web.js")
const qrcode = require("qrcode")
const fs = require("fs")
const path = require("path")
const logger = require("../utils/logger")
const { addMessageToQueue } = require("./message-queue")

// Diretório para armazenar dados de sessão
const SESSION_DIR = path.join(__dirname, "../sessions")

// Garantir que o diretório de sessões exista
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true })
}

class SessionManager {
  constructor(io) {
    this.sessions = new Map()
    this.io = io
  }

  // Obter todas as sessões
  getSessions() {
    const sessionsArray = []
    this.sessions.forEach((session, id) => {
      sessionsArray.push({
        id,
        status: session.status,
        qrCode: session.qrCode,
        lastActivity: session.lastActivity,
      })
    })
    return sessionsArray
  }

  // Criar nova sessão
  async createSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      logger.warn(`Sessão ${sessionId} já existe`)
      return
    }

    logger.info(`Criando nova sessão: ${sessionId}`)

    const sessionData = {
      status: "initializing",
      qrCode: null,
      client: null,
      lastActivity: new Date(),
      messageCount: 0,
      lastMessageTime: null,
    }

    this.sessions.set(sessionId, sessionData)
    this._broadcastSessionUpdate()

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
      logger.info(`QR Code gerado para sessão ${sessionId}`)
      try {
        const qrDataURL = await qrcode.toDataURL(qr)
        sessionData.qrCode = qrDataURL
        sessionData.status = "qr_ready"
        this._broadcastSessionUpdate()
      } catch (error) {
        logger.error(`Erro ao gerar QR code para sessão ${sessionId}:`, error)
      }
    })

    // Evento de autenticação
    client.on("authenticated", () => {
      logger.info(`Sessão ${sessionId} autenticada`)
      sessionData.status = "authenticated"
      sessionData.qrCode = null
      this._broadcastSessionUpdate()
    })

    // Evento de pronto
    client.on("ready", () => {
      logger.info(`Sessão ${sessionId} pronta`)
      sessionData.status = "ready"
      sessionData.client = client
      this._broadcastSessionUpdate()
    })

    // Evento de desconexão
    client.on("disconnected", (reason) => {
      logger.warn(`Sessão ${sessionId} desconectada: ${reason}`)
      sessionData.status = "disconnected"
      this._broadcastSessionUpdate()

      // Tentar reconectar após 30 segundos
      setTimeout(() => {
        if (this.sessions.has(sessionId) && this.sessions.get(sessionId).status === "disconnected") {
          this.reconnectSession(sessionId)
        }
      }, 30000)
    })

    // Inicializar cliente
    try {
      await client.initialize()
      sessionData.client = client
    } catch (error) {
      logger.error(`Erro ao inicializar sessão ${sessionId}:`, error)
      sessionData.status = "error"
      this._broadcastSessionUpdate()
    }
  }

  // Reconectar sessão
  async reconnectSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      logger.warn(`Tentativa de reconexão para sessão inexistente: ${sessionId}`)
      return
    }

    const sessionData = this.sessions.get(sessionId)
    if (sessionData.status === "ready") {
      logger.info(`Sessão ${sessionId} já está conectada`)
      return
    }

    logger.info(`Tentando reconectar sessão: ${sessionId}`)
    sessionData.status = "reconnecting"
    this._broadcastSessionUpdate()

    try {
      if (sessionData.client) {
        await sessionData.client.destroy()
      }

      // Criar nova sessão com mesmo ID
      await this.createSession(sessionId)
    } catch (error) {
      logger.error(`Erro ao reconectar sessão ${sessionId}:`, error)
      sessionData.status = "error"
      this._broadcastSessionUpdate()
    }
  }

  // Enviar mensagem
  async sendMessage(sessionId, phone, message) {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Sessão ${sessionId} não encontrada`)
    }

    const sessionData = this.sessions.get(sessionId)
    if (sessionData.status !== "ready") {
      throw new Error(`Sessão ${sessionId} não está pronta (status: ${sessionData.status})`)
    }

    // Verificar limite de mensagens por minuto
    const now = new Date()
    const maxMessagesPerMinute = Number.parseInt(process.env.MAX_MESSAGES_PER_MINUTE || "20")

    if (sessionData.lastMessageTime) {
      const timeDiff = now - sessionData.lastMessageTime
      if (timeDiff < 60000) {
        // Menos de 1 minuto
        if (sessionData.messageCount >= maxMessagesPerMinute) {
          throw new Error(`Limite de ${maxMessagesPerMinute} mensagens por minuto excedido para sessão ${sessionId}`)
        }
      } else {
        // Resetar contador após 1 minuto
        sessionData.messageCount = 0
      }
    }

    // Formatar número de telefone
    const formattedPhone = this._formatPhoneNumber(phone)

    // Adicionar mensagem à fila
    await addMessageToQueue({
      sessionId,
      phone: formattedPhone,
      message,
      timestamp: now.toISOString(),
    })

    // Atualizar contadores
    sessionData.messageCount++
    sessionData.lastMessageTime = now
    sessionData.lastActivity = now

    return {
      status: "queued",
      sessionId,
      phone: formattedPhone,
      timestamp: now.toISOString(),
    }
  }

  // Processar mensagem da fila
  async processQueuedMessage(data) {
    const { sessionId, phone, message } = data

    if (!this.sessions.has(sessionId)) {
      throw new Error(`Sessão ${sessionId} não encontrada`)
    }

    const sessionData = this.sessions.get(sessionId)
    if (sessionData.status !== "ready") {
      throw new Error(`Sessão ${sessionId} não está pronta (status: ${sessionData.status})`)
    }

    try {
      // Enviar mensagem via WhatsApp Web
      const response = await sessionData.client.sendMessage(`${phone}@c.us`, message)

      logger.info(`Mensagem enviada com sucesso para ${phone} via sessão ${sessionId}`)

      return {
        status: "sent",
        messageId: response.id._serialized,
        sessionId,
        phone,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      logger.error(`Erro ao enviar mensagem para ${phone} via sessão ${sessionId}:`, error)
      throw error
    }
  }

  // Encerrar sessão
  async closeSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      logger.warn(`Tentativa de encerrar sessão inexistente: ${sessionId}`)
      return
    }

    const sessionData = this.sessions.get(sessionId)
    logger.info(`Encerrando sessão: ${sessionId}`)

    try {
      if (sessionData.client) {
        await sessionData.client.destroy()
      }
      this.sessions.delete(sessionId)
      this._broadcastSessionUpdate()

      logger.info(`Sessão ${sessionId} encerrada com sucesso`)
    } catch (error) {
      logger.error(`Erro ao encerrar sessão ${sessionId}:`, error)
    }
  }

  // Formatar número de telefone
  _formatPhoneNumber(phone) {
    // Remover caracteres não numéricos
    let cleaned = phone.replace(/\D/g, "")

    // Garantir que o número comece com o código do país
    if (!cleaned.startsWith("55")) {
      cleaned = "55" + cleaned
    }

    return cleaned
  }

  // Transmitir atualizações de sessão para todos os clientes conectados
  _broadcastSessionUpdate() {
    if (this.io) {
      this.io.emit("sessionsStatus", this.getSessions())
    }
  }
}

// Singleton para gerenciador de sessões
let sessionManagerInstance = null

function initializeSessionManager(io) {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager(io)

    // Carregar sessões salvas
    const sessionFiles = fs
      .readdirSync(SESSION_DIR, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)

    // Inicializar sessões existentes
    sessionFiles.forEach((sessionId) => {
      if (sessionId !== "Default") {
        sessionManagerInstance.createSession(sessionId)
      }
    })
  }
  return sessionManagerInstance
}

module.exports = {
  initializeSessionManager,
  getSessionManager: () => sessionManagerInstance,
}
