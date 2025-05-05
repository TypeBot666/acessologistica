import nodemailer from "nodemailer"

// Configuração do transportador de email
const getTransporter = async () => {
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
  console.log("[Email Service] Conexão SMTP verificada com sucesso")

  return transporter
}

// Função para enviar email de rastreio
export async function sendTrackingEmail({
  trackingCode,
  customerEmail,
  customerName,
  productType,
}: {
  trackingCode: string
  customerEmail: string
  customerName: string
  productType: string
}) {
  try {
    const transporter = await getTransporter()

    // Preparar URL de rastreio
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://v0-logistica-site-design.vercel.app"
    const trackingUrl = `${siteUrl}/rastreio?codigo=${trackingCode}`

    // Criar conteúdo do email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #e53e3e;">Sua Remessa foi Cadastrada</h1>
        <p>Olá ${customerName},</p>
        <p>Sua remessa foi cadastrada em nosso sistema e está pronta para ser rastreada.</p>
        <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Código de Rastreio:</strong> ${trackingCode}</p>
          <p><strong>Produto:</strong> ${productType}</p>
        </div>
        <p>Para acompanhar sua remessa, <a href="${trackingUrl}" style="color: #e53e3e;">clique aqui</a>.</p>
        <p>Obrigado por utilizar nossos serviços!</p>
      </div>
    `

    // Enviar email
    const mailOptions = {
      from: `"Serviço de Logística" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `Remessa Cadastrada: ${trackingCode}`,
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("[Email Service] Email de rastreio enviado com sucesso:", info.messageId)

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("[Email Service] Erro ao enviar email de rastreio:", error)
    throw error
  }
}

// Função para gerar HTML da timeline
function generateTimelineHTML(statusHistory: any[], currentStatus: string) {
  // Ordenar histórico por data
  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )

  // Adicionar status atual se não estiver no histórico
  const lastStatus = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1].status : null
  if (lastStatus !== currentStatus) {
    sortedHistory.push({
      status: currentStatus,
      timestamp: new Date().toISOString(),
    })
  }

  // Gerar HTML da timeline
  let timelineHTML = `
    <div style="margin: 30px 0;">
      <h3 style="color: #333; margin-bottom: 15px;">Histórico de Status</h3>
      <div style="position: relative; padding-left: 30px;">
        <div style="position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background-color: #e0e0e0;"></div>
  `

  sortedHistory.forEach((item, index) => {
    const isLast = index === sortedHistory.length - 1
    const date = new Date(item.timestamp).toLocaleDateString("pt-BR")
    const time = new Date(item.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

    // Determinar a cor do círculo com base no status
    let circleColor = "#e53e3e" // Cor padrão (vermelho)
    if (item.status.includes("Entregue")) {
      circleColor = "#10b981" // Verde para entregue
    } else if (item.status.includes("trânsito") || item.status.includes("rota")) {
      circleColor = "#3b82f6" // Azul para em trânsito/rota
    } else if (item.status.includes("ausente") || item.status.includes("devolvido")) {
      circleColor = "#f59e0b" // Laranja para problemas
    }

    timelineHTML += `
      <div style="position: relative; margin-bottom: ${isLast ? "0" : "20px"};">
        <div style="position: absolute; left: -10px; width: 20px; height: 20px; border-radius: 50%; background-color: ${circleColor}; top: 0;"></div>
        <div style="padding-left: 20px;">
          <p style="margin: 0; font-weight: bold; color: #333;">${item.status}</p>
          <p style="margin: 0; font-size: 14px; color: #666;">${date} às ${time}</p>
        </div>
      </div>
    `
  })

  timelineHTML += `
      </div>
    </div>
  `

  return timelineHTML
}

// Função para enviar email de atualização de status
export async function sendStatusUpdateEmail({
  trackingCode,
  customerEmail,
  customerName,
  status,
  productType,
  statusHistory = [],
}: {
  trackingCode: string
  customerEmail: string
  customerName: string
  status: string
  productType: string
  statusHistory?: any[]
}) {
  try {
    const transporter = await getTransporter()

    // Preparar URL de rastreio
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://v0-logistica-site-design.vercel.app"
    const trackingUrl = `${siteUrl}/rastreio?codigo=${trackingCode}`

    // Gerar HTML da timeline
    const timelineHTML = generateTimelineHTML(statusHistory, status)

    // Criar conteúdo do email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #e53e3e;">Atualização de Status da sua Remessa</h1>
        <p>Olá ${customerName || "Cliente"},</p>
        <p>Sua remessa teve uma atualização de status.</p>
        <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Código de Rastreio:</strong> ${trackingCode}</p>
          <p><strong>Novo Status:</strong> ${status}</p>
          <p><strong>Produto:</strong> ${productType}</p>
          <p><strong>Data da Atualização:</strong> ${new Date().toLocaleString("pt-BR")}</p>
        </div>
        
        ${timelineHTML}
        
        <p>Para acompanhar sua remessa, <a href="${trackingUrl}" style="color: #e53e3e;">clique aqui</a>.</p>
        <p>Obrigado por utilizar nossos serviços!</p>
      </div>
    `

    // Enviar email
    const mailOptions = {
      from: `"Serviço de Logística" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `Atualização da sua remessa: ${trackingCode}`,
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("[Email Service] Email de atualização enviado com sucesso:", info.messageId)

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("[Email Service] Erro ao enviar email de atualização:", error)
    throw error
  }
}
