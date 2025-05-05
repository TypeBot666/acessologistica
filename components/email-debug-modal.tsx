"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send, AlertCircle } from "lucide-react"

export function EmailDebugModal({
  isOpen,
  onClose,
  trackingCode,
}: {
  isOpen: boolean
  onClose: () => void
  trackingCode: string
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [emailTo, setEmailTo] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [status, setStatus] = useState("")
  const [result, setResult] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  const handleSendTest = async () => {
    if (!emailTo) {
      toast({
        title: "Erro",
        description: "Por favor, informe um email para envio do teste.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // Preparar dados para o email
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const trackingUrl = `${siteUrl}/rastreio?codigo=${trackingCode}`

      const response = await fetch("/api/send-status-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailTo,
          trackingCode: trackingCode,
          recipientName: recipientName || "Cliente",
          newStatus: status || "Objeto postado",
          updateDate: new Date().toLocaleString("pt-BR"),
          trackingUrl: trackingUrl,
          debug: true,
        }),
      })

      const data = await response.json()
      setResult(data)

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Email de teste enviado com sucesso!",
        })
      } else {
        toast({
          title: "Erro",
          description: `Falha ao enviar email: ${data.error || "Erro desconhecido"}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao enviar email de teste:", error)
      setResult({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" })
      toast({
        title: "Erro",
        description: `Falha ao enviar email: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Teste de Email para Pedido</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tracking-code" className="text-right">
              Código
            </Label>
            <Input id="tracking-code" value={trackingCode} readOnly className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email-to" className="text-right">
              Email
            </Label>
            <Input
              id="email-to"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="Email para teste"
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="recipient-name" className="text-right">
              Destinatário
            </Label>
            <Input
              id="recipient-name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Nome do destinatário"
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Input
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="Ex: Objeto postado"
              className="col-span-3"
            />
          </div>

          {result && (
            <div className={`p-3 rounded-md mt-2 ${result.success ? "bg-green-50" : "bg-red-50"}`}>
              <div className="flex items-start">
                <div className={`mr-2 ${result.success ? "text-green-500" : "text-red-500"}`}>
                  {result.success ? "✓" : <AlertCircle size={18} />}
                </div>
                <div>
                  <p className={`font-medium ${result.success ? "text-green-700" : "text-red-700"}`}>
                    {result.success ? "Email enviado com sucesso!" : "Falha ao enviar email"}
                  </p>
                  {!result.success && <p className="text-sm text-red-600 mt-1">{result.error}</p>}
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto mt-1"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? "Ocultar detalhes" : "Mostrar detalhes"}
                  </Button>
                  {showDetails && (
                    <Textarea
                      value={JSON.stringify(result, null, 2)}
                      readOnly
                      className="mt-2 h-32 text-xs font-mono"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={handleSendTest} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Teste
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
