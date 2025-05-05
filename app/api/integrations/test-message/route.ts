import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/services/whatsapp-service"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { phone, message, debug = false } = body

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, message: "Número de telefone e mensagem são obrigatórios" },
        { status: 400 },
      )
    }

    // Buscar configurações da Z-API
    const { data: zapiConfig, error: configError } = await supabase
      .from("automation_settings")
      .select("*")
      .eq("provider", "zapi")
      .single()

    if (configError || !zapiConfig) {
      console.error("Erro ao buscar configurações da Z-API:", configError)
      return NextResponse.json({ success: false, message: "Configurações da Z-API não encontradas" }, { status: 404 })
    }

    if (!zapiConfig.enabled) {
      return NextResponse.json({ success: false, message: "Integração com Z-API está desativada" }, { status: 400 })
    }

    // Formatar número de telefone (adicionar código do país se necessário)
    let formattedPhone = phone.replace(/\D/g, "")
    if (!formattedPhone.startsWith("55")) {
      formattedPhone = `55${formattedPhone}`
    }

    console.log(`Enviando mensagem de teste para ${formattedPhone}`)

    // Enviar mensagem
    const result = await sendWhatsAppMessage({
      phone: formattedPhone,
      message,
      instanceId: zapiConfig.instance_id,
      token: zapiConfig.token,
      clientToken: zapiConfig.client_token,
      debug: debug,
    })

    // Registrar tentativa no histórico de mensagens
    try {
      await supabase.from("message_history").insert({
        recipient: formattedPhone,
        message_type: "whatsapp",
        message_content: message,
        status: result.success ? "sent" : "failed",
        error_message: result.success ? null : result.message,
      })
    } catch (historyError) {
      console.error("Erro ao registrar histórico de mensagem:", historyError)
    }

    // Se debug estiver ativado, incluir informações detalhadas na resposta
    if (debug) {
      return NextResponse.json(
        {
          success: result.success,
          message: result.message,
          debug: {
            request: result.debug?.request,
            response: result.debug?.response,
          },
        },
        { status: result.success ? 200 : 400 },
      )
    }

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
      },
      { status: result.success ? 200 : 400 },
    )
  } catch (error) {
    console.error("Erro ao processar requisição de teste de mensagem:", error)
    return NextResponse.json(
      { success: false, message: `Erro interno: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
