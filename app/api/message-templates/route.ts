import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Tipo para os templates de mensagens
type MessageTemplate = {
  status: string
  whatsapp: string
  sms: string
}

type MessageTemplates = {
  templates: MessageTemplate[]
  defaultWhatsapp: string
  defaultSms: string
}

// Templates padrão
const defaultTemplates: MessageTemplates = {
  defaultWhatsapp: "Olá {nome}, sua encomenda {codigo} está com status: {status}. Acompanhe pelo nosso site.",
  defaultSms: "Sua encomenda {codigo} está {status}. Acompanhe: {link}",
  templates: [
    {
      status: "Objeto postado",
      whatsapp: "Olá {nome}, sua encomenda {codigo} foi postada e está a caminho. Acompanhe pelo nosso site.",
      sms: "Sua encomenda {codigo} foi postada. Acompanhe: {link}",
    },
    {
      status: "Em processo de triagem",
      whatsapp: "Olá {nome}, sua encomenda {codigo} está em triagem. Acompanhe pelo nosso site.",
      sms: "Sua encomenda {codigo} está em triagem. Acompanhe: {link}",
    },
    {
      status: "Em trânsito para o centro de distribuição",
      whatsapp: "Olá {nome}, sua encomenda {codigo} está em trânsito. Acompanhe pelo nosso site.",
      sms: "Sua encomenda {codigo} está em trânsito. Acompanhe: {link}",
    },
    {
      status: "No centro de distribuição",
      whatsapp: "Olá {nome}, sua encomenda {codigo} chegou ao centro de distribuição. Acompanhe pelo nosso site.",
      sms: "Sua encomenda {codigo} está no centro de distribuição. Acompanhe: {link}",
    },
    {
      status: "Em rota de entrega",
      whatsapp: "Olá {nome}, sua encomenda {codigo} está em rota de entrega. Acompanhe pelo nosso site.",
      sms: "Sua encomenda {codigo} está em rota de entrega. Acompanhe: {link}",
    },
    {
      status: "Entregue com sucesso",
      whatsapp: "Olá {nome}, sua encomenda {codigo} foi entregue com sucesso! Obrigado por escolher nossos serviços.",
      sms: "Sua encomenda {codigo} foi entregue. Obrigado!",
    },
  ],
}

export async function GET() {
  try {
    const supabase = createClient()

    // Verificar se a tabela existe diretamente tentando acessá-la
    console.log("Verificando se a tabela system_settings existe...")

    try {
      const { data, error } = await supabase.from("system_settings").select("*").eq("key", "message_templates").single()

      if (error) {
        console.error("Erro ao buscar templates:", error)
        return NextResponse.json(defaultTemplates)
      }

      console.log("Templates encontrados:", data)
      return NextResponse.json(data?.value || defaultTemplates)
    } catch (error) {
      console.error("Erro ao buscar templates:", error)
      return NextResponse.json(defaultTemplates)
    }
  } catch (error) {
    console.error("Erro ao buscar templates:", error)
    return NextResponse.json(defaultTemplates)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const templates: MessageTemplates = await request.json()

    console.log("Salvando templates:", templates)

    // Tentar salvar diretamente na tabela
    try {
      const { data, error } = await supabase.from("system_settings").upsert(
        {
          key: "message_templates",
          value: templates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      )

      if (error) {
        console.error("Erro ao salvar templates:", error)
        return NextResponse.json(
          {
            success: false,
            message: `Erro ao salvar templates: ${error.message}`,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "Templates salvos com sucesso",
      })
    } catch (error) {
      console.error("Erro ao salvar templates:", error)
      return NextResponse.json(
        {
          success: false,
          message: `Erro ao salvar templates: ${error instanceof Error ? error.message : String(error)}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Erro ao salvar templates:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao salvar templates: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
