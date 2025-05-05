import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { generateTrackingCode } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    // Obter dados do webhook do checkout
    const orderData = await req.json()

    // Validar dados recebidos
    if (!orderData || !orderData.customer || !orderData.shipping_address) {
      return NextResponse.json({ error: "Dados de pedido inválidos ou incompletos" }, { status: 400 })
    }

    // Extrair informações relevantes
    const { order_id, customer, shipping_address, items, payment_status, created_at } = orderData

    // Verificar se o pagamento foi aprovado
    if (payment_status !== "approved" && payment_status !== "paid") {
      return NextResponse.json({ message: "Pedido registrado, aguardando aprovação de pagamento" }, { status: 200 })
    }

    // Gerar código de rastreio
    const trackingCode = generateTrackingCode()

    // Calcular peso total (exemplo simples)
    const totalWeight = items.reduce((sum: number, item: any) => {
      return sum + (Number.parseFloat(item.weight) || 0.1) * (Number.parseInt(item.quantity) || 1)
    }, 0)

    // Formatar endereço completo
    const originAddress = "Seu endereço de origem padrão" // Defina o endereço de origem padrão
    const destinationAddress = `${shipping_address.street}, ${shipping_address.number}${
      shipping_address.complement ? `, ${shipping_address.complement}` : ""
    }, ${shipping_address.neighborhood}, ${shipping_address.city} - ${shipping_address.state}, ${shipping_address.postal_code}`

    // Criar objeto de remessa
    const shipment = {
      tracking_code: trackingCode,
      sender_name: "Sua Loja", // Nome da sua loja
      recipient_name: customer.name,
      recipient_cpf: customer.document || "",
      origin_address: originAddress,
      destination_address: destinationAddress,
      product_type: "Produto E-commerce",
      weight: totalWeight || 0.5,
      ship_date: new Date().toISOString().split("T")[0],
      status: "Objeto postado",
      order_id: order_id,
      customer_email: customer.email,
      customer_phone: customer.phone,
    }

    // Salvar no banco de dados
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.from("shipments").insert([shipment])

    if (error) {
      console.error("Erro ao salvar remessa:", error)
      return NextResponse.json({ error: "Erro ao criar remessa" }, { status: 500 })
    }

    // Adicionar ao histórico de status
    await supabase.from("status_history").insert([
      {
        tracking_code: trackingCode,
        status: "Objeto postado",
        notes: `Remessa criada automaticamente para o pedido ${order_id}`,
      },
    ])

    // Retornar código de rastreio
    return NextResponse.json({
      success: true,
      tracking_code: trackingCode,
      message: "Remessa criada com sucesso",
    })
  } catch (error) {
    console.error("Erro no webhook:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
