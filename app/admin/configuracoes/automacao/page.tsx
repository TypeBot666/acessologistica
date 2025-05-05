"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Save } from "lucide-react"

import type React from "react"

import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

type AutomationStep = {
  status: string
  days: number
  emailTime?: string
  notificationChannels?: {
    email: boolean
    whatsapp: boolean
    sms: boolean
  }
}

type AutomationSettings = {
  enabled: boolean
  steps: AutomationStep[]
  finalStatus: string
  emailNotifications: boolean
  whatsappNotifications: boolean
  smsNotifications: boolean
  executionTime: string
  lastExecution: string | null
}

type OneFunnelSettings = {
  apiKey: string
  sender: string
  enabled: boolean
}

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

export default function AutomacaoPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("whatsapp")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tableExists, setTableExists] = useState(true)
  const [ignoreTableCheck, setIgnoreTableCheck] = useState(false)
  const [settings, setSettings] = useState<AutomationSettings>({
    enabled: true,
    steps: [],
    finalStatus: "Entregue com sucesso",
    emailNotifications: true,
    whatsappNotifications: false,
    smsNotifications: false,
    executionTime: "08:00",
    lastExecution: null,
  })
  const [onefunnelSettings, setOnefunnelSettings] = useState<OneFunnelSettings>({
    apiKey: "",
    sender: "",
    enabled: false,
  })
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplates>({
    templates: [],
    defaultWhatsapp: "Olá {nome}, sua encomenda {codigo} está com status: {status}. Acompanhe pelo nosso site.",
    defaultSms: "Sua encomenda {codigo} está {status}. Acompanhe: {link}",
  })
  const [testMessage, setTestMessage] = useState({
    phone: "",
    message: "Teste de mensagem do sistema de logística",
    channel: "whatsapp",
    isSending: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [lastRunStatus, setLastRunStatus] = useState<{
    date: string | null
    success: boolean
    count: number
  }>({
    date: null,
    success: false,
    count: 0,
  })

  // Lista de todos os status possíveis
  const allStatuses = [
    "Objeto postado",
    "Em processo de triagem",
    "Em trânsito para o centro de distribuição",
    "No centro de distribuição",
    "Em rota de entrega",
    "Entregue com sucesso",
    "Entrega não realizada – destinatário ausente",
    "Objeto devolvido ao remetente",
    "Aguardando retirada em unidade",
  ]

  // Lista de variáveis disponíveis para templates
  const availableVariables = [
    { name: "{nome}", description: "Nome do destinatário" },
    { name: "{codigo}", description: "Código de rastreio" },
    { name: "{status}", description: "Status atual da encomenda" },
    { name: "{data}", description: "Data da atualização" },
    { name: "{origem}", description: "Endereço de origem" },
    { name: "{destino}", description: "Endereço de destino" },
    { name: "{link}", description: "Link para rastreamento" },
  ]

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin-auth")
    if (isAuthenticated !== "true") {
      router.push("/admin")
      return
    }

    // Verificar se o usuário já ignorou a verificação da tabela
    const ignored = localStorage.getItem("ignore-table-check") === "true"
    setIgnoreTableCheck(ignored)

    // Verificar e criar tabela se necessário
    checkDatabaseConnection()

    // Buscar configurações
    fetchSettings()
    fetchOneFunnelSettings()
    fetchMessageTemplates()
  }, [router])

  const checkDatabaseConnection = async () => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/check-database-connection?t=${timestamp}`)
      const data = await response.json()

      setTableExists(data.connected)

      if (data.created) {
        toast({
          title: "Tabela criada",
          description: "A tabela system_settings foi criada automaticamente.",
          variant: "success",
        })
      }
    } catch (error) {
      console.error("Erro ao verificar conexão com o banco de dados:", error)
      setWarning("Não foi possível verificar a conexão com o banco de dados.")
      setTableExists(false)
    }
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      setWarning(null)

      // Buscar configurações
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/automation-settings?t=${timestamp}`)
      const data = await response.json()

      // Verificar se os dados estão no formato esperado
      if (data && data.enabled !== undefined && Array.isArray(data.steps)) {
        // Garantir que temos todos os campos necessários
        const updatedSteps = data.steps.map((step: AutomationStep) => ({
          ...step,
          emailTime: step.emailTime || "08:00", // Valor padrão para horário do email
          notificationChannels: step.notificationChannels || {
            email: true,
            whatsapp: false,
            sms: false,
          },
        }))

        setSettings({
          ...data,
          steps: updatedSteps,
          emailNotifications: data.emailNotifications !== undefined ? data.emailNotifications : true,
          whatsappNotifications: data.whatsappNotifications !== undefined ? data.whatsappNotifications : false,
          smsNotifications: data.smsNotifications !== undefined ? data.smsNotifications : false,
          executionTime: data.executionTime || "08:00",
          lastExecution: data.lastExecution || null,
        })

        // Atualizar status da última execução
        if (data.lastExecution) {
          setLastRunStatus({
            date: data.lastExecution,
            success: data.lastExecutionSuccess || false,
            count: data.lastExecutionCount || 0,
          })
        }
      } else {
        console.warn("Formato de dados inesperado:", data)
        // Usar configurações padrão
        setSettings({
          enabled: true,
          steps: [
            {
              status: "Objeto postado",
              days: 0,
              emailTime: "08:00",
              notificationChannels: {
                email: true,
                whatsapp: false,
                sms: false,
              },
            },
            {
              status: "Em processo de triagem",
              days: 1,
              emailTime: "09:00",
              notificationChannels: {
                email: true,
                whatsapp: false,
                sms: false,
              },
            },
            {
              status: "Em trânsito para o centro de distribuição",
              days: 3,
              emailTime: "10:00",
              notificationChannels: {
                email: true,
                whatsapp: false,
                sms: false,
              },
            },
            {
              status: "No centro de distribuição",
              days: 5,
              emailTime: "11:00",
              notificationChannels: {
                email: true,
                whatsapp: false,
                sms: false,
              },
            },
            {
              status: "Em rota de entrega",
              days: 7,
              emailTime: "12:00",
              notificationChannels: {
                email: true,
                whatsapp: false,
                sms: false,
              },
            },
            {
              status: "Entregue com sucesso",
              days: 8,
              emailTime: "13:00",
              notificationChannels: {
                email: true,
                whatsapp: false,
                sms: false,
              },
            },
          ],
          finalStatus: "Entregue com sucesso",
          emailNotifications: true,
          whatsappNotifications: false,
          smsNotifications: false,
          executionTime: "08:00",
          lastExecution: null,
        })
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
      setError("Não foi possível carregar as configurações de automação")
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de automação",
        variant: "destructive",
      })

      // Usar configurações padrão em caso de erro
      setSettings({
        enabled: true,
        steps: [
          {
            status: "Objeto postado",
            days: 0,
            emailTime: "08:00",
            notificationChannels: {
              email: true,
              whatsapp: false,
              sms: false,
            },
          },
          {
            status: "Em processo de triagem",
            days: 1,
            emailTime: "09:00",
            notificationChannels: {
              email: true,
              whatsapp: false,
              sms: false,
            },
          },
          {
            status: "Em trânsito para o centro de distribuição",
            days: 3,
            emailTime: "10:00",
            notificationChannels: {
              email: true,
              whatsapp: false,
              sms: false,
            },
          },
          {
            status: "No centro de distribuição",
            days: 5,
            emailTime: "11:00",
            notificationChannels: {
              email: true,
              whatsapp: false,
              sms: false,
            },
          },
          {
            status: "Em rota de entrega",
            days: 7,
            emailTime: "12:00",
            notificationChannels: {
              email: true,
              whatsapp: false,
              sms: false,
            },
          },
          {
            status: "Entregue com sucesso",
            days: 8,
            emailTime: "13:00",
            notificationChannels: {
              email: true,
              whatsapp: false,
              sms: false,
            },
          },
        ],
        finalStatus: "Entregue com sucesso",
        emailNotifications: true,
        whatsappNotifications: false,
        smsNotifications: false,
        executionTime: "08:00",
        lastExecution: null,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchOneFunnelSettings = async () => {
    try {
      const response = await fetch("/api/integrations/onefunnel")
      const data = await response.json()

      if (data && !data.error) {
        setOnefunnelSettings(data)
      }
    } catch (error) {
      console.error("Erro ao buscar configurações da OneFunnel:", error)
    }
  }

  const fetchMessageTemplates = async () => {
    try {
      const response = await fetch("/api/message-templates")
      const data = await response.json()

      if (data && !data.error) {
        setMessageTemplates(data)
      } else {
        // Inicializar templates para cada status
        const initialTemplates = allStatuses.map((status) => ({
          status,
          whatsapp: messageTemplates.defaultWhatsapp,
          sms: messageTemplates.defaultSms,
        }))

        setMessageTemplates({
          ...messageTemplates,
          templates: initialTemplates,
        })
      }
    } catch (error) {
      console.error("Erro ao buscar templates de mensagens:", error)
      // Inicializar templates para cada status
      const initialTemplates = allStatuses.map((status) => ({
        status,
        whatsapp: messageTemplates.defaultWhatsapp,
        sms: messageTemplates.defaultSms,
      }))

      setMessageTemplates({
        ...messageTemplates,
        templates: initialTemplates,
      })
    }
  }

  const handleLogout = () => {
    // Implementar lógica de logout aqui
    window.location.href = "/"
  }

  const handleToggleEnabled = (checked: boolean) => {
    setSettings({ ...settings, enabled: checked })
  }

  const handleToggleEmailNotifications = (checked: boolean) => {
    setSettings({ ...settings, emailNotifications: checked })
  }

  const handleToggleWhatsAppNotifications = (checked: boolean) => {
    setSettings({ ...settings, whatsappNotifications: checked })
  }

  const handleToggleSMSNotifications = (checked: boolean) => {
    setSettings({ ...settings, smsNotifications: checked })
  }

  const handleAddStep = () => {
    const newStep = {
      status: allStatuses[0],
      days: settings.steps.length > 0 ? settings.steps[settings.steps.length - 1].days + 1 : 0,
      emailTime: "08:00", // Horário padrão para novos passos
      notificationChannels: {
        email: settings.emailNotifications,
        whatsapp: settings.whatsappNotifications,
        sms: settings.smsNotifications,
      },
    }
    setSettings({ ...settings, steps: [...settings.steps, newStep] })
  }

  const handleRemoveStep = (index: number) => {
    const newSteps = [...settings.steps]
    newSteps.splice(index, 1)
    setSettings({ ...settings, steps: newSteps })
  }

  const handleChangeStatus = (index: number, value: string) => {
    const newSteps = [...settings.steps]
    newSteps[index].status = value
    setSettings({ ...settings, steps: newSteps })
  }

  const handleChangeDays = (index: number, value: string) => {
    const days = Number.parseInt(value, 10) || 0
    const newSteps = [...settings.steps]
    newSteps[index].days = days
    setSettings({ ...settings, steps: newSteps })
  }

  const handleChangeEmailTime = (index: number, value: string) => {
    const newSteps = [...settings.steps]
    newSteps[index].emailTime = value
    setSettings({ ...settings, steps: newSteps })
  }

  const handleToggleStepChannel = (index: number, channel: "email" | "whatsapp" | "sms", checked: boolean) => {
    const newSteps = [...settings.steps]
    if (!newSteps[index].notificationChannels) {
      newSteps[index].notificationChannels = {
        email: true,
        whatsapp: false,
        sms: false,
      }
    }
    newSteps[index].notificationChannels[channel] = checked
    setSettings({ ...settings, steps: newSteps })
  }

  const handleChangeFinalStatus = (value: string) => {
    setSettings({ ...settings, finalStatus: value })
  }

  const handleChangeExecutionTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, executionTime: e.target.value })
  }

  const handleChangeMessageTemplate = (status: string, type: "whatsapp" | "sms", value: string) => {
    const newTemplates = [...messageTemplates.templates]
    const templateIndex = newTemplates.findIndex((template) => template.status === status)

    if (templateIndex !== -1) {
      newTemplates[templateIndex] = {
        ...newTemplates[templateIndex],
        [type]: value,
      }
    } else {
      newTemplates.push({
        status,
        whatsapp: type === "whatsapp" ? value : messageTemplates.defaultWhatsapp,
        sms: type === "sms" ? value : messageTemplates.defaultSms,
      })
    }

    setMessageTemplates({
      ...messageTemplates,
      templates: newTemplates,
    })
  }

  const handleChangeDefaultTemplate = (type: "defaultWhatsapp" | "defaultSms", value: string) => {
    setMessageTemplates({
      ...messageTemplates,
      [type]: value,
    })
  }

  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable)
    toast({
      title: "Variável copiada",
      description: `A variável ${variable} foi copiada para a área de transferência.`,
    })
  }

  const navigateToMigration = () => {
    router.push("/admin/integracoes/migracao-banco")
  }

  const handleIgnoreTableCheck = () => {
    setIgnoreTableCheck(true)
    setTableExists(true)
    localStorage.setItem("ignore-table-check", "true")
    toast({
      title: "Verificação ignorada",
      description: "A verificação da tabela será ignorada. As configurações serão salvas normalmente.",
    })
  }

  const handleFixPermissions = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch("/api/fix-permissions")
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Permissões corrigidas com sucesso. Recarregando configurações...",
        })

        // Recarregar configurações
        await fetchSettings()
      } else {
        setError(result.message || "Não foi possível corrigir as permissões")
        toast({
          title: "Erro",
          description: result.message || "Não foi possível corrigir as permissões",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao corrigir permissões:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao corrigir permissões"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setError(null)

      // Garantir que os dias sejam números antes de enviar
      const preparedSettings = {
        ...settings,
        steps: settings.steps.map((step) => ({
          status: step.status,
          days: Number(step.days),
          emailTime: step.emailTime || "08:00",
          notificationChannels: step.notificationChannels || {
            email: settings.emailNotifications,
            whatsapp: settings.whatsappNotifications,
            sms: settings.smsNotifications,
          },
        })),
      }

      console.log("Enviando configurações:", JSON.stringify(preparedSettings, null, 2))

      const response = await fetch("/api/automation-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preparedSettings),
      })

      const result = await response.json()

      if (result.success === false) {
        setWarning(result.message || "As configurações foram salvas temporariamente, mas não no banco de dados.")
        toast({
          title: "Atenção",
          description: result.message || "As configurações foram salvas temporariamente, mas não no banco de dados.",
          variant: "warning",
        })
      } else {
        toast({
          title: "Configurações salvas",
          description: "As configurações de automação foram atualizadas com sucesso",
        })

        // Atualizar a tabela de configurações de automação para relatórios
        await updateAutomationSettingsForReports(preparedSettings.steps)
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar configurações"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveOneFunnelSettings = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch("/api/integrations/onefunnel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(onefunnelSettings),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Configurações salvas",
          description: "As configurações da OneFunnel foram atualizadas com sucesso",
        })
      } else {
        setError(result.message || "Não foi possível salvar as configurações da OneFunnel")
        toast({
          title: "Erro",
          description: result.message || "Não foi possível salvar as configurações da OneFunnel",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar configurações da OneFunnel:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar configurações"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMessageTemplates = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch("/api/message-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageTemplates),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Templates salvos",
          description: "Os templates de mensagens foram atualizados com sucesso",
        })
      } else {
        setError(result.message || "Não foi possível salvar os templates de mensagens")
        toast({
          title: "Erro",
          description: result.message || "Não foi possível salvar os templates de mensagens",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar templates de mensagens:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar templates"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestMessage = async () => {
    try {
      setTestMessage({ ...testMessage, isSending: true })

      const response = await fetch("/api/integrations/test-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: testMessage.channel,
          phone: testMessage.phone,
          message: testMessage.message,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Mensagem enviada",
          description: `A mensagem de teste foi enviada com sucesso via ${testMessage.channel === "whatsapp" ? "WhatsApp" : "SMS"}`,
        })
      } else {
        console.error("Erro ao enviar mensagem:", result)
        toast({
          title: "Erro",
          description:
            result.error ||
            `Não foi possível enviar a mensagem via ${testMessage.channel === "whatsapp" ? "WhatsApp" : "SMS"}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem de teste:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao enviar mensagem de teste"
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setTestMessage({ ...testMessage, isSending: false })
    }
  }

  const updateAutomationSettingsForReports = async (steps: AutomationStep[]) => {
    try {
      const response = await fetch("/api/automation-settings/update-for-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ steps }),
      })

      const result = await response.json()

      if (!result.success) {
        console.error("Erro ao atualizar configurações para relatórios:", result.message)
      }
    } catch (error) {
      console.error("Erro ao atualizar configurações para relatórios:", error)
    }
  }

  const handleCreateTable = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch("/api/database-migration", {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Tabela criada com sucesso. Recarregando configurações...",
        })

        // Recarregar configurações
        await fetchSettings()
      } else {
        setError(result.message || "Não foi possível criar a tabela")
        toast({
          title: "Erro",
          description: result.message || "Não foi possível criar a tabela",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar tabela:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar tabela"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Automação e Notificações</h1>

            <Tabs defaultValue="whatsapp" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="whatsapp">WhatsApp (Z-API)</TabsTrigger>
                <TabsTrigger value="sms">SMS (OneFunnel)</TabsTrigger>
                <TabsTrigger value="templates">Templates de Mensagens</TabsTrigger>
                <TabsTrigger value="automacao">Automação</TabsTrigger>
              </TabsList>

              <TabsContent value="whatsapp">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações do WhatsApp (Z-API)</CardTitle>
                    <CardDescription>
                      Configure a integração com a Z-API para envio de mensagens via WhatsApp
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      Para configurar a integração com o WhatsApp, acesse a{" "}
                      <a href="/admin/configuracoes/automacao/whatsapp" className="text-blue-600 hover:underline">
                        página de configuração do WhatsApp
                      </a>
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sms">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de SMS (OneFunnel)</CardTitle>
                    <CardDescription>Configure a integração com a OneFunnel para envio de SMS</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Ativar integração</h3>
                          <p className="text-sm text-gray-500">Habilitar envio de SMS via OneFunnel</p>
                        </div>
                        <Switch id="sms-enabled" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sms-token">Token da API</Label>
                        <Input id="sms-token" type="password" placeholder="Token da API OneFunnel" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sms-sender">ID do Remetente</Label>
                        <Input id="sms-sender" placeholder="ID do remetente (opcional)" />
                      </div>

                      <Button className="w-full">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Configurações
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="templates">
                <Card>
                  <CardHeader>
                    <CardTitle>Templates de Mensagens</CardTitle>
                    <CardDescription>Configure os templates de mensagens para envio automático</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="template-pedido-confirmado">Pedido Confirmado</Label>
                        <Textarea
                          id="template-pedido-confirmado"
                          placeholder="Template para pedido confirmado"
                          rows={4}
                          defaultValue="Olá {nome}, seu pedido #{numero_pedido} foi confirmado e está sendo processado. Acompanhe pelo link: {link_rastreio}"
                        />
                        <p className="text-xs text-gray-500">
                          Variáveis disponíveis: {"{nome}"}, {"{numero_pedido}"}, {"{link_rastreio}"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template-em-transito">Em Trânsito</Label>
                        <Textarea
                          id="template-em-transito"
                          placeholder="Template para pedido em trânsito"
                          rows={4}
                          defaultValue="Olá {nome}, seu pedido #{numero_pedido} está em trânsito! Acompanhe pelo link: {link_rastreio}"
                        />
                        <p className="text-xs text-gray-500">
                          Variáveis disponíveis: {"{nome}"}, {"{numero_pedido}"}, {"{link_rastreio}"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template-entregue">Entregue</Label>
                        <Textarea
                          id="template-entregue"
                          placeholder="Template para pedido entregue"
                          rows={4}
                          defaultValue="Olá {nome}, seu pedido #{numero_pedido} foi entregue! Agradecemos pela preferência."
                        />
                        <p className="text-xs text-gray-500">
                          Variáveis disponíveis: {"{nome}"}, {"{numero_pedido}"}
                        </p>
                      </div>

                      <Button className="w-full">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Templates
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="automacao">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de Automação</CardTitle>
                    <CardDescription>Configure as regras de automação para envio de notificações</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Automação de Pedido Confirmado</h3>
                          <p className="text-sm text-gray-500">Enviar notificação quando um pedido for confirmado</p>
                        </div>
                        <Switch id="auto-pedido-confirmado" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Automação de Em Trânsito</h3>
                          <p className="text-sm text-gray-500">
                            Enviar notificação quando um pedido entrar em trânsito
                          </p>
                        </div>
                        <Switch id="auto-em-transito" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Automação de Entregue</h3>
                          <p className="text-sm text-gray-500">Enviar notificação quando um pedido for entregue</p>
                        </div>
                        <Switch id="auto-entregue" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Canal Preferencial</h3>
                          <p className="text-sm text-gray-500">
                            Escolha o canal preferencial para envio de notificações
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="canal-whatsapp" className="cursor-pointer">
                            <input
                              type="radio"
                              id="canal-whatsapp"
                              name="canal"
                              value="whatsapp"
                              className="mr-1"
                              defaultChecked
                            />
                            WhatsApp
                          </Label>
                          <Label htmlFor="canal-sms" className="cursor-pointer">
                            <input type="radio" id="canal-sms" name="canal" value="sms" className="mr-1" />
                            SMS
                          </Label>
                          <Label htmlFor="canal-email" className="cursor-pointer">
                            <input type="radio" id="canal-email" name="canal" value="email" className="mr-1" />
                            Email
                          </Label>
                        </div>
                      </div>

                      <Button className="w-full">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Configurações
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
