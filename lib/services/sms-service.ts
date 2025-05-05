// Este é um arquivo de substituição para manter compatibilidade
// após a remoção da funcionalidade de SMS

/**
 * Função de substituição para manter compatibilidade com código existente
 * Esta função não faz nada, pois a funcionalidade de SMS foi removida
 */
export async function sendSMS(params: any): Promise<{ success: boolean; error?: string }> {
  console.log("SMS foi desativado. Mensagem não enviada:", params)
  return {
    success: false,
    error: "Funcionalidade de SMS foi desativada",
  }
}

/**
 * Função de substituição para manter compatibilidade com código existente
 */
export function generateTrackingSMSMessage(trackingCode: string, status: string): string {
  return `Sua encomenda ${trackingCode} está ${status}. Acompanhe pelo nosso site.`
}

/**
 * Função de substituição para verificar se o SMS está configurado
 */
export function isSMSConfigured(): boolean {
  return false
}
