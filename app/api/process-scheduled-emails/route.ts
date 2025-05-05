import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // Máximo permitido (60 segundos)

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const now = new Date().toISOString()
    const limit = 20 // Processar até 20 emails por vez

    // Buscar emails agendados que devem ser enviados agora
    const {
      data: scheduledEmails,
      error: fetchError,
      count,
    } = await supabase
      .from("scheduled_emails")
      .select("*", { count: "exact" })
      .eq("sent", false)
      .lte("scheduled_time", now)
      .order("priority", { ascending: false })
      .order("scheduled_time", { ascending: true })
      .limit(limit)

    if (fetchError) {
      console.error("Erro ao buscar emails agendados:", fetchError)
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao buscar emails agendados",
          error: fetchError.message,
        },
        { status: 500 },
      )
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum email agendado para processar",
        processed: 0,
        remaining: 0,
      })
    }

    // Verificar se há mais emails para processar
    const hasMore = (count || 0) > scheduledEmails.length
    const remaining = (count || 0) - scheduledEmails.length

    // Enviar cada email agendado
    let processedCount = 0
    const results = []

    for (const scheduledEmail of scheduledEmails) {
      try {
        // Buscar informações da remessa
        const { data: shipment, error: shipmentError } = await supabase
          .from("shipments")
          .select("*")
          .eq("id", scheduledEmail.shipment_id)
          .single()

        if (shipmentError || !shipment) {
          console.error(`Remessa não encontrada (ID: ${scheduledEmail.shipment_id}):`, shipmentError)
          results.push({
            id: scheduledEmail.id,
            shipment_id: scheduledEmail.shipment_id,
            status: "error",
            message: "Remessa não encontrada",
          })
          continue
        }

        // Buscar histórico de status
        const { data: statusHistory } = await supabase
          .from("status_history")
          .select("*")
          .eq("shipment_id", scheduledEmail.shipment_id)
          .order("created_at", { ascending: true })

        // Chamar a API de envio de email
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/send-status-update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shipmentId: scheduledEmail.shipment_id,
            status: scheduledEmail.status,
            forceEmail: true,
            recipientEmail: shipment.recipient_email,
            recipientName: shipment.recipient_name,
            trackingCode: shipment.tracking_code,
            statusHistory: statusHistory || [],
          }),
        })

        const emailResult = await emailResponse.json()

        // Marcar email como enviado
        const { error: updateError } = await supabase
          .from("scheduled_emails")
          .update({
            sent: true,
            sent_at: new Date().toISOString(),
            result: JSON.stringify(emailResult),
          })
          .eq("id", scheduledEmail.id)

        if (updateError) {
          console.error(`Erro ao atualizar email agendado (ID: ${scheduledEmail.id}):`, updateError)
        }

        results.push({
          id: scheduledEmail.id,
          shipment_id: scheduledEmail.shipment_id,
          status: "success",
          message: "Email enviado com sucesso",
        })

        processedCount++
      } catch (error) {
        console.error(`Erro ao processar email agendado (ID: ${scheduledEmail.id}):`, error)
        results.push({
          id: scheduledEmail.id,
          shipment_id: scheduledEmail.shipment_id,
          status: "error",
          message: error instanceof Error ? error.message : "Erro desconhecido",
        })
      }
    }

    // Se houver mais emails para processar, chamar a API novamente
    if (hasMore) {
      // Chamar a API novamente após um pequeno delay para evitar sobrecarga
      setTimeout(async () => {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/process-scheduled-emails`, {
            method: "GET",
          })
        } catch (error) {
          console.error("Erro ao chamar API para continuar processamento:", error)
        }
      }, 1000)
    }

    return NextResponse.json({
      success: true,
      message: `Processados ${processedCount} de ${scheduledEmails.length} emails agendados`,
      processed: processedCount,
      remaining,
      hasMore,
      results,
    })
  } catch (error) {
    console.error("Erro ao processar emails agendados:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao processar emails agendados",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
