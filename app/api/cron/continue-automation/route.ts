import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // Máximo permitido (60 segundos)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const skipSteps = body.skipSteps || 0
    const timestamp = body.timestamp || Date.now()

    // Verificar se a solicitação é recente (menos de 5 minutos)
    const now = Date.now()
    if (now - timestamp > 5 * 60 * 1000) {
      return NextResponse.json({
        success: false,
        message: "Solicitação expirada",
      })
    }

    const supabase = createClient()

    // Buscar configurações de automação
    const { data: settings, error: settingsError } = await supabase
      .from("system_settings")
      .select("*")
      .eq("key", "automation_settings")
      .single()

    if (settingsError || !settings || !settings.value) {
      return NextResponse.json({
        success: false,
        message: "Configurações de automação não encontradas",
      })
    }

    const automationSettings = settings.value
    const steps = automationSettings.steps || []

    // Verificar se há etapas para processar
    if (skipSteps >= steps.length) {
      // Não há mais etapas, apenas processar emails
      const emailsProcessed = await processMoreScheduledEmails(supabase, 10)
      return NextResponse.json({
        success: true,
        message: "Processamento de emails concluído",
        emailsProcessed,
      })
    }

    // Processar as próximas etapas
    const maxStepsToProcess = 2 // Limitar para garantir que termine dentro de 60 segundos
    const stepsToProcess = steps.slice(skipSteps, skipSteps + maxStepsToProcess)
    const hasMoreSteps = skipSteps + maxStepsToProcess < steps.length

    const results = []
    const currentDate = new Date()
    const currentHour = currentDate.getHours()
    const currentMinute = currentDate.getMinutes()

    for (const step of stepsToProcess) {
      const daysAfterShipping = step.days || 0
      const newStatus = step.status
      const previousStatus = step.previousStatus || "Objeto postado"
      const emailTime = step.emailTime || "08:00"

      // Calcular a data alvo para esta etapa
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - daysAfterShipping)
      const targetDateStr = targetDate.toISOString().split("T")[0]

      // Buscar remessas que precisam ser atualizadas (limitando a quantidade)
      const { data: shipments, error: shipmentsError } = await supabase
        .from("shipments")
        .select("*")
        .eq("status", previousStatus)
        .lte("created_at", targetDateStr)
        .limit(10)

      if (shipmentsError || !shipments || shipments.length === 0) {
        results.push({
          step: `${daysAfterShipping} dias`,
          status: newStatus,
          message: shipmentsError ? shipmentsError.message : "Nenhuma remessa encontrada",
          success: !shipmentsError,
          count: 0,
        })
        continue
      }

      // Processar as remessas
      let successCount = 0
      let errorCount = 0

      for (const shipment of shipments) {
        try {
          // Atualizar o status da remessa
          const { error: updateError } = await supabase
            .from("shipments")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", shipment.id)

          if (updateError) {
            errorCount++
            continue
          }

          // Registrar no histórico de status
          const { error: historyError } = await supabase.from("status_history").insert({
            shipment_id: shipment.id,
            status: newStatus,
            created_at: new Date().toISOString(),
            location: "Sistema de Automação",
            details: `Atualização automática após ${daysAfterShipping} dias`,
          })

          if (historyError) {
            errorCount++
            continue
          }

          // Modificar esta parte para sempre agendar o email para envio imediato
          await supabase.from("scheduled_emails").insert({
            shipment_id: shipment.id,
            status: newStatus,
            scheduled_time: new Date().toISOString(), // Agendar para agora
            created_at: new Date().toISOString(),
            sent: false,
            priority: "high", // Marcar como alta prioridade para envio imediato
          })

          successCount++
        } catch (error) {
          errorCount++
        }
      }

      results.push({
        step: `${daysAfterShipping} dias`,
        status: newStatus,
        success: true,
        successCount,
        errorCount,
        total: shipments.length,
      })
    }

    // Processar alguns emails agendados
    const emailsProcessed = await processMoreScheduledEmails(supabase, 5)

    // Se houver mais etapas ou mais emails para processar, agendar a próxima execução
    if (hasMoreSteps || emailsProcessed.hasMore) {
      try {
        const continuationUrl = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/cron/continue-automation`
        await fetch(continuationUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            skipSteps: skipSteps + maxStepsToProcess,
            timestamp: Date.now(),
          }),
        })
      } catch (error) {
        console.error("Erro ao agendar continuação da automação:", error)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Continuação da automação executada com sucesso",
      results,
      emailsProcessed: emailsProcessed.count,
      hasMoreSteps,
      hasMoreEmails: emailsProcessed.hasMore,
      nextSkipSteps: skipSteps + maxStepsToProcess,
    })
  } catch (error) {
    console.error("Erro na continuação da automação:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro na continuação da automação",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Função para processar mais emails agendados
async function processMoreScheduledEmails(supabase: any, limit = 10) {
  try {
    const now = new Date().toISOString()

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

    if (fetchError || !scheduledEmails || scheduledEmails.length === 0) {
      return { count: 0, hasMore: false }
    }

    // Verificar se há mais emails para processar
    const hasMore = (count || 0) > scheduledEmails.length

    // Enviar cada email agendado
    let processedCount = 0
    for (const email of scheduledEmails) {
      try {
        // Chamar a API de envio de email
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/send-status-update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shipmentId: email.shipment_id,
            status: email.status,
          }),
        })

        // Marcar como enviado
        await supabase
          .from("scheduled_emails")
          .update({
            sent: true,
            sent_at: new Date().toISOString(),
          })
          .eq("id", email.id)

        processedCount++
      } catch (error) {
        console.error(`Erro ao enviar email agendado para remessa ${email.shipment_id}:`, error)
      }
    }

    return { count: processedCount, hasMore }
  } catch (error) {
    console.error("Erro ao processar emails agendados:", error)
    return { count: 0, hasMore: false }
  }
}
