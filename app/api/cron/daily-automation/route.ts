import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendStatusUpdateEmail } from "@/lib/email/email-service"
import { sendWhatsAppMessage, generateTrackingWhatsAppMessage } from "@/lib/services/whatsapp-service"
import { sendSMS, generateTrackingSMSMessage } from "@/lib/services/sms-service"

export async function GET(request: Request) {
  try {
    console.log("[Daily Automation] Iniciando automação diária...")

    const supabase = createClient()

    // Buscar configurações de automação
    const { data: settingsData, error: settingsError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "automation_settings")
      .single()

    if (settingsError) {
      console.error("[Daily Automation] Erro ao buscar configurações:", settingsError)
      return NextResponse.json({
        success: false,
        error: "Erro ao buscar configurações de automação",
      })
    }

    const settings = settingsData.value

    if (!settings.enabled) {
      console.log("[Daily Automation] Automação desativada nas configurações")
      return NextResponse.json({
        success: true,
        message: "Automação desativada nas configurações",
      })
    }

    // Buscar remessas ativas (que não estão no status final)
    const { data: shipments, error: shipmentsError } = await supabase
      .from("shipments")
      .select("*")
      .neq("status", settings.finalStatus)

    if (shipmentsError) {
      console.error("[Daily Automation] Erro ao buscar remessas:", shipmentsError)
      return NextResponse.json({
        success: false,
        error: "Erro ao buscar remessas",
      })
    }

    console.log(`[Daily Automation] Encontradas ${shipments.length} remessas para processar`)

    let updatedCount = 0
    let emailsSent = 0
    let whatsappSent = 0
    let smsSent = 0

    // Processar cada remessa
    for (const shipment of shipments) {
      const shipDate = new Date(shipment.ship_date)
      const today = new Date()
      const daysSinceShipment = Math.floor((today.getTime() - shipDate.getTime()) / (1000 * 60 * 60 * 24))

      // Encontrar o próximo status baseado nos dias desde o envio
      let nextStatus = null
      let nextStep = null

      for (const step of settings.steps) {
        if (daysSinceShipment >= step.days && step.status !== shipment.status) {
          // Verificar se este status vem depois do status atual na sequência
          const currentStepIndex = settings.steps.findIndex((s) => s.status === shipment.status)
          const thisStepIndex = settings.steps.findIndex((s) => s.status === step.status)

          if (thisStepIndex > currentStepIndex) {
            nextStatus = step.status
            nextStep = step
            break
          }
        }
      }

      if (nextStatus) {
        console.log(`[Daily Automation] Atualizando remessa ${shipment.tracking_code} para status: ${nextStatus}`)

        // Atualizar o status da remessa
        const { error: updateError } = await supabase
          .from("shipments")
          .update({
            status: nextStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("tracking_code", shipment.tracking_code)

        if (updateError) {
          console.error(`[Daily Automation] Erro ao atualizar remessa ${shipment.tracking_code}:`, updateError)
          continue
        }

        // Adicionar ao histórico de status
        const { error: historyError } = await supabase.from("status_history").insert({
          tracking_code: shipment.tracking_code,
          status: nextStatus,
          notes: "Atualização automática",
          created_at: new Date().toISOString(),
        })

        if (historyError) {
          console.error(`[Daily Automation] Erro ao adicionar histórico para ${shipment.tracking_code}:`, historyError)
        }

        updatedCount++

        // Enviar notificações conforme configurado
        if (shipment.customer_email && nextStep?.notificationChannels?.email && settings.emailNotifications) {
          try {
            await sendStatusUpdateEmail({
              trackingCode: shipment.tracking_code,
              customerEmail: shipment.customer_email,
              customerName: shipment.recipient_name,
              status: nextStatus,
              productType: shipment.product_type,
            })
            emailsSent++
            console.log(`[Daily Automation] Email enviado para ${shipment.customer_email}`)
          } catch (emailError) {
            console.error(`[Daily Automation] Erro ao enviar email para ${shipment.tracking_code}:`, emailError)
          }
        }

        // Enviar WhatsApp se configurado
        if (shipment.customer_phone && nextStep?.notificationChannels?.whatsapp && settings.whatsappNotifications) {
          try {
            const message = generateTrackingWhatsAppMessage(shipment.tracking_code, shipment.recipient_name, nextStatus)

            const result = await sendWhatsAppMessage({
              phone: shipment.customer_phone,
              message,
              trackingCode: shipment.tracking_code,
              status: nextStatus,
            })

            if (result.success) {
              whatsappSent++
              console.log(`[Daily Automation] WhatsApp enviado para ${shipment.customer_phone}`)
            } else {
              console.error(`[Daily Automation] Erro ao enviar WhatsApp para ${shipment.tracking_code}:`, result.error)
            }
          } catch (whatsappError) {
            console.error(`[Daily Automation] Erro ao enviar WhatsApp para ${shipment.tracking_code}:`, whatsappError)
          }
        }

        // Enviar SMS se configurado
        if (shipment.customer_phone && nextStep?.notificationChannels?.sms && settings.smsNotifications) {
          try {
            const message = generateTrackingSMSMessage(shipment.tracking_code, nextStatus)

            const result = await sendSMS({
              phone: shipment.customer_phone,
              message,
              trackingCode: shipment.tracking_code,
              status: nextStatus,
            })

            if (result.success) {
              smsSent++
              console.log(`[Daily Automation] SMS enviado para ${shipment.customer_phone}`)
            } else {
              console.error(`[Daily Automation] Erro ao enviar SMS para ${shipment.tracking_code}:`, result.error)
            }
          } catch (smsError) {
            console.error(`[Daily Automation] Erro ao enviar SMS para ${shipment.tracking_code}:`, smsError)
          }
        }
      }
    }

    // Atualizar as configurações com a última execução
    const { error: updateSettingsError } = await supabase
      .from("system_settings")
      .update({
        value: {
          ...settings,
          lastExecution: new Date().toISOString(),
          lastExecutionSuccess: true,
          lastExecutionCount: updatedCount,
        },
      })
      .eq("key", "automation_settings")

    if (updateSettingsError) {
      console.error("[Daily Automation] Erro ao atualizar configurações:", updateSettingsError)
    }

    console.log(
      `[Daily Automation] Automação concluída. ${updatedCount} remessas atualizadas, ${emailsSent} emails enviados, ${whatsappSent} mensagens WhatsApp enviadas, ${smsSent} SMS enviados.`,
    )

    return NextResponse.json({
      success: true,
      message: "Automação executada com sucesso",
      stats: {
        updatedCount,
        emailsSent,
        whatsappSent,
        smsSent,
      },
    })
  } catch (error) {
    console.error("[Daily Automation] Erro na automação diária:", error)
    return NextResponse.json({
      success: false,
      error: `Erro na automação diária: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}
