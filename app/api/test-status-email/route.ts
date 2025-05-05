import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { trackingCode } = body

    if (!trackingCode) {
      return NextResponse.json({ success: false, error: "Código de rastreio é obrigatório" }, { status: 400 })
    }

    // Buscar dados do pedido
    const supabase = createServerSupabaseClient()
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("*")
      .eq("tracking_code", trackingCode)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json({ success: false, error: "Pedido não encontrado" }, { status: 404 })
    }

    if (!shipment.customer_email) {
      return NextResponse.json({ success: false, error: "Este pedido não tem um email associado" }, { status: 400 })
    }

    // Buscar histórico de status
    const { data: statusHistory } = await supabase
      .from("status_history")
      .select("*")
      .eq("tracking_code", trackingCode)
      .order("created_at", { ascending: true })

    // Configurar email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Email HTML simplificado
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #e53e3e;">Teste de Email - Atualização de Status</h1>
        <p>Olá ${shipment.recipient_name || "Cliente"},</p>
        <p>Este é um email de teste para verificar a configuração de notificações.</p>
        <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Código de Rastreio:</strong> ${trackingCode}</p>
          <p><strong>Status Atual:</strong> ${shipment.status}</p>
          <p><strong>Data do Teste:</strong> ${new Date().toLocaleString("pt-BR")}</p>
        </div>
        <p>Se você está recebendo este email, significa que a configuração de envio de emails está funcionando corretamente.</p>
        <p>Este é um email automático de teste. Por favor, não responda a esta mensagem.</p>
      </div>
    `

    // Enviar email
    const mailOptions = {
      from: `"Serviço de Logística" <${process.env.SMTP_USER}>`,
      to: shipment.customer_email,
      subject: `TESTE - Atualização da sua remessa: ${trackingCode}`,
      html: htmlContent,
    }

    console.log("Enviando email de teste para:", shipment.customer_email)

    const info = await transporter.sendMail(mailOptions)
    console.log("Email de teste enviado com sucesso:", info.messageId)

    return NextResponse.json({
      success: true,
      message: `Email de teste enviado com sucesso para ${shipment.customer_email}`,
      messageId: info.messageId,
    })
  } catch (error) {
    console.error("Erro ao enviar email de teste:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
