const express = require("express")
const router = express.Router()
const { getSessionManager } = require("../whatsapp/session-manager")
const { getQueueStats } = require("../whatsapp/message-queue")
const logger = require("../utils/logger")

// Página principal do admin
router.get("/", (req, res) => {
  res.render("admin", {
    title: "Painel Administrativo - WhatsApp Sender",
  })
})

// Página de sessões
router.get("/sessions", (req, res) => {
  const sessionManager = getSessionManager()
  res.render("sessions", {
    title: "Gerenciamento de Sessões - WhatsApp Sender",
    sessions: sessionManager.getSessions(),
  })
})

// Página de estatísticas
router.get("/stats", async (req, res) => {
  try {
    const queueStats = await getQueueStats()
    res.render("stats", {
      title: "Estatísticas - WhatsApp Sender",
      queueStats,
    })
  } catch (error) {
    logger.error("Erro ao renderizar página de estatísticas:", error)
    res.status(500).render("error", {
      error: { message: "Erro ao carregar estatísticas" },
    })
  }
})

// Criar nova sessão (formulário)
router.post("/sessions", async (req, res) => {
  try {
    const { sessionId } = req.body

    if (!sessionId) {
      return res.status(400).render("error", {
        error: { message: "ID da sessão é obrigatório" },
      })
    }

    const sessionManager = getSessionManager()

    // Verificar se a sessão já existe
    if (sessionManager.sessions.has(sessionId)) {
      return res.status(400).render("error", {
        error: { message: `Sessão ${sessionId} já existe` },
      })
    }

    // Criar nova sessão
    await sessionManager.createSession(sessionId)

    res.redirect("/admin/sessions")
  } catch (error) {
    logger.error("Erro ao criar sessão:", error)
    res.status(500).render("error", {
      error: { message: error.message || "Erro ao criar sessão" },
    })
  }
})

// Encerrar sessão
router.post("/sessions/:sessionId/close", async (req, res) => {
  try {
    const { sessionId } = req.params
    const sessionManager = getSessionManager()

    // Verificar se a sessão existe
    if (!sessionManager.sessions.has(sessionId)) {
      return res.status(404).render("error", {
        error: { message: `Sessão ${sessionId} não encontrada` },
      })
    }

    // Encerrar sessão
    await sessionManager.closeSession(sessionId)

    res.redirect("/admin/sessions")
  } catch (error) {
    logger.error("Erro ao encerrar sessão:", error)
    res.status(500).render("error", {
      error: { message: error.message || "Erro ao encerrar sessão" },
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
      return res.status(404).render("error", {
        error: { message: `Sessão ${sessionId} não encontrada` },
      })
    }

    // Reconectar sessão
    await sessionManager.reconnectSession(sessionId)

    res.redirect("/admin/sessions")
  } catch (error) {
    logger.error("Erro ao reconectar sessão:", error)
    res.status(500).render("error", {
      error: { message: error.message || "Erro ao reconectar sessão" },
    })
  }
})

module.exports = router
