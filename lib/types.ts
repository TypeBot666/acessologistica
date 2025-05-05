export interface Shipment {
  trackingCode: string
  senderName: string
  recipientName: string
  recipientCpf: string
  originAddress: string
  destinationAddress: string
  productType: string
  weight: string | number
  shipDate: string
  status: ShipmentStatus
  orderId?: string
  customerEmail?: string
  customerPhone?: string
}

export type ShipmentStatus =
  | "Postado"
  | "Em triagem"
  | "Em trânsito"
  | "No centro"
  | "Em rota"
  | "Entregue"
  | "Destinatário ausente"
  | "Devolvido"
  | "Aguardando retirada"
  | string // Adicionado para permitir status personalizados

export interface StatusHistory {
  id: number
  tracking_code: string
  status: string
  notes: string | null
  created_at: string
}

export type AutomationStep = {
  status: string
  days: number
  emailTime: string
  notificationChannels?: {
    email: boolean
  }
}

export type AutomationSettings = {
  enabled: boolean
  steps: AutomationStep[]
  finalStatus: string
  emailNotifications: boolean
  executionTime: string
  lastExecution: string | null
  lastExecutionSuccess?: boolean
  lastExecutionCount?: number
}

export interface Database {
  public: {
    Tables: {
      shipments: {
        Row: {
          tracking_code: string
          sender_name: string
          recipient_name: string
          recipient_cpf: string
          origin_address: string
          destination_address: string
          product_type: string
          weight: number
          ship_date: string
          status: string
          created_at: string
          updated_at: string
          order_id?: string
          customer_email?: string
          customer_phone?: string
        }
        Insert: {
          tracking_code: string
          sender_name: string
          recipient_name: string
          recipient_cpf: string
          origin_address: string
          destination_address: string
          product_type: string
          weight: number
          ship_date: string
          status: string
          created_at?: string
          updated_at?: string
          order_id?: string
          customer_email?: string
          customer_phone?: string
        }
        Update: {
          tracking_code?: string
          sender_name?: string
          recipient_name?: string
          recipient_cpf?: string
          origin_address?: string
          destination_address?: string
          product_type?: string
          weight?: number
          ship_date?: string
          status?: string
          created_at?: string
          updated_at?: string
          order_id?: string
          customer_email?: string
          customer_phone?: string
        }
      }
      status_history: {
        Row: {
          id: number
          tracking_code: string
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: number
          tracking_code: string
          status: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          tracking_code?: string
          status?: string
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}
