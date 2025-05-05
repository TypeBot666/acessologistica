import { Chart } from "@/components/ui/chart"
document.addEventListener("DOMContentLoaded", () => {
  // Conectar ao socket.io
  const socket = io()

  // Elementos DOM
  const refreshStatsBtn = document.getElementById("refresh-stats")
  const testMessageForm = document.getElementById("test-message-form")
  const testSessionIdSelect = document.getElementById("test-session-id")
  const testResult = document.getElementById("test-result")
  const scheduleMessageCheckbox = document.getElementById("schedule-message")
  const scheduleTimeContainer = document.getElementById("schedule-time-container")

  // Gráfico de status da fila
  let queueChart = null

  // Inicializar gráfico
  initQueueChart()

  // Atualizar status das sessões
  socket.on("sessionsStatus", (sessions) => {
    updateSessionsDropdown(sessions)
  })

  // Solicitar status inicial das sessões
  socket.emit("requestSessionStatus")

  // Atualizar estatísticas
  if (refreshStatsBtn) {
    refreshStatsBtn.addEventListener("click", () => {
      fetchQueueStats()
    })
  }

  // Alternar exibição do campo de agendamento
  if (scheduleMessageCheckbox) {
    scheduleMessageCheckbox.addEventListener("change", function () {
      scheduleTimeContainer.style.display = this.checked ? "block" : "none"
    })
  }

  // Enviar mensagem de teste
  if (testMessageForm) {
    testMessageForm.addEventListener("submit", (event) => {
      event.preventDefault()

      const sessionId = testSessionIdSelect.value
      const phone = document.getElementById("test-phone").value
      const message = document.getElementById("test-message").value
      const scheduleMessage = document.getElementById("schedule-message").checked
      const scheduleTime = document.getElementById("schedule-time").value

      const payload = {
        sessionId,
        phone,
        message,
      }

      if (scheduleMessage && scheduleTime) {
        payload.scheduledTime = new Date(scheduleTime).toISOString()
      }

      testResult.textContent = "Enviando mensagem..."

      fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then((response) => response.json())
        .then((data) => {
          testResult.textContent = JSON.stringify(data, null, 2)
          fetchQueueStats() // Atualizar estatísticas após envio
        })
        .catch((error) => {
          testResult.textContent = `Erro: ${error.message}`
        })
    })
  }

  // Buscar estatísticas da fila
  function fetchQueueStats() {
    fetch("/api/queue/stats")
      .then((response) => response.json())
      .then((data) => {
        updateQueueStats(data.stats)
      })
      .catch((error) => {
        console.error("Erro ao buscar estatísticas:", error)
      })
  }

  // Atualizar estatísticas da fila na UI
  function updateQueueStats(stats) {
    // Atualizar contadores
    document.getElementById("waiting-count").textContent = stats.waiting
    document.getElementById("active-count").textContent = stats.active
    document.getElementById("completed-count").textContent = stats.completed
    document.getElementById("failed-count").textContent = stats.failed
    document.getElementById("delayed-count").textContent = stats.delayed
    document.getElementById("total-count").textContent = stats.total

    // Atualizar gráfico
    updateQueueChart(stats)
  }

  // Inicializar gráfico de fila
  function initQueueChart() {
    const ctx = document.getElementById("queue-chart")
    if (!ctx) return

    queueChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Aguardando", "Em Processamento", "Concluídas", "Falhas", "Agendadas"],
        datasets: [
          {
            data: [0, 0, 0, 0, 0],
            backgroundColor: [
              "#ffc107", // warning - waiting
              "#17a2b8", // info - active
              "#28a745", // success - completed
              "#dc3545", // danger - failed
              "#6c757d", // secondary - delayed
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || ""
                const value = context.raw || 0
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0
                return `${label}: ${value} (${percentage}%)`
              },
            },
          },
        },
      },
    })
  }

  // Atualizar gráfico com novos dados
  function updateQueueChart(stats) {
    if (!queueChart) return

    queueChart.data.datasets[0].data = [stats.waiting, stats.active, stats.completed, stats.failed, stats.delayed]

    queueChart.update()
  }

  // Atualizar dropdown de sessões
  function updateSessionsDropdown(sessions) {
    if (!testSessionIdSelect) return

    // Manter a seleção atual
    const currentValue = testSessionIdSelect.value

    // Limpar opções existentes
    testSessionIdSelect.innerHTML = '<option value="">Selecione uma sessão</option>'

    // Adicionar apenas sessões prontas
    const readySessions = sessions.filter((s) => s.status === "ready")

    readySessions.forEach((session) => {
      const option = document.createElement("option")
      option.value = session.id
      option.textContent = session.id
      testSessionIdSelect.appendChild(option)
    })

    // Restaurar seleção se ainda existir
    if (currentValue && readySessions.some((s) => s.id === currentValue)) {
      testSessionIdSelect.value = currentValue
    }
  }

  // Buscar estatísticas iniciais
  fetchQueueStats()

  // Atualizar estatísticas a cada 30 segundos
  setInterval(fetchQueueStats, 30000)
})
