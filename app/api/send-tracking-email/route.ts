import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Template padrão caso não exista um personalizado
const defaultTemplate = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <div style="text-align: center; padding: 10px; background-color: #f8f8f8; margin-bottom: 20px;">
    <h1 style="color: #e53e3e; margin: 0;">Sua remessa foi registrada!</h1>
  </div>
  
  <p>Olá {{recipientName}},</p>
  
  <p>Sua remessa foi registrada em nosso sistema e está pronta para ser rastreada. Abaixo estão os detalhes da sua remessa:</p>
  
  <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p><strong>Código de Rastreio:</strong> {{trackingCode}}</p>
    <p><strong>Tipo de Produto:</strong> {{productType}}</p>
    <p><strong>Status Atual:</strong> Objeto postado</p>
  </div>
  
  <p>Você pode acompanhar sua remessa a qualquer momento clicando no botão abaixo:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{trackingUrl}}" style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">RASTREAR MINHA REMESSA</a>
  </div>
  
  <p>Ou copie e cole este link no seu navegador:</p>
  <p style="word-break: break-all; color: #3182ce;">{{trackingUrl}}</p>
  
  <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
  
  <p style="font-size: 12px; color: #666;">Este é um email automático. Por favor, não responda a esta mensagem.</p>
</div>
`

export async function POST(req: Request) {
  try {
    const { email, trackingCode, recipientName, productType } = await req.json()

    if (!email || !trackingCode) {
      return NextResponse.json(
        { success: false, error: "Email e código de rastreio são obrigatórios" },
        { status: 400 },
      )
    }

    // Buscar template personalizado (em um cenário real, isso viria do banco de dados)
    let template = defaultTemplate
    try {
      const templateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/update-email-templates`, {
        method: "GET",
      })
      const templates = await templateResponse.json()
      if (templates.tracking) {
        template = templates.tracking
      }
    } catch (error) {
      console.error("Erro ao buscar template personalizado:", error)
      // Continua com o template padrão
    }

    // Configuração do transporte de email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "kwaiads751@gmail.com",
        pass: process.env.SMTP_PASSWORD || "xscycjvjecsacdgr",
      },
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://v0-logistica-site-design.vercel.app"
    const trackingUrl = `${siteUrl}/rastreio?codigo=${trackingCode}`

    // Substituir variáveis no template
    const htmlContent = template
      .replace(/{{recipientName}}/g, recipientName || "Cliente")
      .replace(/{{trackingCode}}/g, trackingCode)
      .replace(/{{productType}}/g, productType || "Produto")
      .replace(/{{trackingUrl}}/g, trackingUrl)

    // Enviar email
    const info = await transporter.sendMail({
      from: `"Serviço de Logística" <${process.env.SMTP_USER || "kwaiads751@gmail.com"}>`,
      to: email,
      subject: `Rastreamento da sua remessa: ${trackingCode}`,
      html: htmlContent,
    })

    return NextResponse.json({
      success: true,
      message: "Email de rastreio enviado com sucesso!",
      messageId: info.messageId,
    })
  } catch (error) {
    console.error("Erro ao enviar email de rastreio:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Erro ao enviar email: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
