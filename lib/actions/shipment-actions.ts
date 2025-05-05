"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Shipment } from "@/lib/types"

export async function getShipments() {
  const supabase = createServerSupabaseClient()
  console.log("Buscando remessas do servidor...")

  try {
    const { data, error } = await supabase.from("shipments").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar remessas:", error)
      throw new Error(`Falha ao buscar remessas: ${error.message}`)
    }

    console.log(`Remessas encontradas: ${data?.length || 0}`)
    return data.map(formatShipmentFromDB)
  } catch (error) {
    console.error("Erro não tratado ao buscar remessas:", error)
    throw new Error("Falha ao buscar remessas. Verifique a conexão com o banco de dados.")
  }
}

export async function getShipmentByTrackingCode(trackingCode: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from("shipments").select("*").eq("tracking_code", trackingCode).single()

    if (error) {
      console.error("Erro ao buscar remessa:", error)
      return null
    }

    return formatShipmentFromDB(data)
  } catch (error) {
    console.error("Erro não tratado ao buscar remessa por código:", error)
    return null
  }
}

export async function getShipmentByCpf(cpf: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("recipient_cpf", cpf)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("Erro ao buscar remessa por CPF:", error)
      return null
    }

    return formatShipmentFromDB(data)
  } catch (error) {
    console.error("Erro não tratado ao buscar remessa por CPF:", error)
    return null
  }
}

export async function createShipment(shipment: Shipment) {
  const supabase = createServerSupabaseClient()

  try {
    // Converter para o formato do banco de dados
    const dbShipment = {
      tracking_code: shipment.trackingCode,
      sender_name: shipment.senderName,
      recipient_name: shipment.recipientName,
      recipient_cpf: shipment.recipientCpf,
      origin_address: shipment.originAddress,
      destination_address: shipment.destinationAddress,
      product_type: shipment.productType,
      weight: Number(shipment.weight),
      ship_date: shipment.shipDate,
      status: shipment.status,
    }

    console.log("Enviando para o Supabase:", dbShipment)

    const { error } = await supabase.from("shipments").insert([dbShipment])

    if (error) {
      console.error("Erro ao criar remessa:", error)
      throw new Error(`Falha ao criar remessa: ${error.message}`)
    }

    // Adicionar ao histórico de status
    await supabase.from("status_history").insert([
      {
        tracking_code: shipment.trackingCode,
        status: shipment.status,
        notes: "Remessa cadastrada",
      },
    ])

    return shipment
  } catch (error: any) {
    console.error("Erro não tratado ao criar remessa:", error)
    throw new Error(`Falha ao criar remessa: ${error.message || "Erro desconhecido"}`)
  }
}

export async function updateShipment(shipment: Shipment) {
  const supabase = createServerSupabaseClient()

  try {
    const dbShipment = {
      sender_name: shipment.senderName,
      recipient_name: shipment.recipientName,
      recipient_cpf: shipment.recipientCpf,
      origin_address: shipment.originAddress,
      destination_address: shipment.destinationAddress,
      product_type: shipment.productType,
      weight: Number(shipment.weight),
      ship_date: shipment.shipDate,
      status: shipment.status,
    }

    const { error } = await supabase.from("shipments").update(dbShipment).eq("tracking_code", shipment.trackingCode)

    if (error) {
      console.error("Erro ao atualizar remessa:", error)
      throw new Error(`Falha ao atualizar remessa: ${error.message}`)
    }

    return shipment
  } catch (error: any) {
    console.error("Erro não tratado ao atualizar remessa:", error)
    throw new Error(`Falha ao atualizar remessa: ${error.message || "Erro desconhecido"}`)
  }
}

export async function updateShipmentStatus(trackingCode: string, status: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { error } = await supabase.from("shipments").update({ status }).eq("tracking_code", trackingCode)

    if (error) {
      console.error("Erro ao atualizar status da remessa:", error)
      throw new Error(`Falha ao atualizar status da remessa: ${error.message}`)
    }

    // Add to status history
    await supabase.from("status_history").insert([
      {
        tracking_code: trackingCode,
        status,
        notes: `Status atualizado para ${status}`,
      },
    ])

    return { trackingCode, status }
  } catch (error: any) {
    console.error("Erro não tratado ao atualizar status:", error)
    throw new Error(`Falha ao atualizar status: ${error.message || "Erro desconhecido"}`)
  }
}

// Helper functions to convert between frontend and database formats
function formatShipmentForDB(shipment: Shipment) {
  return {
    tracking_code: shipment.trackingCode,
    sender_name: shipment.senderName,
    recipient_name: shipment.recipientName,
    recipient_cpf: shipment.recipientCpf,
    origin_address: shipment.originAddress,
    destination_address: shipment.destinationAddress,
    product_type: shipment.productType,
    weight: Number(shipment.weight),
    ship_date: shipment.shipDate,
    status: shipment.status,
  }
}

function formatShipmentFromDB(data: any): Shipment {
  return {
    trackingCode: data.tracking_code,
    senderName: data.sender_name,
    recipientName: data.recipient_name,
    recipientCpf: data.recipient_cpf,
    originAddress: data.origin_address,
    destinationAddress: data.destination_address,
    productType: data.product_type,
    weight: data.weight,
    shipDate: data.ship_date,
    status: data.status as "Aguardando" | "Em trânsito" | "Entregue",
  }
}
