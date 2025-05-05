import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const now = new Date()

    // Buscar emails agendados que precisam ser enviados
    const { data: scheduledEmails, error: fetchError } = await supabase
      .from("scheduled_emails")
      .select("*")
      .eq("sent", false)
      .lte("scheduled_time", now.toISOString())

    if (fetchError) {
      console.error("Erro ao buscar emails agendados:", fetchError)
      return NextResponse.json({ error: "Erro ao buscar emails agendados" }, { status: 500 })
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      return NextResponse.json({ message: "Nenhum email agendado para enviar agora", sent: 0 })
    }

    // Enviar os emails
    let sentCount = 0
    const results = []

    for (const email of scheduledEmails) {
      try {
        // Buscar histórico de status para incluir no email
        const { data: statusHistory } = await supabase
          .from("status_history")
          .select("*")
          .eq("tracking_code", email.tracking_code)
          .order("created_at", { ascending: true })

        // Enviar o email
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/send-status-update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.email,
            trackingCode: email.tracking_code,
            recipientName: email.recipient_name,
            newStatus: email.new_status,
            statusHistory: statusHistory,
            updateDate: new Date().toLocaleString("pt-BR"),
          }),
        })

        if (response.ok) {
          // Marcar o email como enviado
          await supabase
            .from("scheduled_emails")
            .update({ sent: true, sent_at: new Date().toISOString() })
            .eq("id", email.id)

          sentCount++
          results.push({
            id: email.id,
            tracking_code: email.tracking_code,
            email: email.email,
            status: "enviado",
          })
        } else {
          results.push({
            id: email.id,
            tracking_code: email.tracking_code,
            email: email.email,
            status: "falha",
            error: "Falha ao enviar email",
          })
        }
      } catch (error) {
        console.error(`Erro ao processar email agendado ${email.id}:`, error)
        results.push({
          id: email.id,
          tracking_code: email.tracking_code,
          email: email.email,
          status: "falha",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return NextResponse.json({
      message: `${sentCount} emails agendados foram enviados`,
      sent: sentCount,
      total: scheduledEmails.length,
      results,
    })
  } catch (error) {
    console.error("Erro ao processar emails agendados:", error)
    return NextResponse.json(
      { error: `Erro ao processar emails agendados: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
