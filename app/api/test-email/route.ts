import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function GET(req: Request) {
  try {
    // Obter parâmetros da URL
    const url = new URL(req.url)
    const to = url.searchParams.get("email") || "seu-email@exemplo.com"

    console.log("Iniciando teste de email...")
    console.log("Configurações SMTP:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        // Não logamos a senha por segurança
      },
    })

    // Configuração do transporte de email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "user@example.com",
        pass: process.env.SMTP_PASSWORD || "password",
      },
    })

    console.log(`Tentando enviar email para: ${to}`)

    // Enviar email de teste
    const info = await transporter.sendMail({
      from: `"Jadlog - Teste" <${process.env.SMTP_USER}>`,
      to,
      subject: "Teste de Email - Jadlog Rastreamento",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; padding: 10px; background-color: #f8f8f8; margin-bottom: 20px;">
            <h1 style="color: #e53e3e; margin: 0;">Teste de Email Jadlog</h1>
          </div>
          
          <p>Este é um email de teste do sistema de rastreamento Jadlog.</p>
          
          <p>Detalhes do teste:</p>
          <ul>
            <li>Data e hora: ${new Date().toLocaleString()}</li>
            <li>Site URL: ${process.env.NEXT_PUBLIC_SITE_URL || "URL não configurada"}</li>
          </ul>
          
          <p>Se você está recebendo este email, significa que a configuração SMTP está funcionando corretamente!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">VISITAR SITE</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #666;">Este é um email automático de teste. Por favor, não responda a esta mensagem.</p>
        </div>
      `,
    })

    console.log("Email enviado com sucesso:", info)

    return NextResponse.json({
      success: true,
      message: "Email de teste enviado com sucesso!",
      details: {
        messageId: info.messageId,
        to,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Erro ao enviar email de teste:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Erro ao enviar email: ${error instanceof Error ? error.message : String(error)}`,
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE === "true",
          user: process.env.SMTP_USER ? "***configurado***" : "***não configurado***",
          pass: process.env.SMTP_PASSWORD ? "***configurado***" : "***não configurado***",
        },
      },
      { status: 500 },
    )
  }
}
