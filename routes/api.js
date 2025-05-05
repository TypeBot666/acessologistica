const express = require("express")
const router = express.Router()
const { getSessionManager } = require("../whatsapp/session-manager")
const { addMessageToQueue, getQueueStats } = require("../whatsapp/message-queue")
const logger = require("../utils/logger")

// Enviar mensagem
router.post("/send-message", async (req, res) => {
  try {
    const { sessionId, phone, message, scheduledTime } = req.body

    if (!sessionId || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros inválidos. Forneça sessionId, phone e message.",
      })
    }

    const sessionManager = getSessionManager()

    // Verificar se a sessão existe
    if (!sessionManager.sessions.has(sessionId)) {
      return res.status(404).json({
        success: false,
        error: `Sessão ${sessionId} não encontrada.`,
      })
    }

    // Adicionar mensagem à fila (com agendamento opcional)
    const result = await addMessageToQueue({
      sessionId,
      phone,
      message,
      scheduledTime,
    })

    res.json({
      success: true,
      jobId: result.id,
      status: result.status,
      message: scheduledTime
        ? `Mensagem agendada para ${new Date(scheduledTime).toLocaleString()}`
        : "Mensagem adicionada à fila com sucesso.",
    })
  } catch (error) {
    logger.error("Erro ao enviar mensagem:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Erro interno do servidor.",
    })
  }
})

// Obter status das sessões
router.get("/sessions", (req, res) => {
  try {
    const sessionManager = getSessionManager()
    res.json({
      success: true,
      sessions: sessionManager.getSessions(),
    })
  } catch (error) {
    logger.error("Erro ao obter sessões:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Erro interno do servidor.",
    })
  }
})

// Criar nova sessão
router.post("/sessions", async (req, res) => {
  try {
    const { sessionId } = req.body

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "ID da sessão é obrigatório.",
      })
    }

    const sessionManager = getSessionManager()

    // Verificar se a sessão já existe
    if (sessionManager.sessions.has(sessionId)) {
      return res.status(400).json({
        success: false,
        error: `Sessão ${sessionId} já existe.`,
      })
    }

    // Criar nova sessão
    await sessionManager.createSession(sessionId)

    res.json({
      success: true,
      message: `Sessão ${sessionId} criada. Aguardando QR Code.`,
    })
  } catch (error) {
    logger.error("Erro ao criar sessão:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Erro interno do servidor.",
    })
  }
})

// Encerrar sessão
router.delete("/sessions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params
    const sessionManager = getSessionManager()

    // Verificar se a sessão existe
    if (!sessionManager.sessions.has(sessionId)) {
      return res.status(404).json({
        success: false,
        error: `Sessão ${sessionId} não encontrada.`,
      })
    }

    // Encerrar sessão
    await sessionManager.closeSession(sessionId)

    res.json({
      success: true,
      message: `Sessão ${sessionId} encerrada com sucesso.`,
    })
  } catch (error) {
    logger.error("Erro ao encerrar sessão:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Erro interno do servidor.",
    })
  }
})

// Reconectar sessão
router.post("/sessions/:sessionId/reconnect", async (req, res) => {
  try {
    const { sessionId } = req.params
    const sessionManager = getSessionManager()

    // Verificar se a sessão existe
    if (!sessionManager.sessions.has(sessionId)) {
      return res.status(404).json({
        success: false,
        error: `Sessão ${sessionId} não encontrada.`,
      })
    }

    // Reconectar sessão
    await sessionManager.reconnectSession(sessionId)

    res.json({
      success: true,
      message: `Tentativa de reconexão para sessão ${sessionId} iniciada.`,
    })
  } catch (error) {
    logger.error("Erro ao reconectar sessão:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Erro interno do servidor.",
    })
  }
})

// Obter estatísticas da fila
router.get("/queue/stats", async (req, res) => {
  try {
    const stats = await getQueueStats()
    res.json({
      success: true,
      stats,
    })
  } catch (error) {
    logger.error("Erro ao obter estatísticas da fila:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Erro interno do servidor.",
    })
  }
})

module.exports = router
