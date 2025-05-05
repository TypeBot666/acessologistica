const logger = require("../utils/logger")

// Autenticação via API Key para rotas da API
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"]

  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`Tentativa de acesso à API com chave inválida: ${apiKey}`)
    return res.status(401).json({
      success: false,
      error: "API Key inválida ou não fornecida.",
    })
  }

  next()
}

// Autenticação básica para o painel admin
function adminAuth(req, res, next) {
  // Pular autenticação em ambiente de desenvolvimento
  if (process.env.NODE_ENV === "development") {
    return next()
  }

  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res
      .status(401)
      .set("WWW-Authenticate", 'Basic realm="Admin Panel"')
      .render("error", { error: { message: "Autenticação necessária" } })
  }

  const base64Credentials = authHeader.split(" ")[1]
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8")
  const [username, password] = credentials.split(":")

  if (username !== "admin" || password !== process.env.ADMIN_PASSWORD) {
    logger.warn(`Tentativa de login admin com credenciais inválidas: ${username}`)
    return res
      .status(401)
      .set("WWW-Authenticate", 'Basic realm="Admin Panel"')
      .render("error", { error: { message: "Credenciais inválidas" } })
  }

  next()
}

module.exports = {
  apiKeyAuth,
  adminAuth,
}
