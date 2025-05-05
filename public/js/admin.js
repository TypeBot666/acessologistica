document.addEventListener("DOMContentLoaded", () => {
  // Inicializar Socket.io
  const socket = io()

  // Elementos do DOM
  const sessionsTable = document.getElementById("sessions-table")
  const activeSessionsCount = document.getElementById("active-sessions")
  const sentMessagesCount = document.getElementById("sent-messages")
  const queuedMessagesCount = document.getElementById("queued-messages")
  const successRateElement = document.getElementById("success-rate")

  // Modal QR Code
  const qrCodeModal = new bootstrap.Modal(document.getElementById("qrCodeModal"))
  const qrCodeImage = document.getElementById("qrcode-image")

  // Atualizar tabela de sessões
  function updateSessionsTable(sessions) {
    if (!sessionsTable) return

    // Limpar tabela
    sessionsTable.innerHTML = ""

    // Contar sessões ativas
    let activeSessions = 0

    if (sessions.length === 0) {
      const row = document.createElement("tr")
      row.innerHTML = '<td colspan="4" class="text-center">Nenhuma sessão encontrada</td>'
      sessionsTable.appendChild(row)
    } else {
      sessions.forEach((session) => {
        if (session.status === "ready") {
          activeSessions++
        }

        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${session.id}</td>
          <td>
            <span class="badge ${getStatusBadgeClass(session.status)}">
              ${getStatusText(session.status)}
            </span>
          </td>
          <td>${new Date(session.lastActivity).toLocaleString()}</td>
          <td>
            <div class="btn-group" role="group">
              ${
                session.qrCode
                  ? `<button class="btn btn-sm btn-primary show-qr-code" data-session-id="${session.id}">
                  <i class="bi bi-qr-code"></i> QR Code
                </button>`
                  : ""
              }
              
              ${
                session.status === "disconnected" || session.status === "error"
                  ? `<button class="btn btn-sm btn-warning reconnect-session ms-2" data-session-id="${session.id}">
                  <i class="bi bi-arrow-repeat"></i> Reconectar
                </button>`
                  : ""
              }
              
              <button class="btn btn-sm btn-danger close-session ms-2" data-session-id="${session.id}">
                <i class="bi bi-x-circle"></i> Encerrar
              </button>
            </div>
          </td>
        `
        sessionsTable.appendChild(row)

        // Adicionar event listeners para os botões
        const qrButtons = row.querySelectorAll(".show-qr-code")
        qrButtons.forEach((button) => {
          button.addEventListener("click", function () {
            const sessionId = this.getAttribute("data-session-id")
            const sessionData = sessions.find((s) => s.id === sessionId)

            if (sessionData && sessionData.qrCode) {
              qrCodeImage.src = sessionData.qrCode
              document.getElementById("qrCodeModalLabel").textContent = `Escaneie o QR Code - Sessão: ${sessionId}`
              qrCodeModal.show()
            }
          })
        })

        const reconnectButtons = row.querySelectorAll(".reconnect-session")
        reconnectButtons.forEach((button) => {
          button.addEventListener("click", function () {
            const sessionId = this.getAttribute("data-session-id")
            reconnectSession(sessionId)
          })
        })

        const closeButtons = row.querySelectorAll(".close-session")
        closeButtons.forEach((button) => {
          button.addEventListener("click", function () {
            const sessionId = this.getAttribute("data-session-id")
            if (confirm(`Tem certeza que deseja encerrar a sessão ${sessionId}?`)) {
              closeSession(sessionId)
            }
          })
        })
      })
    }

    // Atualizar contadores
    if (activeSessionsCount) {
      activeSessionsCount.textContent = activeSessions
    }
  }

  // Obter classe de badge para status
  function getStatusBadgeClass(status) {
    switch (status) {
      case "ready":
        return "bg-success"
      case "qr_ready":
        return "bg-warning"
      case "initializing":
      case "authenticated":
        return "bg-info"
      case "disconnected":
      case "error":
        return "bg-danger"
      case "reconnecting":
        return "bg-secondary"
      default:
        return "bg-dark"
    }
  }

  // Obter texto para status
  function getStatusText(status) {
    switch (status) {
      case "ready":
        return "Online"
      case "qr_ready":
        return "QR Code Pronto"
      case "initializing":
        return "Inicializando"
      case "authenticated":
        return "Autenticado"
      case "disconnected":
        return "Desconectado"
      case "reconnecting":
        return "Reconectando"
      case "error":
        return "Erro"
      default:
        return status
    }
  }

  // Reconectar sessão
  function reconnectSession(sessionId) {
    fetch(`/api/sessions/${sessionId}/reconnect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": getApiKey(),
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showAlert("success", data.message)
        } else {
          showAlert("danger", data.error)
        }
      })
      .catch((error) => {
        console.error("Erro ao reconectar sessão:", error)
        showAlert("danger", "Erro ao reconectar sessão")
      })
  }

  // Encerrar sessão
  function closeSession(sessionId) {
    fetch(`/api/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": getApiKey(),
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showAlert("success", data.message)
        } else {
          showAlert("danger", data.error)
        }
      })
      .catch((error) => {
        console.error("Erro ao encerrar sessão:", error)
        showAlert("danger", "Erro ao encerrar sessão")
      })
  }

  // Obter API Key (em produção, isso seria armazenado de forma segura)
  function getApiKey() {
    return localStorage.getItem("apiKey") || ""
  }

  // Mostrar alerta
  function showAlert(type, message) {
    const alertDiv = document.createElement("div")
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `

    const mainContent = document.querySelector("main")
    if (mainContent) {
      mainContent.insertBefore(alertDiv, mainContent.firstChild)

      // Auto-fechar após 5 segundos
      setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv)
        bsAlert.close()
      }, 5000)
    }
  }

  // Atualizar estatísticas
  function updateStats(queueStats) {
    if (queuedMessagesCount) {
      queuedMessagesCount.textContent = queueStats.waiting + queueStats.delayed
    }

    if (successRateElement && queueStats.completed > 0) {
      const total = queueStats.completed + queueStats.failed
      const rate = (queueStats.completed / total) * 100
      successRateElement.textContent = `${rate.toFixed(1)}%`
    }
  }

  // Socket.io event handlers
  socket.on("connect", () => {
    console.log("Conectado ao servidor")
  })

  socket.on("sessionsStatus", (sessions) => {
    updateSessionsTable(sessions)
  })

  socket.on("queueStats", (stats) => {
    updateStats(stats)
  })

  socket.on("messagesSent", (count) => {
    if (sentMessagesCount) {
      sentMessagesCount.textContent = count
    }
  })

  // Inicializar dados
  fetch("/api/sessions", {
    headers: {
      "X-API-Key": getApiKey(),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        updateSessionsTable(data.sessions)
      }
    })
    .catch((error) => {
      console.error("Erro ao carregar sessões:", error)
    })

  fetch("/api/queue/stats", {
    headers: {
      "X-API-Key": getApiKey(),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        updateStats(data.stats)
      }
    })
    .catch((error) => {
      console.error("Erro ao carregar estatísticas da fila:", error)
    })
})
