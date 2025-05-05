import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    // Extrair parâmetros da URL
    const url = new URL(req.url)
    const valor = url.searchParams.get("valor") || "100.00"
    const cliente = url.searchParams.get("cliente") || "Cliente Teste"
    const email = url.searchParams.get("email") || "cliente@teste.com"

    // Criar payload simulando dados de um pagamento PIX
    const pixData = {
      order_id: "PIX-" + Date.now(),
      payment_status: "approved",
      created_at: new Date().toISOString(),
      customer: {
        name: cliente,
        email: email,
        phone: "11999998888",
        document: "123.456.789-00",
      },
      shipping_address: {
        street: "Rua Teste",
        number: "123",
        complement: "Apto 45",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        postal_code: "01234-567",
      },
      items: [
        {
          name: "Produto via PIX",
          quantity: 1,
          weight: 0.5,
          price: Number.parseFloat(valor),
        },
      ],
    }

    // Enviar para o webhook
    const response = await fetch(`${url.origin}/api/webhook/whitelabel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pixData),
    })

    const result = await response.json()

    // Retornar resultado
    return NextResponse.json({
      success: true,
      message: "PIX simulado com sucesso!",
      tracking_code: result.tracking_code,
      details: result,
    })
  } catch (error) {
    console.error("Erro ao simular PIX:", error)
    return NextResponse.json({ error: "Erro ao simular pagamento PIX" }, { status: 500 })
  }
}
