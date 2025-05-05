// Serviço para integração com Z-API (WhatsApp)
import { createClient } from "@/lib/supabase/server"

interface SendWhatsAppMessageParams {
  phone: string
  message: string
  instanceId: string
  token: string
  clientToken?: string
  debug?: boolean
}

interface WhatsAppMessage {
  phone: string
  message: string
  trackingCode?: string
  status?: string
}

export async function sendWhatsAppMessage(
  data: WhatsAppMessage,
): Promise<{ success: boolean; messageId?: string; error?: string; details?: any }> {
  try {
    // Buscar as configurações da Z-API do banco de dados
    const supabase = createClient()
    const { data: settings, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "zapi_settings")
      .single()

    if (error || !settings) {
      console.error("Erro ao buscar configurações da Z-API:", error)
      return { success: false, error: "Configurações da Z-API não encontradas" }
    }

    const { instanceId, token, clientToken, enabled } = settings.value

    if (!enabled) {
      console.log("Integração com Z-API está desativada")
      return { success: false, error: "Integração com Z-API está desativada" }
    }

    if (!instanceId || !token) {
      console.error("Credenciais da Z-API não configuradas")
      return { success: false, error: "Credenciais da Z-API não configuradas" }
    }

    // Formatar o número de telefone (remover caracteres não numéricos)
    const formattedPhone = data.phone.replace(/\D/g, "")

    // Verificar se o número tem o formato correto
    if (formattedPhone.length < 10) {
      return { success: false, error: "Número de telefone inválido. Deve ter pelo menos 10 dígitos (DDD + número)" }
    }

    // Adicionar o código do país se não estiver presente
    const phoneWithCountryCode = formattedPhone.startsWith("55") ? formattedPhone : `55${formattedPhone}`

    console.log(`Enviando WhatsApp para ${phoneWithCountryCode} via Z-API (instância: ${instanceId})`)
    console.log(`Mensagem: ${data.message}`)
    console.log(`URL da API: https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`)

    try {
      // Preparar os headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      // Adicionar Client-Token apenas se estiver definido
      if (clientToken && clientToken.trim() !== "") {
        console.log("Adicionando Client-Token ao cabeçalho")
        headers["Client-Token"] = clientToken
      } else {
        console.log("Client-Token não fornecido, enviando sem este cabeçalho")
      }

      // Log dos headers para debug
      console.log("Headers:", JSON.stringify(headers))

      // Preparar o corpo da requisição
      const requestBody = {
        phone: phoneWithCountryCode,
        message: data.message,
      }

      console.log("Request body:", JSON.stringify(requestBody))

      // Enviar mensagem via Z-API
      const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      })

      const responseText = await response.text()
      console.log("Resposta da Z-API (texto):", responseText)

      let responseData
      try {
        // Tentar fazer parse do JSON
        responseData = JSON.parse(responseText)
        console.log("Resposta da Z-API (JSON):", responseData)
      } catch (e) {
        // Se não for JSON, usar o texto como está
        console.error("Resposta não é um JSON válido:", responseText)
        return {
          success: false,
          error: `Erro da Z-API: Resposta inválida`,
          details: { statusCode: response.status, responseText },
        }
      }

      if (!response.ok) {
        console.error("Erro da API Z-API:", responseData)
        return {
          success: false,
          error: `Erro da Z-API: ${responseData.message || responseData.error || response.statusText}`,
          details: responseData,
        }
      }

      // Registrar o envio no banco de dados
      await supabase.from("message_history").insert({
        tracking_code: data.trackingCode || null,
        recipient: phoneWithCountryCode,
        message: data.message,
        channel: "whatsapp",
        status: "sent",
        external_id: responseData.messageId || responseData.id || null,
        created_at: new Date().toISOString(),
      })

      console.log("Mensagem WhatsApp enviada com sucesso:", responseData)
      return {
        success: true,
        messageId: responseData.messageId || responseData.id || "unknown",
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem WhatsApp:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido ao enviar mensagem WhatsApp",
        details: { error },
      }
    }
  } catch (error) {
    console.error("Erro ao enviar mensagem WhatsApp:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao enviar mensagem WhatsApp",
      details: { error },
    }
  }
}

// Função para gerar mensagem de rastreamento
export function generateTrackingWhatsAppMessage(trackingCode: string, customerName: string, status: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://v0-logistica-site-design.vercel.app"
  const trackingUrl = `${siteUrl}/rastreio?codigo=${trackingCode}`

  return `*Atualização de Rastreamento*\n\nOlá ${customerName},\n\nSua remessa ${trackingCode} teve o status atualizado para: *${status}*.\n\nAcompanhe em tempo real: ${trackingUrl}\n\nObrigado por utilizar nossos serviços!`
}
