import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function GET(req: Request) {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    const config = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD ? "Configurado" : "Não configurado",
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
    }

    // Verificar se há configurações ausentes
    const missingConfig = []
    if (!config.host) missingConfig.push("SMTP_HOST")
    if (!config.port) missingConfig.push("SMTP_PORT")
    if (!config.user) missingConfig.push("SMTP_USER")
    if (!config.pass === "Não configurado") missingConfig.push("SMTP_PASSWORD")

    // Se houver configurações ausentes, retornar erro
    if (missingConfig.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Configurações de email incompletas. Faltando: ${missingConfig.join(", ")}`,
        config,
      })
    }

    // Tentar verificar a conexão com o servidor SMTP
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: Number(config.port || "587"),
        secure: config.secure,
        auth: {
          user: config.user,
          pass: process.env.SMTP_PASSWORD,
        },
      })

      await transporter.verify()

      return NextResponse.json({
        success: true,
        message: "Configurações de email verificadas com sucesso",
        config,
      })
    } catch (verifyError) {
      return NextResponse.json({
        success: false,
        error: `Erro ao verificar conexão com servidor SMTP: ${
          verifyError instanceof Error ? verifyError.message : "Erro desconhecido"
        }`,
        config,
        details: verifyError,
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Erro ao verificar configurações de email: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`,
    })
  }
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email é obrigatório" }, { status: 400 })
    }

    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          error: "Configurações de email incompletas. Verifique as variáveis de ambiente SMTP.",
        },
        { status: 500 },
      )
    }

    // Configurar transporte de email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Verificar conexão
    await transporter.verify()

    // Enviar email de teste
    const info = await transporter.sendMail({
      from: `"Sistema de Logística" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Teste de Configuração de Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #e53e3e;">Teste de Email</h1>
          <p>Este é um email de teste para verificar as configurações de SMTP.</p>
          <p>Se você está recebendo este email, significa que as configurações estão corretas!</p>
          <p>Data e hora do teste: ${new Date().toLocaleString("pt-BR")}</p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: "Email de teste enviado com sucesso!",
      messageId: info.messageId,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Erro ao enviar email de teste: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      details: error,
    })
  }
}
