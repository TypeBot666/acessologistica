const { createBullBoard } = require("@bull-board/api")
const { BullAdapter } = require("@bull-board/api/bullAdapter")
const { ExpressAdapter } = require("@bull-board/express")
const { messageQueue } = require("../whatsapp/message-queue")
const logger = require("./logger")

function setupBullBoard(app) {
  try {
    const serverAdapter = new ExpressAdapter()
    serverAdapter.setBasePath("/admin/queues")

    createBullBoard({
      queues: [new BullAdapter(messageQueue)],
      serverAdapter,
    })

    app.use("/admin/queues", serverAdapter.getRouter())
    logger.info("Bull Board configurado com sucesso")
  } catch (error) {
    logger.error("Erro ao configurar Bull Board:", error)
  }
}

module.exports = {
  setupBullBoard,
}
