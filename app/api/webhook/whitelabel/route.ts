import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { generateTrackingCode } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    // Receber dados da plataforma whitelabel
    const rawData = await req.text()
    console.log("Webhook recebido - Dados brutos:", rawData)

    // Salvar o log do webhook recebido
    try {
      await fetch("/api/webhook/log", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          ...Object.fromEntries(req.headers),
        },
        body: rawData,
      })
    } catch (logError) {
      console.error("Erro ao salvar log:", logError)
    }

    // Tentar fazer o parse do JSON
    let whitelabelData
    try {
      whitelabelData = JSON.parse(rawData)
    } catch (e) {
      console.error("Erro ao fazer parse do JSON:", e)
      return NextResponse.json({ error: "Formato JSON inválido" }, { status: 400 })
    }

    console.log("Dados processados:", JSON.stringify(whitelabelData, null, 2))

    // Detectar automaticamente o formato dos dados
    // Vamos tentar identificar campos comuns em diferentes plataformas
    const formatoDetectado = detectarFormato(whitelabelData)
    console.log("Formato detectado:", formatoDetectado)

    // Extrair informações do cliente e endereço com base no formato detectado
    const dadosProcessados = extrairDados(whitelabelData, formatoDetectado)
    console.log("Dados extraídos:", dadosProcessados)

    // Validar dados mínimos necessários
    if (!dadosProcessados.customer || !dadosProcessados.shipping) {
      console.error("Dados incompletos:", dadosProcessados)
      return NextResponse.json({ error: "Dados de cliente ou endereço incompletos" }, { status: 400 })
    }

    // Verificar se o pagamento foi aprovado
    const isPaymentApproved = verificarStatusPagamento(dadosProcessados.paymentStatus)

    if (!isPaymentApproved) {
      console.log("Pagamento não aprovado:", dadosProcessados.paymentStatus)
      return NextResponse.json(
        {
          message: "Pedido registrado, aguardando aprovação de pagamento",
          order_id: dadosProcessados.orderId,
          status: dadosProcessados.paymentStatus,
        },
        { status: 200 },
      )
    }

    // Gerar código de rastreio
    const trackingCode = generateTrackingCode()
    console.log("Código de rastreio gerado:", trackingCode)

    // Criar objeto de remessa
    const shipment = {
      tracking_code: trackingCode,
      sender_name: "Sua Loja",
      recipient_name: dadosProcessados.customer.name,
      recipient_cpf: dadosProcessados.customer.document || "",
      origin_address: "Seu endereço de origem padrão",
      destination_address: dadosProcessados.shipping.fullAddress,
      product_type: "Produto E-commerce",
      weight: dadosProcessados.totalWeight || 0.5,
      ship_date: new Date().toISOString().split("T")[0],
      status: "Objeto postado",
      order_id: dadosProcessados.orderId,
      customer_email: dadosProcessados.customer.email || "",
      customer_phone: dadosProcessados.customer.phone || "",
    }

    console.log("Criando remessa:", shipment)

    // Salvar no banco de dados
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("shipments").insert([shipment]).select()

    if (error) {
      console.error("Erro ao salvar remessa:", error)
      return NextResponse.json({ error: "Erro ao criar remessa" }, { status: 500 })
    }

    console.log("Remessa criada com sucesso:", data)

    // Adicionar ao histórico de status
    await supabase.from("status_history").insert([
      {
        tracking_code: trackingCode,
        status: "Objeto postado",
        notes: `Remessa criada automaticamente para o pedido ${dadosProcessados.orderId}`,
      },
    ])

    // Enviar notificação por e-mail (se tiver e-mail)
    if (dadosProcessados.customer.email) {
      console.log(`Simulando envio de e-mail para ${dadosProcessados.customer.email}`)
      // Aqui você implementaria o envio real de e-mail
    }

    // Retornar código de rastreio
    return NextResponse.json({
      success: true,
      tracking_code: trackingCode,
      message: "Remessa criada com sucesso",
      notification_sent: !!dadosProcessados.customer.email,
      order_id: dadosProcessados.orderId,
    })
  } catch (error) {
    console.error("Erro no webhook whitelabel:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Função para detectar o formato dos dados
function detectarFormato(dados: any): string {
  // Verificar formato da ZeroOnePay
  if (dados.transaction_id && dados.payment_method === "pix") {
    return "zeroonepay"
  }

  // Verificar formato da ZeroOnePay (formato alternativo)
  if (dados.id && dados.payment_type === "pix") {
    return "zeroonepay"
  }

  // Verificar formato da ZeroOnePay (formato do exemplo do usuário)
  if (dados.event === "compra_aprovada" && dados.nome && dados.cpf) {
    return "zeroonepay-custom"
  }

  // Verificar formato de plataformas comuns
  if (dados.resource && dados.action) {
    return "mercadopago"
  }
  if (dados.transaction) {
    return "pagseguro"
  }
  if (dados.event && dados.data) {
    return "stripe"
  }
  if (dados.order_id || dados.order) {
    return "generico"
  }
  if (dados.id && dados.status) {
    return "generico2"
  }

  return "desconhecido"
}

// Função para extrair dados com base no formato
function extrairDados(dados: any, formato: string): any {
  let customer: any = {}
  let shipping: any = {}
  let items: any[] = []
  let orderId = ""
  let paymentStatus = ""
  let totalWeight = 0

  switch (formato) {
    case "zeroonepay-custom":
      // Extrair dados da ZeroOnePay no formato do exemplo do usuário
      try {
        orderId = dados.id || `ZOP-${Date.now()}`
        paymentStatus = "approved" // Já sabemos que é aprovado pelo evento "compra_aprovada"

        // Cliente
        customer = {
          name: dados.nome || "",
          email: dados.email || "",
          phone: dados.telefone || "",
          document: dados.cpf || "",
        }

        // Endereço
        const endereco = dados.endereco || {}
        shipping = {
          street: endereco.rua || "",
          number: endereco.numero || "",
          complement: endereco.complemento || "",
          neighborhood: endereco.bairro || "",
          city: endereco.cidade || "",
          state: endereco.estado || "",
          postalCode: endereco.cep || "",
          fullAddress: `${endereco.rua || ""}, ${endereco.numero || ""}${
            endereco.complemento ? `, ${endereco.complemento}` : ""
          }, ${endereco.bairro || ""}, ${endereco.cidade || ""} - ${endereco.estado || ""}, ${endereco.cep || ""}`,
        }

        // Itens
        items = [
          {
            name: dados.produto || "Produto ZeroOnePay",
            quantity: dados.quantidade || 1,
            weight: dados.peso || 0.5,
          },
        ]

        totalWeight = items.reduce((sum, item) => sum + (item.weight || 0.5) * (item.quantity || 1), 0)
      } catch (e) {
        console.error("Erro ao processar dados da ZeroOnePay (formato customizado):", e)
      }
      break

    case "zeroonepay":
      // Extrair dados da ZeroOnePay
      try {
        orderId = dados.transaction_id || dados.id || `ZOP-${Date.now()}`
        paymentStatus = dados.status || "pending"

        // Cliente
        if (dados.customer || dados.buyer) {
          const customerData = dados.customer || dados.buyer
          customer = {
            name: customerData.name || customerData.full_name || "",
            email: customerData.email || "",
            phone: customerData.phone || customerData.phone_number || "",
            document: customerData.document || customerData.cpf || customerData.document_number || "",
          }
        }

        // Endereço
        if (dados.shipping || dados.address || dados.shipping_address) {
          const shippingData = dados.shipping || dados.address || dados.shipping_address

          shipping = {
            street: shippingData.address || shippingData.street || "",
            number: shippingData.number || "",
            complement: shippingData.complement || "",
            neighborhood: shippingData.neighborhood || shippingData.district || "",
            city: shippingData.city || "",
            state: shippingData.state || shippingData.uf || "",
            postalCode: shippingData.postal_code || shippingData.zip_code || shippingData.cep || "",
            fullAddress:
              shippingData.address ||
              `${shippingData.street || ""}, ${shippingData.number || ""}, ${shippingData.city || ""} - ${shippingData.state || ""}, ${shippingData.postal_code || ""}`,
          }
        }

        // Itens
        if (dados.items && Array.isArray(dados.items)) {
          items = dados.items.map((item: any) => ({
            name: item.name || item.title || item.product_name || "Produto",
            quantity: Number(item.quantity) || 1,
            weight: Number(item.weight) || 0.5,
          }))

          totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0)
        } else {
          // Se não houver itens, criar um item padrão
          items = [
            {
              name: "Produto ZeroOnePay",
              quantity: 1,
              weight: 0.5,
            },
          ]
          totalWeight = 0.5
        }
      } catch (e) {
        console.error("Erro ao processar dados da ZeroOnePay:", e)
      }
      break

    case "mercadopago":
      // Extrair dados do MercadoPago
      try {
        const data = dados.data || {}
        orderId = data.id || dados.id || `MP-${Date.now()}`
        paymentStatus = data.status || "pending"

        // Cliente
        if (data.payer) {
          customer = {
            name: data.payer.first_name + " " + data.payer.last_name,
            email: data.payer.email,
            phone: data.payer.phone ? data.payer.phone.number : "",
            document: data.payer.identification ? data.payer.identification.number : "",
          }
        }

        // Endereço
        if (data.shipping_address || (data.additional_info && data.additional_info.shipments)) {
          const shippingData = data.shipping_address || data.additional_info.shipments
          shipping = {
            street: shippingData.street_name || "",
            number: shippingData.street_number || "",
            complement: shippingData.comment || "",
            neighborhood: shippingData.neighborhood || "",
            city: shippingData.city || "",
            state: shippingData.state || "",
            postalCode: shippingData.zip_code || "",
            fullAddress: `${shippingData.street_name || ""}, ${shippingData.street_number || ""}, ${shippingData.city || ""} - ${shippingData.state || ""}, ${shippingData.zip_code || ""}`,
          }
        }

        // Itens
        if (data.additional_info && data.additional_info.items) {
          items = data.additional_info.items.map((item: any) => ({
            name: item.title || "Produto",
            quantity: item.quantity || 1,
            weight: 0.5, // Peso padrão
          }))

          totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0)
        }
      } catch (e) {
        console.error("Erro ao processar dados do MercadoPago:", e)
      }
      break

    case "pagseguro":
      // Extrair dados do PagSeguro
      try {
        const transaction = dados.transaction || {}
        orderId = transaction.code || dados.code || `PS-${Date.now()}`
        paymentStatus = transaction.status || dados.status || "pending"

        // Converter status do PagSeguro
        if (paymentStatus === "3" || paymentStatus === "4") {
          paymentStatus = "approved"
        }

        // Cliente
        if (transaction.sender || dados.sender) {
          const sender = transaction.sender || dados.sender
          customer = {
            name: sender.name || "",
            email: sender.email || "",
            phone: sender.phone ? `${sender.phone.areaCode}${sender.phone.number}` : "",
            document: sender.documents && sender.documents.length > 0 ? sender.documents[0].value : "",
          }
        }

        // Endereço
        if (transaction.shipping || dados.shipping) {
          const shippingData = transaction.shipping || dados.shipping
          const address = shippingData.address || {}

          shipping = {
            street: address.street || "",
            number: address.number || "",
            complement: address.complement || "",
            neighborhood: address.district || "",
            city: address.city || "",
            state: address.state || "",
            postalCode: address.postalCode || "",
            fullAddress: `${address.street || ""}, ${address.number || ""}, ${address.district || ""}, ${address.city || ""} - ${address.state || ""}, ${address.postalCode || ""}`,
          }
        }

        // Itens
        if (transaction.items || dados.items) {
          const itemsList = transaction.items || dados.items
          items = (itemsList.item || []).map((item: any) => ({
            name: item.description || "Produto",
            quantity: Number.parseInt(item.quantity) || 1,
            weight: Number.parseFloat(item.weight || "0.5") || 0.5,
          }))

          totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0)
        }
      } catch (e) {
        console.error("Erro ao processar dados do PagSeguro:", e)
      }
      break

    case "stripe":
      // Extrair dados do Stripe
      try {
        const eventData = dados.data.object || {}
        orderId = eventData.id || `ST-${Date.now()}`
        paymentStatus = eventData.status || "pending"

        // Converter status do Stripe
        if (paymentStatus === "succeeded" || paymentStatus === "paid") {
          paymentStatus = "approved"
        }

        // Cliente
        if (eventData.customer_details || eventData.customer) {
          const customerData = eventData.customer_details || eventData.customer
          customer = {
            name: customerData.name || "",
            email: customerData.email || "",
            phone: customerData.phone || "",
            document: "",
          }
        }

        // Endereço
        if (eventData.shipping || (eventData.customer_details && eventData.customer_details.address)) {
          const addressData =
            (eventData.shipping && eventData.shipping.address) ||
            (eventData.customer_details && eventData.customer_details.address) ||
            {}

          shipping = {
            street: addressData.line1 || "",
            number: "",
            complement: addressData.line2 || "",
            neighborhood: "",
            city: addressData.city || "",
            state: addressData.state || "",
            postalCode: addressData.postal_code || "",
            fullAddress: `${addressData.line1 || ""}, ${addressData.city || ""} - ${addressData.state || ""}, ${addressData.postal_code || ""}`,
          }
        }

        // Itens - Stripe não envia detalhes dos itens no webhook padrão
        items = [
          {
            name: "Pedido Stripe",
            quantity: 1,
            weight: 0.5,
          },
        ]

        totalWeight = 0.5
      } catch (e) {
        console.error("Erro ao processar dados do Stripe:", e)
      }
      break

    default:
      // Formato genérico ou desconhecido - tentar extrair dados comuns
      try {
        // Tentar diferentes caminhos para o ID do pedido
        orderId = dados.order_id || (dados.order && dados.order.id) || dados.id || `ORD-${Date.now()}`

        // Tentar diferentes caminhos para o status do pagamento
        paymentStatus = dados.payment_status || dados.status || (dados.payment && dados.payment.status) || "pending"

        // Cliente
        const customerData = dados.customer || dados.buyer || dados.client || dados.user || {}

        customer = {
          name: customerData.name || customerData.full_name || customerData.nome || "Cliente",
          email: customerData.email || "",
          phone:
            customerData.phone || customerData.telephone || customerData.telefone || customerData.phone_number || "",
          document:
            customerData.document || customerData.cpf || customerData.document_number || customerData.documento || "",
        }

        // Endereço
        const shippingData = dados.shipping_address || dados.shipping || dados.address || dados.endereco || {}

        const street =
          shippingData.street ||
          shippingData.address ||
          shippingData.address_line ||
          shippingData.rua ||
          shippingData.logradouro ||
          ""

        const number = shippingData.number || shippingData.address_number || shippingData.numero || ""

        const complement = shippingData.complement || shippingData.address_complement || shippingData.complemento || ""

        const neighborhood =
          shippingData.neighborhood ||
          shippingData.district ||
          shippingData.address_district ||
          shippingData.bairro ||
          ""

        const city = shippingData.city || shippingData.cidade || ""

        const state = shippingData.state || shippingData.uf || shippingData.estado || ""

        const postalCode =
          shippingData.postal_code || shippingData.zip_code || shippingData.zip || shippingData.cep || ""

        shipping = {
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
          postalCode,
          fullAddress: `${street}, ${number}${complement ? `, ${complement}` : ""}, ${neighborhood ? `${neighborhood}, ` : ""}${city} - ${state}, ${postalCode}`,
        }

        // Itens
        const itemsData = dados.items || dados.products || dados.order_items || dados.itens || []

        items = Array.isArray(itemsData)
          ? itemsData.map((item: any) => ({
              name: item.name || item.product_name || item.title || item.nome || "Produto",
              quantity: Number.parseInt(item.quantity || item.amount || item.quantidade || "1") || 1,
              weight: Number.parseFloat(item.weight || item.weight_in_kg || item.peso || "0.5") || 0.5,
            }))
          : [
              {
                name: "Produto",
                quantity: 1,
                weight: 0.5,
              },
            ]

        totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0)
      } catch (e) {
        console.error("Erro ao processar dados genéricos:", e)
      }
      break
  }

  return {
    orderId,
    paymentStatus,
    customer,
    shipping,
    items,
    totalWeight,
  }
}

// Função para verificar se o pagamento foi aprovado
function verificarStatusPagamento(status: string): boolean {
  // Lista de status que indicam pagamento aprovado em diferentes plataformas
  const statusAprovados = [
    "approved",
    "paid",
    "confirmed",
    "completed",
    "aprovado",
    "pago",
    "confirmado",
    "completo",
    "3",
    "4", // PagSeguro
    "succeeded", // Stripe
    "approved_or_pending_capture", // MercadoPago
    "success", // ZeroOnePay
    "completed", // ZeroOnePay
    "compra_aprovada", // ZeroOnePay formato customizado
  ]

  return statusAprovados.includes(status.toLowerCase())
}
