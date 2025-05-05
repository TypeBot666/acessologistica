export async function checkDatabaseStatus() {
  try {
    const response = await fetch("/api/check-database-connection", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Erro ao verificar conexão: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Erro ao verificar status do banco de dados:", error)
    return {
      connected: false,
      tableExists: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}
