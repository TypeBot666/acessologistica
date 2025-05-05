import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { trackingCode, status, channel, phone } = await request.json()

    if (!trackingCode || !status || !channel || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados incompletos. Forneça trackingCode, status, channel e phone.",
        },
        { status: 400 },
      )
    }

    // Obter os dados da remessa
    const supabase = createClient()
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("*")
      .eq("tracking_code", trackingCode)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json(
        {
          success: false,
          message: `Remessa não encontrada: ${shipmentError?.message || ""}`,
        },
        { status: 404 },
      )
    }

    // Obter os templates de mensagens
    const { data: settingsData, error: settingsError } = await supabase
      .from("system_settings")
      .select("*")
      .eq("key", "message_templates")
      .single()

    if (settingsError) {
      console.error("Erro ao buscar templates:", settingsError)
      return NextResponse.json(
        {
          success: false,
          message: `Erro ao buscar templates: ${settingsError.message}`,
        },
        { status: 500 },
      )
    }

    const messageTemplates = settingsData?.value || {
      defaultWhatsapp: "Olá {nome}, sua encomenda {codigo} está com status: {status}. Acompanhe pelo nosso site.",
      defaultSms: "Sua encomenda {codigo} está {status}. Acompanhe: {link}",
      templates: [],
    }

    // Encontrar o template para o status atual
    const template = messageTemplates.templates.find((t: any) => t.status === status)

    let messageTemplate = ""
    if (channel === "whatsapp") {
      messageTemplate = template?.whatsapp || messageTemplates.defaultWhatsapp
    } else if (channel === "sms") {
      messageTemplate = template?.sms || messageTemplates.defaultSms
    }

    // Substituir as variáveis no template
    const message = messageTemplate
      .replace(/{nome}/g, shipment.recipient_name)
      .replace(/{codigo}/g, shipment.tracking_code)
      .replace(/{status}/g, status)
      .replace(/{data}/g, new Date().toLocaleDateString())
      .replace(/{origem}/g, shipment.origin_address)
      .replace(/{destino}/g, shipment.destination_address)
      .replace(/{link}/g, `${process.env.NEXT_PUBLIC_SITE_URL}/rastreio?codigo=${shipment.tracking_code}`)

    // Enviar a mensagem
    let result
    if (channel === "whatsapp") {
      // Obter configurações do WhatsApp
      const { data: zapiData, error: zapiError } = await supabase
        .from("system_settings")
        .select("*")
        .eq("key", "zapi_settings")
        .single()

      if (zapiError) {
        console.error("Erro ao buscar configurações do WhatsApp:", zapiError)
        return NextResponse.json(
          {
            success: false,
            message: `Erro ao buscar configurações do WhatsApp: ${zapiError.message}`,
          },
          { status: 500 },
        )
      }

      const zapiSettings = zapiData?.value || { enabled: false, instanceId: "", token: "" }

      if (!zapiSettings.enabled || !zapiSettings.instanceId || !zapiSettings.token) {
        return NextResponse.json(
          {
            success: false,
            message: "Integração com WhatsApp não configurada ou desativada.",
          },
          { status: 400 },
        )
      }

      // Enviar mensagem via WhatsApp
      const zapiResponse = await fetch(
        `https://api.z-api.io/instances/${zapiSettings.instanceId}/token/${zapiSettings.token}/send-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: phone.replace(/\D/g, ""),
            message,
          }),
        },
      )

      result = await zapiResponse.json()
    } else if (channel === "sms") {
      // Obter configurações do SMS
      const { data: onefunnelData, error: onefunnelError } = await supabase
        .from("system_settings")
        .select("*")
        .eq("key", "onefunnel_settings")
        .single()

      if (onefunnelError) {
        console.error("Erro ao buscar configurações do SMS:", onefunnelError)
        return NextResponse.json(
          {
            success: false,
            message: `Erro ao buscar configurações do SMS: ${onefunnelError.message}`,
          },
          { status: 500 },
        )
      }

      const onefunnelSettings = onefunnelData?.value || { enabled: false, apiKey: "", sender: "" }

      if (!onefunnelSettings.enabled || !onefunnelSettings.apiKey || !onefunnelSettings.sender) {
        return NextResponse.json(
          {
            success: false,
            message: "Integração com SMS não configurada ou desativada.",
          },
          { status: 400 },
        )
      }

      // Enviar mensagem via SMS
      const onefunnelResponse = await fetch("https://api.onefunnel.com.br/v1/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${onefunnelSettings.apiKey}`,
        },
        body: JSON.stringify({
          sender: onefunnelSettings.sender,
          to: phone.replace(/\D/g, ""),
          message,
        }),
      })

      result = await onefunnelResponse.json()
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Canal de notificação inválido. Use 'whatsapp' ou 'sms'.",
        },
        { status: 400 },
      )
    }

    // Registrar o envio da mensagem
    await supabase.from("message_history").insert({
      tracking_code: trackingCode,
      status,
      channel,
      phone,
      message,
      sent_at: new Date().toISOString(),
      success: true,
      response: JSON.stringify(result),
    })

    return NextResponse.json({
      success: true,
      message: `Mensagem enviada com sucesso via ${channel}`,
      result,
    })
  } catch (error) {
    console.error("Erro ao enviar notificação:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao enviar notificação: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
