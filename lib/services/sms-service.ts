// Serviço para integração com OneFunnel (SMS)
import { createClient } from "@/lib/supabase/server"

interface SMSMessage {
  phone: string
  message: string
  trackingCode?: string
  status?: string
}

export async function sendSMS(data: SMSMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Buscar as configurações da OneFunnel do banco de dados
    const supabase = createClient()
    const { data: settings, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "onefunnel_settings")
      .single()

    if (error || !settings) {
      console.error("Erro ao buscar configurações da OneFunnel:", error)
      return { success: false, error: "Configurações da OneFunnel não encontradas" }
    }

    const { apiKey, sender, enabled } = settings.value

    if (!enabled) {
      console.log("Integração com OneFunnel está desativada")
      return { success: false, error: "Integração com OneFunnel está desativada" }
    }

    if (!apiKey || !sender) {
      console.error("Credenciais da OneFunnel não configuradas")
      return { success: false, error: "Credenciais da OneFunnel não configuradas" }
    }

    // Formatar o número de telefone (remover caracteres não numéricos)
    const formattedPhone = data.phone.replace(/\D/g, "")

    // Verificar se o número tem o formato correto
    if (formattedPhone.length < 10) {
      return { success: false, error: "Número de telefone inválido" }
    }

    // Adicionar o código do país se não estiver presente
    const phoneWithCountryCode = formattedPhone.startsWith("55") ? formattedPhone : `55${formattedPhone}`

    // Enviar SMS via OneFunnel
    const response = await fetch("https://api.onefunnel.com.br/v1/send-sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        sender: sender,
        to: phoneWithCountryCode,
        message: data.message.substring(0, 160), // Limitar a 160 caracteres (padrão SMS)
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Erro ao enviar SMS via OneFunnel:", result)
      return { success: false, error: result.message || "Erro ao enviar SMS via OneFunnel" }
    }

    // Registrar o envio no banco de dados
    await supabase.from("message_history").insert({
      tracking_code: data.trackingCode || null,
      recipient: phoneWithCountryCode,
      message: data.message,
      channel: "sms",
      status: "sent",
      external_id: result.id || null,
      created_at: new Date().toISOString(),
    })

    console.log("SMS enviado com sucesso:", result)
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error("Erro ao enviar SMS:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao enviar SMS",
    }
  }
}

// Função para gerar mensagem de rastreamento para SMS
export function generateTrackingSMSMessage(trackingCode: string, status: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://v0-logistica-site-design.vercel.app"
  const trackingUrl = `${siteUrl}/rastreio?codigo=${trackingCode}`

  // Mensagem curta para caber no limite de SMS
  return `Remessa ${trackingCode} atualizada: ${status}. Acompanhe: ${trackingUrl}`
}
