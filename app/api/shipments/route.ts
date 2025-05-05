import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Shipment } from "@/lib/types"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const shipmentData: Shipment = await req.json()

    // Validar dados
    if (!shipmentData.trackingCode) {
      return NextResponse.json({ error: "Código de rastreio é obrigatório" }, { status: 400 })
    }

    // Criar cliente Supabase
    const supabase = createServerSupabaseClient()

    // Verificar se o código de rastreio já existe
    const { data: existingShipment } = await supabase
      .from("shipments")
      .select("tracking_code")
      .eq("tracking_code", shipmentData.trackingCode)
      .single()

    if (existingShipment) {
      return NextResponse.json({ error: "Código de rastreio já existe" }, { status: 400 })
    }

    // Inserir remessa
    const { error } = await supabase.from("shipments").insert({
      tracking_code: shipmentData.trackingCode,
      sender_name: shipmentData.senderName,
      recipient_name: shipmentData.recipientName,
      recipient_cpf: shipmentData.recipientCpf,
      origin_address: shipmentData.originAddress,
      destination_address: shipmentData.destinationAddress,
      product_type: shipmentData.productType,
      weight: shipmentData.weight,
      ship_date: shipmentData.shipDate,
      status: shipmentData.status,
      order_id: shipmentData.orderId,
      customer_email: shipmentData.customerEmail,
      customer_phone: shipmentData.customerPhone,
    })

    if (error) {
      console.error("Erro ao inserir remessa:", error)
      return NextResponse.json({ error: "Erro ao criar remessa" }, { status: 500 })
    }

    // Inserir histórico de status
    const { error: historyError } = await supabase.from("status_history").insert({
      tracking_code: shipmentData.trackingCode,
      status: shipmentData.status,
      notes: "Status inicial",
    })

    if (historyError) {
      console.error("Erro ao inserir histórico:", historyError)
      // Não retornar erro, apenas logar
    }

    // Enviar email de confirmação se tiver email do cliente
    let emailSent = false
    if (shipmentData.customerEmail) {
      try {
        console.log(`Tentando enviar email para ${shipmentData.customerEmail} sobre nova remessa`)

        // Configurar o transportador de email
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        })

        // Verificar conexão SMTP
        await transporter.verify()
        console.log("[API] Conexão SMTP verificada com sucesso")

        // Preparar URL de rastreio
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://v0-logistica-site-design.vercel.app"
        const trackingUrl = `${siteUrl}/rastreio?codigo=${shipmentData.trackingCode}`

        // Criar conteúdo do email
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h1 style="color: #e53e3e;">Sua Remessa foi Cadastrada</h1>
            <p>Olá ${shipmentData.recipientName},</p>
            <p>Sua remessa foi cadastrada em nosso sistema e está pronta para ser rastreada.</p>
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Código de Rastreio:</strong> ${shipmentData.trackingCode}</p>
              <p><strong>Status Atual:</strong> ${shipmentData.status}</p>
              <p><strong>Produto:</strong> ${shipmentData.productType}</p>
              <p><strong>Data de Envio:</strong> ${new Date(shipmentData.shipDate).toLocaleDateString("pt-BR")}</p>
            </div>
            <p>Para acompanhar sua remessa, <a href="${trackingUrl}" style="color: #e53e3e;">clique aqui</a>.</p>
            <p>Obrigado por utilizar nossos serviços!</p>
          </div>
        `

        // Enviar email
        const mailOptions = {
          from: `"Serviço de Logística" <${process.env.SMTP_USER}>`,
          to: shipmentData.customerEmail,
          subject: `Remessa Cadastrada: ${shipmentData.trackingCode}`,
          html: htmlContent,
        }

        const info = await transporter.sendMail(mailOptions)
        console.log("[API] Email de nova remessa enviado com sucesso:", info.messageId)
        emailSent = true
      } catch (emailError) {
        console.error("Erro ao enviar email de nova remessa:", emailError)
        // Não retornar erro, apenas logar
      }
    } else {
      console.log("Não foi possível enviar email: cliente não tem email cadastrado")
    }

    return NextResponse.json({
      success: true,
      trackingCode: shipmentData.trackingCode,
      emailSent,
    })
  } catch (error) {
    console.error("Erro ao processar requisição:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("shipments").select("*").order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao buscar remessas:", error)
    return NextResponse.json({ error: "Erro ao buscar remessas" }, { status: 500 })
  }
}
