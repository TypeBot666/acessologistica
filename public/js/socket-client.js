// Cliente Socket.io para comunicação em tempo real com o servidor
;(() => {
  // Verificar se o Socket.io está disponível
  if (typeof io === "undefined") {
    console.error("Socket.io não está carregado")
    return
  }

  // Conectar ao servidor Socket.io
  const socket = io()

  // Eventos de conexão
  socket.on("connect", () => {
    console.log("Conectado ao servidor Socket.io")
    updateConnectionStatus(true)
  })

  socket.on("disconnect", () => {
    console.log("Desconectado do servidor Socket.io")
    updateConnectionStatus(false)
  })

  // Eventos específicos do WhatsApp
  socket.on("whatsapp:qr", (data) => {
    updateQRCode(data.sessionId, data.qr)
  })

  socket.on("whatsapp:ready", (data) => {
    updateSessionStatus(data.sessionId, "connected", data.info)
  })

  socket.on("whatsapp:disconnected", (data) => {
    updateSessionStatus(data.sessionId, "disconnected")
  })

  socket.on("whatsapp:message:sent", (data) => {
    updateMessageStatus(data.messageId, "sent")
  })

  socket.on("whatsapp:message:failed", (data) => {
    updateMessageStatus(data.messageId, "failed", data.error)
  })

  socket.on("whatsapp:stats:update", (data) => {
    updateStats(data)
  })

  // Funções de atualização da UI
  function updateConnectionStatus(connected) {
    const statusElement = document.getElementById("connection-status")
    if (!statusElement) return

    if (connected) {
      statusElement.textContent = "Conectado"
      statusElement.classList.remove("bg-red-500")
      statusElement.classList.add("bg-green-500")
    } else {
      statusElement.textContent = "Desconectado"
      statusElement.classList.remove("bg-green-500")
      statusElement.classList.add("bg-red-500")
    }
  }

  function updateQRCode(sessionId, qrCode) {
    const qrContainer = document.getElementById(`qr-${sessionId}`)
    if (!qrContainer) return

    // Limpar container
    qrContainer.innerHTML = ""

    // Criar novo QR code
    const qrImage = document.createElement("img")
    qrImage.src = qrCode
    qrImage.alt = "QR Code para escanear"
    qrImage.className = "mx-auto"
    qrContainer.appendChild(qrImage)

    // Atualizar status
    const statusElement = document.getElementById(`status-${sessionId}`)
    if (statusElement) {
      statusElement.textContent = "Aguardando escaneamento do QR Code"
      statusElement.className = "px-2 py-1 rounded text-xs bg-yellow-500 text-white"
    }
  }

  function updateSessionStatus(sessionId, status, info) {
    const statusElement = document.getElementById(`status-${sessionId}`)
    if (!statusElement) return

    const qrContainer = document.getElementById(`qr-${sessionId}`)

    if (status === "connected") {
      statusElement.textContent = "Conectado"
      statusElement.className = "px-2 py-1 rounded text-xs bg-green-500 text-white"

      if (qrContainer) {
        qrContainer.innerHTML = ""

        if (info && info.profilePicture) {
          const profileImg = document.createElement("img")
          profileImg.src = info.profilePicture
          profileImg.alt = "Foto de perfil"
          profileImg.className = "w-16 h-16 rounded-full mx-auto"
          qrContainer.appendChild(profileImg)
        }

        if (info && info.name) {
          const nameElement = document.createElement("p")
          nameElement.textContent = info.name
          nameElement.className = "text-center mt-2 font-medium"
          qrContainer.appendChild(nameElement)
        }

        if (info && info.phone) {
          const phoneElement = document.createElement("p")
          phoneElement.textContent = info.phone
          phoneElement.className = "text-center text-sm text-gray-500"
          qrContainer.appendChild(phoneElement)
        }
      }
    } else if (status === "disconnected") {
      statusElement.textContent = "Desconectado"
      statusElement.className = "px-2 py-1 rounded text-xs bg-red-500 text-white"

      if (qrContainer) {
        qrContainer.innerHTML = '<p class="text-center text-gray-500">Sessão desconectada</p>'
      }
    }
  }

  function updateMessageStatus(messageId, status, error) {
    const statusElement = document.getElementById(`msg-${messageId}`)
    if (!statusElement) return

    if (status === "sent") {
      statusElement.textContent = "Enviado"
      statusElement.className = "px-2 py-1 rounded text-xs bg-green-500 text-white"
    } else if (status === "failed") {
      statusElement.textContent = "Falha"
      statusElement.className = "px-2 py-1 rounded text-xs bg-red-500 text-white"

      if (error) {
        const errorElement = document.getElementById(`error-${messageId}`)
        if (errorElement) {
          errorElement.textContent = error
          errorElement.classList.remove("hidden")
        }
      }
    }
  }

  function updateStats(data) {
    // Atualizar estatísticas na interface
    const totalSentElement = document.getElementById("total-sent")
    if (totalSentElement) {
      totalSentElement.textContent = data.totalSent || 0
    }

    const totalFailedElement = document.getElementById("total-failed")
    if (totalFailedElement) {
      totalFailedElement.textContent = data.totalFailed || 0
    }

    const activeSessionsElement = document.getElementById("active-sessions")
    if (activeSessionsElement) {
      activeSessionsElement.textContent = data.activeSessions || 0
    }

    const queuedMessagesElement = document.getElementById("queued-messages")
    if (queuedMessagesElement) {
      queuedMessagesElement.textContent = data.queuedMessages || 0
    }

    // Atualizar gráficos se existirem
    if (window.updateCharts && typeof window.updateCharts === "function") {
      window.updateCharts(data)
    }
  }

  // Expor funções para uso global
  window.whatsappSocket = {
    createSession: (name) => {
      socket.emit("whatsapp:create-session", { name })
    },

    deleteSession: (sessionId) => {
      if (confirm("Tem certeza que deseja excluir esta sessão?")) {
        socket.emit("whatsapp:delete-session", { sessionId })
      }
    },

    reconnectSession: (sessionId) => {
      socket.emit("whatsapp:reconnect-session", { sessionId })
    },

    logoutSession: (sessionId) => {
      if (confirm("Tem certeza que deseja desconectar esta sessão?")) {
        socket.emit("whatsapp:logout-session", { sessionId })
      }
    },

    sendTestMessage: (sessionId, phone, message) => {
      socket.emit("whatsapp:send-test", {
        sessionId,
        phone,
        message,
      })
    },
  }
})()
