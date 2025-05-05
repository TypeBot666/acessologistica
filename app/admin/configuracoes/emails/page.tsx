"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, ArrowLeft, Eye } from "lucide-react"

export default function EmailTemplatesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [templates, setTemplates] = useState({
    tracking: "",
    statusUpdate: "",
  })
  const [previewMode, setPreviewMode] = useState(false)

  // Dados de exemplo para visualização
  const previewData = {
    recipientName: "João Silva",
    trackingCode: "BR123456789XX",
    productType: "Eletrônicos",
    trackingUrl: "https://v0-logistica-site-design.vercel.app/rastreio?codigo=BR123456789XX",
    newStatus: "Em trânsito para o centro de distribuição",
    updateDate: new Date().toLocaleString("pt-BR"),
    timelineSteps: `
    <div style="position: relative; margin-bottom: 15px;">
      <!-- Círculo da timeline -->
      <div style="position: absolute; left: -20px; width: 16px; height: 16px; border-radius: 50%; background-color: #e53e3e; transform: translateX(-50%);"></div>
      
      <!-- Conteúdo do passo -->
      <div style="margin-left: 10px;">
        <p style="margin: 0; font-weight: bold;">Objeto postado</p>
        <p style="margin: 0; font-size: 12px; color: #666;">01/05/2023 - 14:30</p>
      </div>
    </div>
    
    <div style="position: relative; margin-bottom: 15px;">
      <!-- Círculo da timeline -->
      <div style="position: absolute; left: -20px; width: 16px; height: 16px; border-radius: 50%; background-color: #e53e3e; transform: translateX(-50%);"></div>
      
      <!-- Conteúdo do passo -->
      <div style="margin-left: 10px;">
        <p style="margin: 0; font-weight: bold;">Em processo de triagem</p>
        <p style="margin: 0; font-size: 12px; color: #666;">02/05/2023 - 09:15</p>
      </div>
    </div>
    
    <div style="position: relative; margin-bottom: 15px;">
      <!-- Círculo da timeline (destacado para status atual) -->
      <div style="position: absolute; left: -20px; width: 20px; height: 20px; border-radius: 50%; background-color: #e53e3e; transform: translateX(-50%); border: 2px solid #fecaca;"></div>
      
      <!-- Conteúdo do passo (destacado para status atual) -->
      <div style="margin-left: 10px; background-color: #fef2f2; padding: 8px; border-radius: 4px; border-left: 3px solid #e53e3e;">
        <p style="margin: 0; font-weight: bold;">Em trânsito para o centro de distribuição</p>
        <p style="margin: 0; font-size: 12px; color: #666;">03/05/2023 - 11:42</p>
      </div>
    </div>
    `,
  }

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin-auth")
    if (isAuthenticated !== "true") {
      router.push("/admin")
      return
    }

    fetchTemplates()
  }, [router])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/email-templates")

      if (!response.ok) {
        throw new Error("Falha ao buscar templates")
      }

      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error("Erro ao buscar templates:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os templates de email.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplates = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/update-email-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templates),
      })

      if (!response.ok) {
        throw new Error("Falha ao salvar templates")
      }

      toast({
        title: "Sucesso",
        description: "Templates de email atualizados com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao salvar templates:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar os templates de email.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin-auth")
    router.push("/admin")
  }

  // Função para substituir as variáveis no template
  const replaceVariables = (template: string, data: any) => {
    return template
      .replace(/{{recipientName}}/g, data.recipientName)
      .replace(/{{trackingCode}}/g, data.trackingCode)
      .replace(/{{productType}}/g, data.productType)
      .replace(/{{trackingUrl}}/g, data.trackingUrl)
      .replace(/{{newStatus}}/g, data.newStatus)
      .replace(/{{updateDate}}/g, data.updateDate)
      .replace(/{{timelineSteps}}/g, data.timelineSteps)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} onLogout={handleLogout} />

      <div className="flex">
        <AdminSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold">Templates de Email</h1>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? "Editar" : "Visualizar"}
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleSaveTemplates}
                disabled={saving}
                className="flex items-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Templates
                  </>
                )}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
              <span className="ml-2 text-lg">Carregando templates...</span>
            </div>
          ) : (
            <Tabs defaultValue="tracking">
              <TabsList className="mb-4">
                <TabsTrigger value="tracking">Email de Rastreamento</TabsTrigger>
                <TabsTrigger value="statusUpdate">Email de Atualização de Status</TabsTrigger>
              </TabsList>

              <TabsContent value="tracking">
                <Card>
                  <CardHeader>
                    <CardTitle>Template de Email de Rastreamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {previewMode ? (
                      <div className="border rounded-lg p-4 bg-white">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: replaceVariables(templates.tracking, previewData),
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500 mb-4">
                          Este email é enviado quando uma nova remessa é criada. Você pode usar as seguintes variáveis:
                        </p>
                        <div className="bg-gray-100 p-3 rounded-md mb-4 overflow-x-auto">
                          <code className="text-xs">
                            {"{{recipientName}} - Nome do destinatário"}
                            <br />
                            {"{{trackingCode}} - Código de rastreamento"}
                            <br />
                            {"{{productType}} - Tipo de produto"}
                            <br />
                            {"{{trackingUrl}} - URL para rastreamento"}
                          </code>
                        </div>
                        <Textarea
                          value={templates.tracking}
                          onChange={(e) => setTemplates({ ...templates, tracking: e.target.value })}
                          className="min-h-[400px] font-mono text-sm"
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="statusUpdate">
                <Card>
                  <CardHeader>
                    <CardTitle>Template de Email de Atualização de Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {previewMode ? (
                      <div className="border rounded-lg p-4 bg-white">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: replaceVariables(templates.statusUpdate, previewData),
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500 mb-4">
                          Este email é enviado quando o status de uma remessa é atualizado. Você pode usar as seguintes
                          variáveis:
                        </p>
                        <div className="bg-gray-100 p-3 rounded-md mb-4 overflow-x-auto">
                          <code className="text-xs">
                            {"{{recipientName}} - Nome do destinatário"}
                            <br />
                            {"{{trackingCode}} - Código de rastreamento"}
                            <br />
                            {"{{newStatus}} - Novo status da remessa"}
                            <br />
                            {"{{updateDate}} - Data da atualização"}
                            <br />
                            {"{{trackingUrl}} - URL para rastreamento"}
                            <br />
                            {"{{timelineSteps}} - HTML da timeline de status"}
                          </code>
                        </div>
                        <Textarea
                          value={templates.statusUpdate}
                          onChange={(e) => setTemplates({ ...templates, statusUpdate: e.target.value })}
                          className="min-h-[400px] font-mono text-sm"
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </div>
  )
}
