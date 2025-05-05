require("dotenv").config()
const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const path = require("path")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const { initializeSessionManager } = require("./whatsapp/session-manager")
const apiRoutes = require("./routes/api")
const adminRoutes = require("./routes/admin")
const authMiddleware = require("./middleware/auth")
const logger = require("./utils/logger")
const { setupBullBoard } = require("./utils/bull-board")

// Inicializar Express
const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

// Configurações de segurança
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "wss:", "ws:"],
      },
    },
  }),
)
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Configurar EJS como view engine
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")))

// Limitador de taxa para API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições, tente novamente mais tarde." },
})

// Inicializar gerenciador de sessões do WhatsApp
const sessionManager = initializeSessionManager(io)

// Configurar Bull Board (UI para monitoramento de filas)
setupBullBoard(app)

// Rotas
app.use("/api", apiLimiter, authMiddleware.apiKeyAuth, apiRoutes)
app.use("/admin", authMiddleware.adminAuth, adminRoutes)

// Rota raiz
app.get("/", (req, res) => {
  res.redirect("/admin")
})

// Tratamento de erros
app.use((err, req, res, next) => {
  logger.error(`Erro: ${err.message}`)
  res.status(500).render("error", {
    error: process.env.NODE_ENV === "development" ? err : { message: "Erro interno do servidor" },
  })
})

// Iniciar servidor
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`)
})

// Manipular conexões de socket
io.on("connection", (socket) => {
  logger.info(`Nova conexão de socket: ${socket.id}`)

  // Enviar status atual das sessões
  socket.emit("sessionsStatus", sessionManager.getSessions())

  // Manipular desconexão
  socket.on("disconnect", () => {
    logger.info(`Socket desconectado: ${socket.id}`)
  })
})

// Tratamento de encerramento gracioso
process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)

function shutdown() {
  logger.info("Encerrando servidor...")
  server.close(() => {
    logger.info("Servidor HTTP encerrado.")
    process.exit(0)
  })
}

module.exports = { app, server, io }
