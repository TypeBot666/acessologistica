import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Tente buscar os templates do banco de dados
    const { data, error } = await supabase.from("email_templates").select("*").limit(1).single()

    // Se não houver templates ou ocorrer um erro, retorne os templates padrão
    if (error || !data) {
      // Templates padrão
      const defaultTemplates = {
        tracking: `
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
</div>`,
        statusUpdate: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
<div style="text-align: center; padding: 10px; background-color: #f8f8f8; margin-bottom: 20px;">
  <h1 style="color: #e53e3e; margin: 0;">Atualização de Status</h1>
</div>

<p>Olá {{recipientName}},</p>

<p>O status da sua remessa foi atualizado:</p>

<div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
  <p><strong>Código de Rastreio:</strong> {{trackingCode}}</p>
  <p><strong>Novo Status:</strong> {{newStatus}}</p>
  <p><strong>Data da Atualização:</strong> {{updateDate}}</p>
</div>

<!-- Timeline do Status -->
<div style="margin: 30px 0;">
  <h3 style="color: #333; margin-bottom: 15px;">Progresso da sua entrega:</h3>
  
  <div style="position: relative; padding-left: 30px;">
    <!-- Linha vertical da timeline -->
    <div style="position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background-color: #e0e0e0;"></div>
    
    {{timelineSteps}}
  </div>
</div>

<p>Você pode acompanhar sua remessa a qualquer momento clicando no botão abaixo:</p>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{trackingUrl}}" style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">RASTREAR MINHA REMESSA</a>
</div>

<p>Ou copie e cole este link no seu navegador:</p>
<p style="word-break: break-all; color: #3182ce;">{{trackingUrl}}</p>

<hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">

<p style="font-size: 12px; color: #666;">Este é um email automático. Por favor, não responda a esta mensagem.</p>
</div>`,
      }

      return NextResponse.json(defaultTemplates)
    }

    return NextResponse.json({
      tracking: data.tracking_template || "",
      statusUpdate: data.status_update_template || "",
    })
  } catch (error) {
    console.error("Erro ao buscar templates de email:", error)
    return NextResponse.json({ error: "Erro ao buscar templates de email" }, { status: 500 })
  }
}
