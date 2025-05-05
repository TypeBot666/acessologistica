import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function GET() {
  try {
    // Verificar se as variáveis de ambiente necessárias estão definidas
    const requiredVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"]
    const missingVars = requiredVars.filter((varName) => !process.env[varName])

    if (missingVars.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Variáveis de ambiente ausentes: ${missingVars.join(", ")}`,
          missingVars,
        },
        { status: 400 },
      )
    }

    // Tentar criar um transporter e verificar a conexão
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Verificar a conexão com o servidor SMTP
    await transporter.verify()

    return NextResponse.json({
      success: true,
      message: "Configurações de email verificadas com sucesso",
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER ? "Configurado" : "Não configurado",
        pass: process.env.SMTP_PASSWORD ? "Configurado" : "Não configurado",
      },
    })
  } catch (error) {
    console.error("Erro ao verificar configurações de email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao verificar configurações de email",
      },
      { status: 500 },
    )
  }
}
