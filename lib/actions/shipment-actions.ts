"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Shipment } from "@/lib/types"

// Função para gerar um código de rastreio único
export async function generateTrackingCode(): Promise<string> {
  const prefix = "LOG-"
  const randomPart = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, "0")
  const suffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `${prefix}${randomPart}-${suffix}`
}

// Função para adicionar uma nova remessa
export async function addShipment(
  shipment: Omit<Shipment, "trackingCode">,
): Promise<{ success: boolean; data?: Shipment; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()
    const trackingCode = await generateTrackingCode()

    const newShipment: Shipment = {
      ...shipment,
      trackingCode,
    }

    const { error } = await supabase.from("shipments").insert([
      {
        tracking_code: newShipment.trackingCode,
        sender_name: newShipment.senderName,
        recipient_name: newShipment.recipientName,
        recipient_cpf: newShipment.recipientCpf,
        origin_address: newShipment.originAddress,
        destination_address: newShipment.destinationAddress,
        ship_date: newShipment.shipDate,
        status: newShipment.status,
        product_type: newShipment.productType,
        weight: newShipment.weight,
        customer_email: newShipment.customerEmail,
        customer_phone: newShipment.customerPhone,
        order_id: newShipment.orderId,
      },
    ])

    if (error) throw new Error(error.message)

    // Adicionar o primeiro registro no histórico de status
    await supabase.from("status_history").insert([
      {
        tracking_code: newShipment.trackingCode,
        status: newShipment.status,
        notes: "Remessa cadastrada no sistema",
      },
    ])

    // Enviar email de rastreio
    if (newShipment.customerEmail) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/send-tracking-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: newShipment.customerEmail,
            trackingCode: newShipment.trackingCode,
            recipientName: newShipment.recipientName,
            productType: newShipment.productType || "Pacote",
          }),
        })
      } catch (emailError) {
        console.error("Erro ao enviar email de rastreio:", emailError)
        // Não interrompe o fluxo se o email falhar
      }
    }

    revalidatePath("/admin/pedidos")
    return { success: true, data: newShipment }
  } catch (error) {
    console.error("Erro ao adicionar remessa:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

// Função para atualizar uma remessa existente
export async function updateShipment(shipment: Shipment): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from("shipments")
      .update({
        sender_name: shipment.senderName,
        recipient_name: shipment.recipientName,
        recipient_cpf: shipment.recipientCpf,
        origin_address: shipment.originAddress,
        destination_address: shipment.destinationAddress,
        ship_date: shipment.shipDate,
        status: shipment.status,
        product_type: shipment.productType,
        weight: shipment.weight,
        customer_email: shipment.customerEmail,
        customer_phone: shipment.customerPhone,
        order_id: shipment.orderId,
      })
      .eq("tracking_code", shipment.trackingCode)

    if (error) throw new Error(error.message)

    revalidatePath("/admin/pedidos")
    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar remessa:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

// Função para atualizar o status de uma remessa
export async function updateShipmentStatus(
  trackingCode: string,
  newStatus: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    // Atualizar o status na tabela de remessas
    const { error: updateError, data: updatedShipment } = await supabase
      .from("shipments")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("tracking_code", trackingCode)
      .select("*")
      .single()

    if (updateError) throw new Error(updateError.message)

    // Adicionar entrada no histórico de status
    const { error: historyError } = await supabase.from("status_history").insert([
      {
        tracking_code: trackingCode,
        status: newStatus,
        notes: `Status atualizado para: ${newStatus}`,
      },
    ])

    if (historyError) throw new Error(historyError.message)

    // Buscar histórico de status para incluir no email
    const { data: statusHistory } = await supabase
      .from("status_history")
      .select("*")
      .eq("tracking_code", trackingCode)
      .order("created_at", { ascending: true })

    // Enviar email de atualização de status
    if (updatedShipment && updatedShipment.customer_email) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/send-status-update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: updatedShipment.customer_email,
            trackingCode: trackingCode,
            recipientName: updatedShipment.recipient_name,
            newStatus: newStatus,
            statusHistory: statusHistory,
            updateDate: new Date().toLocaleString("pt-BR"),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Erro na resposta da API de envio de email:", errorData)
        }
      } catch (emailError) {
        console.error("Erro ao enviar email de atualização de status:", emailError)
        // Não interrompe o fluxo se o email falhar
      }
    }

    revalidatePath("/admin/pedidos")
    revalidatePath(`/rastreio`)
    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar status da remessa:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

// Função para buscar todas as remessas
export async function getAllShipments(): Promise<{ success: boolean; data?: Shipment[]; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("shipments").select("*").order("created_at", { ascending: false })

    if (error) throw new Error(error.message)

    const shipments: Shipment[] = data.map((item) => ({
      trackingCode: item.tracking_code,
      senderName: item.sender_name,
      recipientName: item.recipient_name,
      recipientCpf: item.recipient_cpf,
      originAddress: item.origin_address,
      destinationAddress: item.destination_address,
      shipDate: item.ship_date,
      status: item.status,
      productType: item.product_type,
      weight: item.weight,
      customerEmail: item.customer_email,
      customerPhone: item.customer_phone,
      orderId: item.order_id,
      prazoPersonalizado: item.prazo_personalizado,
    }))

    return { success: true, data: shipments }
  } catch (error) {
    console.error("Erro ao buscar remessas:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

// Função para buscar uma remessa pelo código de rastreio
export async function getShipmentByTrackingCode(
  trackingCode: string,
): Promise<{ success: boolean; data?: Shipment; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("shipments").select("*").eq("tracking_code", trackingCode).single()

    if (error) throw new Error(error.message)

    if (!data) {
      return { success: false, error: "Remessa não encontrada" }
    }

    const shipment: Shipment = {
      trackingCode: data.tracking_code,
      senderName: data.sender_name,
      recipientName: data.recipient_name,
      recipientCpf: data.recipient_cpf,
      originAddress: data.origin_address,
      destinationAddress: data.destination_address,
      shipDate: data.ship_date,
      status: data.status,
      productType: data.product_type,
      weight: data.weight,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      orderId: data.order_id,
      prazoPersonalizado: data.prazo_personalizado,
    }

    return { success: true, data: shipment }
  } catch (error) {
    console.error("Erro ao buscar remessa:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

// Função para excluir todas as remessas (apenas para testes)
export async function deleteAllShipments(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    // Primeiro, excluir todos os registros de histórico de status
    const { error: historyError } = await supabase.from("status_history").delete().neq("id", 0)

    if (historyError) throw new Error(historyError.message)

    // Em seguida, excluir todas as remessas
    const { error } = await supabase.from("shipments").delete().neq("tracking_code", "")

    if (error) throw new Error(error.message)

    revalidatePath("/admin/pedidos")
    return { success: true }
  } catch (error) {
    console.error("Erro ao excluir todas as remessas:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}
