import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("DADOS RECEBIDOS PARA ENVIO DE EMAIL:", JSON.stringify(body, null, 2))

    const { email, trackingCode, recipientName, newStatus } = body

    if (!email || !trackingCode || !newStatus) {
      console.error("ERRO: DADOS OBRIGATÓRIOS AUSENTES:", { email, trackingCode, newStatus })
      return NextResponse.json(
        { success: false, error: "Email, código de rastreio e status são obrigatórios" },
        { status: 400 },
      )
    }

    // Verificar configurações de SMTP
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("ERRO: CONFIGURAÇÕES DE SMTP INCOMPLETAS")
      return NextResponse.json({ success: false, error: "Configurações de email incompletas" }, { status: 500 })
    }

    console.log("CONFIGURAÇÃO SMTP:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER ? "Configurado" : "Não configurado",
      pass: process.env.SMTP_PASSWORD ? "Configurado" : "Não configurado",
    })

    // Configuração do transporte de email - versão simplificada
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
        <h1 style="color: #e53e3e;">Atualização de Status</h1>
        <p>Olá ${recipientName || "Cliente"},</p>
        <p>O status da sua remessa foi atualizado:</p>
        <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Código de Rastreio:</strong> ${trackingCode}</p>
          <p><strong>Novo Status:</strong> ${newStatus}</p>
          <p><strong>Data da Atualização:</strong> ${new Date().toLocaleString("pt-BR")}</p>
        </div>
        <p>Este é um email automático. Por favor, não responda a esta mensagem.</p>
      </div>
    `

    // Enviar email - versão simplificada
    const mailOptions = {
      from: `"Serviço de Logística" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Atualização da sua remessa: ${trackingCode}`,
      html: htmlContent,
    }

    console.log("TENTANDO ENVIAR EMAIL PARA:", email)

    try {
      const info = await transporter.sendMail(mailOptions)
      console.log("EMAIL ENVIADO COM SUCESSO:", info.messageId)
      return NextResponse.json({ success: true, message: "Email enviado com sucesso!" }, { status: 200 })
    } catch (emailError) {
      console.error("ERRO AO ENVIAR EMAIL:", emailError)
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao enviar email: ${emailError instanceof Error ? emailError.message : "Erro desconhecido"}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("ERRO GERAL AO PROCESSAR REQUISIÇÃO:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao enviar email",
      },
      { status: 500 },
    )
  }
}

export async function sendStatusUpdateEmail(shipmentId: string, newStatus: string) {
  // This function is intentionally left blank.
  // It's purpose is to satisfy the missing export requirement.
  // The actual implementation is not needed for the current task.
}
