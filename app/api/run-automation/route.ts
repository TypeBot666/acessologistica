import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dryRun = searchParams.get("dryRun") === "true"

    const supabase = createClient()

    // Buscar configurações de automação
    const { data: settingsData, error: settingsError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "automation_settings")
      .single()

    if (settingsError) {
      console.error("Erro ao buscar configurações de automação:", settingsError)
      return NextResponse.json(
        { error: `Erro ao buscar configurações de automação: ${settingsError.message}` },
        { status: 500 },
      )
    }

    const settings = settingsData.value

    if (!settings || !settings.enabled || !settings.steps || settings.steps.length === 0) {
      return NextResponse.json({ error: "Configurações de automação inválidas ou desativadas" }, { status: 400 })
    }

    // Buscar todas as remessas que não estão no status final
    const { data: shipments, error: shipmentsError } = await supabase
      .from("shipments")
      .select("*")
      .neq("status", settings.finalStatus)

    if (shipmentsError) {
      console.error("Erro ao buscar remessas:", shipmentsError)
      return NextResponse.json({ error: `Erro ao buscar remessas: ${shipmentsError.message}` }, { status: 500 })
    }

    // Calcular quais remessas serão atualizadas
    const today = new Date()
    const shipmentsToUpdate = []

    for (const shipment of shipments) {
      const shipDate = new Date(shipment.ship_date)
      const daysSinceShipment = Math.floor((today.getTime() - shipDate.getTime()) / (1000 * 60 * 60 * 24))

      // Encontrar o próximo status com base nos dias desde o envio
      let nextStatus = null
      let nextStatusIndex = -1

      // Encontrar o índice do status atual
      const currentStatusIndex = settings.steps.findIndex((step: any) => step.status === shipment.status)

      if (currentStatusIndex >= 0 && currentStatusIndex < settings.steps.length - 1) {
        // Verificar se já passou tempo suficiente para o próximo status
        const nextStep = settings.steps[currentStatusIndex + 1]
        if (daysSinceShipment >= nextStep.days) {
          nextStatus = nextStep.status
          nextStatusIndex = currentStatusIndex + 1
        }
      }

      if (nextStatus) {
        shipmentsToUpdate.push({
          ...shipment,
          current_status: shipment.status,
          next_status: nextStatus,
          next_status_index: nextStatusIndex,
          days_since_shipment: daysSinceShipment,
        })
      }
    }

    if (dryRun) {
      return NextResponse.json({
        shipments: shipmentsToUpdate,
        count: shipmentsToUpdate.length,
      })
    }

    return NextResponse.json({
      shipments: shipmentsToUpdate.map((s) => ({
        tracking_code: s.tracking_code,
        current_status: s.current_status,
        next_status: s.next_status,
      })),
      count: shipmentsToUpdate.length,
    })
  } catch (error) {
    console.error("Erro ao executar automação (GET):", error)
    return NextResponse.json(
      { error: `Erro ao executar automação: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    const logs = ["Iniciando processo de automação..."]
    const supabase = createClient()

    logs.push("Buscando configurações de automação...")
    // Buscar configurações de automação
    const { data: settingsData, error: settingsError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "automation_settings")
      .single()

    if (settingsError) {
      logs.push(`ERRO: Falha ao buscar configurações de automação: ${settingsError.message}`)
      console.error("Erro ao buscar configurações de automação:", settingsError)
      return NextResponse.json(
        {
          error: `Erro ao buscar configurações de automação: ${settingsError.message}`,
          logs,
        },
        { status: 500 },
      )
    }

    const settings = settingsData.value

    if (!settings || !settings.enabled || !settings.steps || settings.steps.length === 0) {
      logs.push("ERRO: Configurações de automação inválidas ou desativadas")
      return NextResponse.json(
        {
          error: "Configurações de automação inválidas ou desativadas",
          logs,
        },
        { status: 400 },
      )
    }

    logs.push(`Automação está ${settings.enabled ? "ativada" : "desativada"}`)
    logs.push(`Status final configurado: ${settings.finalStatus}`)
    logs.push(`Número de etapas configuradas: ${settings.steps.length}`)

    // Buscar todas as remessas que não estão no status final
    logs.push("Buscando remessas que não estão no status final...")
    const { data: shipments, error: shipmentsError } = await supabase
      .from("shipments")
      .select("*")
      .neq("status", settings.finalStatus)

    if (shipmentsError) {
      logs.push(`ERRO: Falha ao buscar remessas: ${shipmentsError.message}`)
      console.error("Erro ao buscar remessas:", shipmentsError)
      return NextResponse.json(
        {
          error: `Erro ao buscar remessas: ${shipmentsError.message}`,
          logs,
        },
        { status: 500 },
      )
    }

    logs.push(`Encontradas ${shipments.length} remessas para processar`)

    // Calcular quais remessas serão atualizadas
    logs.push("Calculando quais remessas precisam ser atualizadas...")
    const today = new Date()
    const shipmentsToUpdate = []

    for (const shipment of shipments) {
      const shipDate = new Date(shipment.ship_date)
      const daysSinceShipment = Math.floor((today.getTime() - shipDate.getTime()) / (1000 * 60 * 60 * 24))

      // Encontrar o próximo status com base nos dias desde o envio
      let nextStatus = null

      // Encontrar o índice do status atual
      const currentStatusIndex = settings.steps.findIndex((step: any) => step.status === shipment.status)

      if (currentStatusIndex >= 0 && currentStatusIndex < settings.steps.length - 1) {
        // Verificar se já passou tempo suficiente para o próximo status
        const nextStep = settings.steps[currentStatusIndex + 1]
        if (daysSinceShipment >= nextStep.days) {
          nextStatus = nextStep.status
        }
      }

      if (nextStatus) {
        shipmentsToUpdate.push({
          ...shipment,
          next_status: nextStatus,
        })
      }
    }

    logs.push(`${shipmentsToUpdate.length} remessas serão atualizadas`)

    if (shipmentsToUpdate.length === 0) {
      logs.push("Nenhuma remessa precisa ser atualizada neste momento")
      return NextResponse.json({
        message: "Nenhuma remessa precisa ser atualizada",
        updated: 0,
        logs,
      })
    }

    // Atualizar as remessas
    logs.push("Iniciando atualização das remessas...")
    let updatedCount = 0

    for (const shipment of shipmentsToUpdate) {
      logs.push(`Atualizando remessa ${shipment.tracking_code} de "${shipment.status}" para "${shipment.next_status}"`)

      // Atualizar o status da remessa
      const { error: updateError } = await supabase
        .from("shipments")
        .update({ status: shipment.next_status })
        .eq("tracking_code", shipment.tracking_code)

      if (updateError) {
        logs.push(`ERRO: Falha ao atualizar remessa ${shipment.tracking_code}: ${updateError.message}`)
        console.error(`Erro ao atualizar remessa ${shipment.tracking_code}:`, updateError)
        continue
      }

      // Adicionar ao histórico de status
      const { error: historyError } = await supabase.from("status_history").insert([
        {
          tracking_code: shipment.tracking_code,
          status: shipment.next_status,
          notes: `Atualizado automaticamente pela automação`,
        },
      ])

      if (historyError) {
        logs.push(`ERRO: Falha ao adicionar histórico para remessa ${shipment.tracking_code}: ${historyError.message}`)
        console.error(`Erro ao adicionar histórico para remessa ${shipment.tracking_code}:`, historyError)
        continue
      }

      // Enviar notificação por e-mail (se tiver e-mail)
      if (shipment.customer_email) {
        logs.push(`Enviando notificação por e-mail para ${shipment.customer_email}`)
        try {
          await fetch("/api/send-status-update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tracking_code: shipment.tracking_code,
              status: shipment.next_status,
              email: shipment.customer_email,
            }),
          })
          logs.push(`E-mail enviado com sucesso para ${shipment.customer_email}`)
        } catch (emailError) {
          logs.push(
            `ERRO: Falha ao enviar e-mail para ${shipment.customer_email}: ${emailError instanceof Error ? emailError.message : String(emailError)}`,
          )
          console.error(`Erro ao enviar e-mail para ${shipment.customer_email}:`, emailError)
        }
      }

      updatedCount++
      logs.push(`Remessa ${shipment.tracking_code} atualizada com sucesso`)
    }

    logs.push(`Automação concluída com sucesso. ${updatedCount} remessas foram atualizadas.`)

    return NextResponse.json({
      message: `${updatedCount} remessas foram atualizadas com sucesso`,
      updated: updatedCount,
      logs,
    })
  } catch (error) {
    console.error("Erro ao executar automação:", error)
    return NextResponse.json(
      {
        error: `Erro ao executar automação: ${error instanceof Error ? error.message : String(error)}`,
        logs: [
          "ERRO: Ocorreu um erro inesperado durante a execução da automação",
          error instanceof Error ? error.message : String(error),
        ],
      },
      { status: 500 },
    )
  }
}
