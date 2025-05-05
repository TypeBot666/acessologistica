const Queue = require("bull")
const Redis = require("redis")
const { promisify } = require("util")
const logger = require("../utils/logger")
const { getSessionManager } = require("./session-manager")

// Configurações do Redis
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
}

// Criar cliente Redis
const redisClient = Redis.createClient(redisConfig)
redisClient.on("error", (error) => {
  logger.error(`Erro no cliente Redis: ${error}`)
})

// Promisificar métodos do Redis
const getAsync = promisify(redisClient.get).bind(redisClient)
const setAsync = promisify(redisClient.set).bind(redisClient)
const incrAsync = promisify(redisClient.incr).bind(redisClient)

// Criar fila de mensagens
const messageQueue = new Queue("whatsapp-messages", {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 100, // Manter os últimos 100 jobs completos
    removeOnFail: 100, // Manter os últimos 100 jobs com falha
  },
})

// Configurar processador de fila
messageQueue.process(async (job) => {
  const { sessionId, phone, message } = job.data
  logger.info(`Processando mensagem para ${phone} via sessão ${sessionId}`)

  try {
    // Obter gerenciador de sessões
    const sessionManager = getSessionManager()
    if (!sessionManager) {
      throw new Error("Gerenciador de sessões não inicializado")
    }

    // Adicionar atraso aleatório para evitar bloqueio
    const minDelay = Number.parseInt(process.env.MIN_DELAY_BETWEEN_MESSAGES || "2000")
    const maxDelay = Number.parseInt(process.env.MAX_DELAY_BETWEEN_MESSAGES || "5000")
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay

    await new Promise((resolve) => setTimeout(resolve, delay))

    // Processar mensagem
    const result = await sessionManager.processQueuedMessage(job.data)

    // Incrementar contador de mensagens enviadas
    await incrAsync("whatsapp:messages:sent")

    return result
  } catch (error) {
    logger.error(`Erro ao processar mensagem para ${phone}: ${error.message}`)

    // Incrementar contador de falhas
    await incrAsync("whatsapp:messages:failed")

    // Rejeitar para que o job seja marcado como falha
    throw error
  }
})

// Eventos da fila
messageQueue.on("completed", (job, result) => {
  logger.info(`Mensagem enviada com sucesso para ${job.data.phone}`)

  // Enviar webhook de notificação, se configurado
  if (process.env.WEBHOOK_URL) {
    try {
      fetch(process.env.WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "message_sent",
          data: {
            ...job.data,
            result,
          },
        }),
      }).catch((error) => {
        logger.error(`Erro ao enviar webhook: ${error.message}`)
      })
    } catch (error) {
      logger.error(`Erro ao enviar webhook: ${error.message}`)
    }
  }
})

messageQueue.on("failed", (job, error) => {
  logger.error(`Falha ao enviar mensagem para ${job.data.phone}: ${error.message}`)

  // Enviar webhook de notificação, se configurado
  if (process.env.WEBHOOK_URL) {
    try {
      fetch(process.env.WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "message_failed",
          data: {
            ...job.data,
            error: error.message,
          },
        }),
      }).catch((error) => {
        logger.error(`Erro ao enviar webhook: ${error.message}`)
      })
    } catch (error) {
      logger.error(`Erro ao enviar webhook: ${error.message}`)
    }
  }
})

// Adicionar mensagem à fila
async function addMessageToQueue(messageData) {
  try {
    const job = await messageQueue.add(messageData)
    logger.info(`Mensagem adicionada à fila: ${job.id}`)
    return job
  } catch (error) {
    logger.error(`Erro ao adicionar mensagem à fila: ${error.message}`)
    throw error
  }
}

// Obter estatísticas da fila
async function getQueueStats() {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      messageQueue.getWaitingCount(),
      messageQueue.getActiveCount(),
      messageQueue.getCompletedCount(),
      messageQueue.getFailedCount(),
      messageQueue.getDelayedCount(),
    ])

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    }
  } catch (error) {
    logger.error(`Erro ao obter estatísticas da fila: ${error.message}`)
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    }
  }
}

// Limpar fila
async function clearQueue() {
  try {
    await messageQueue.empty()
    logger.info("Fila de mensagens limpa com sucesso")
    return true
  } catch (error) {
    logger.error(`Erro ao limpar fila: ${error.message}`)
    return false
  }
}

module.exports = {
  addMessageToQueue,
  getQueueStats,
  clearQueue,
  messageQueue,
}
