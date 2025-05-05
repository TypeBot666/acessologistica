// Este é um arquivo de substituição para manter compatibilidade
// após a remoção da funcionalidade de WhatsApp

/**
 * Função de substituição para manter compatibilidade com código existente
 * Esta função não faz nada, pois a funcionalidade de WhatsApp foi removida
 */
export async function sendWhatsAppMessage(params: any): Promise<{ success: boolean; error?: string }> {
  console.log("WhatsApp foi desativado. Mensagem não enviada:", params)
  return {
    success: false,
    error: "Funcionalidade de WhatsApp foi desativada",
  }
}

/**
 * Função de substituição para manter compatibilidade com código existente
 */
export function generateTrackingWhatsAppMessage(trackingCode: string, recipientName: string, status: string): string {
  return `Olá ${recipientName}, sua encomenda ${trackingCode} está com status: ${status}. Acompanhe pelo nosso site.`
}

/**
 * Função de substituição para verificar se o WhatsApp está configurado
 */
export function isWhatsAppConfigured(): boolean {
  return false
}

/**
 * Função de substituição para verificar o status da conexão do WhatsApp
 */
export async function getWhatsAppConnectionStatus(): Promise<string> {
  return "disabled"
}
