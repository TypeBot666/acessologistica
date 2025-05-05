import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendStatusUpdateEmail } from "@/lib/email/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Recebendo requisição de atualização de status:", body)

    const { trackingCode, newStatus } = body

    if (!trackingCode || !newStatus) {
      console.error("Dados inválidos:", { trackingCode, newStatus })
      return NextResponse.json({ error: "Código de rastreio e novo status são obrigatórios" }, { status: 400 })
    }

    const supabase = createClient()

    // Buscar o pedido atual
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("*, status_history(*)")
      .eq("tracking_code", trackingCode)
      .single()

    if (shipmentError || !shipment) {
      console.error("Erro ao buscar pedido:", shipmentError)
      return NextResponse.json({ error: "Pedido não encontrado ou erro ao buscar pedido" }, { status: 404 })
    }

    console.log("Pedido encontrado:", shipment)

    // Verificar se o status é diferente do atual
    if (shipment.status === newStatus) {
      console.log("Status já está atualizado:", newStatus)
      return NextResponse.json({ message: "O status já está atualizado", emailSent: false })
    }

    // Adicionar o status atual ao histórico
    const { error: historyError } = await supabase.from("status_history").insert({
      shipment_id: shipment.id,
      status: newStatus,
      timestamp: new Date().toISOString(),
    })

    if (historyError) {
      console.error("Erro ao adicionar histórico:", historyError)
      // Continuar mesmo com erro no histórico
    }

    // Atualizar o status do pedido
    const { error: updateError } = await supabase
      .from("shipments")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("tracking_code", trackingCode)

    if (updateError) {
      console.error("Erro ao atualizar status:", updateError)
      return NextResponse.json({ error: `Erro ao atualizar status do pedido: ${updateError.message}` }, { status: 500 })
    }

    console.log("Status atualizado com sucesso para:", newStatus)

    // Buscar o histórico de status atualizado
    const { data: statusHistory, error: historyFetchError } = await supabase
      .from("status_history")
      .select("*")
      .eq("shipment_id", shipment.id)
      .order("timestamp", { ascending: true })

    if (historyFetchError) {
      console.error("Erro ao buscar histórico de status:", historyFetchError)
      // Continuar mesmo com erro ao buscar histórico
    }

    // Enviar email de atualização se tiver email cadastrado
    let emailSent = false
    if (shipment.customer_email) {
      try {
        await sendStatusUpdateEmail({
          trackingCode,
          customerEmail: shipment.customer_email,
          customerName: shipment.recipient_name,
          status: newStatus,
          productType: shipment.product_type || "Produto",
          statusHistory: statusHistory || [],
        })
        emailSent = true
        console.log("Email de atualização enviado com sucesso")
      } catch (emailError) {
        console.error("Erro ao enviar email:", emailError)
        // Continuar mesmo com erro no email
      }
    }

    return NextResponse.json({
      message: "Status atualizado com sucesso",
      emailSent,
    })
  } catch (error) {
    console.error("Erro ao processar requisição de atualização de status:", error)
    return NextResponse.json(
      {
        error: `Erro interno ao processar requisição: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      },
      { status: 500 },
    )
  }
}
