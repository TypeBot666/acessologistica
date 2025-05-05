"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function WebhooksPage() {
  const { toast } = useToast()
  const [baseUrl, setBaseUrl] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [token, setToken] = useState("SEU_TOKEN_AQUI")

  useEffect(() => {
    // Obter a URL base do site
    const url = process.env.NEXT_PUBLIC_API_URL || window.location.origin
    setBaseUrl(url)
  }, [])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(id)
        toast({
          title: "Copiado!",
          description: "O código foi copiado para a área de transferência.",
        })
        setTimeout(() => setCopied(null), 2000)
      },
      (err) => {
        console.error("Erro ao copiar: ", err)
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o código.",
          variant: "destructive",
        })
      },
    )
  }

  // Código para ZeroOnePay
  const zeroOneCode = `const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook/zeroone', (req, res) => {
  const tokenHeader = req.headers.authorization;

  if (tokenHeader !== 'Bearer ${token}') {
    return res.status(403).send('Token inválido');
  }

  const data = req.body;

  if (data.event === 'compra_aprovada') {
    // Preparar dados para enviar ao sistema de logística
    const remessaData = {
      order_id: data.id || \`ZOP-\${Date.now()}\`,
      payment_status: "approved",
      customer: {
        name: data.nome,
        email: data.email || "",
        phone: data.telefone || "",
        document: data.cpf || "",
      },
      shipping_address: {
        street: data.endereco?.rua || "",
        number: data.endereco?.numero || "",
        complement: data.endereco?.complemento || "",
        neighborhood: data.endereco?.bairro || "",
        city: data.endereco?.cidade || "",
        state: data.endereco?.estado || "",
        postal_code: data.endereco?.cep || "",
      },
      items: [
        {
          name: data.produto || "Produto ZeroOnePay",
          quantity: data.quantidade || 1,
          weight: data.peso || 0.5,
        }
      ]
    };

    // Enviar para o webhook do sistema de logística
    fetch("${baseUrl}/api/webhook/whitelabel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(remessaData),
    })
    .then(response => response.json())
    .then(result => {
      console.log('Remessa criada:', result);
    })
    .catch(error => {
      console.error('Erro ao criar remessa:', error);
    });
  }

  res.sendStatus(200);
});

// Iniciar o servidor na porta desejada
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Servidor rodando na porta \${PORT}\`);
});`

  // Código para webhook genérico
  const genericCode = `// Webhook para integração genérica
fetch("${baseUrl}/api/webhook/whitelabel", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${token}"
  },
  body: JSON.stringify({
    order_id: "PEDIDO-123",
    payment_status: "approved",
    customer: {
      name: "Nome do Cliente",
      email: "cliente@exemplo.com",
      phone: "11999998888",
      document: "123.456.789-00"
    },
    shipping_address: {
      street: "Rua Exemplo",
      number: "123",
      complement: "Apto 45",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      postal_code: "01234-567"
    },
    items: [
      {
        name: "Produto Exemplo",
        quantity: 1,
        weight: 0.5
      }
    ]
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Erro:', error));`

  // Código para PHP
  const phpCode = `<?php
// Dados do pedido
$pedido = [
  'order_id' => 'PEDIDO-123',
  'payment_status' => 'approved',
  'customer' => [
    'name' => 'Nome do Cliente',
    'email' => 'cliente@exemplo.com',
    'phone' => '11999998888',
    'document' => '123.456.789-00'
  ],
  'shipping_address' => [
    'street' => 'Rua Exemplo',
    'number' => '123',
    'complement' => 'Apto 45',
    'neighborhood' => 'Centro',
    'city' => 'São Paulo',
    'state' => 'SP',
    'postal_code' => '01234-567'
  ],
  'items' => [
    [
      'name' => 'Produto Exemplo',
      'quantity' => 1,
      'weight' => 0.5
    ]
  ]
];

// Inicializar cURL
$ch = curl_init('${baseUrl}/api/webhook/whitelabel');

// Configurar a requisição
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($pedido));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Content-Type: application/json',
  'Authorization: Bearer ${token}'
]);

// Executar a requisição
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Verificar o resultado
if ($httpCode >= 200 && $httpCode < 300) {
  $data = json_decode($response, true);
  echo "Remessa criada com sucesso! Código de rastreio: " . $data['tracking_code'];
} else {
  echo "Erro ao criar remessa: " . $response;
}

// Fechar a conexão
curl_close($ch);
?>`

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 md:text-3xl">Webhooks para Integração</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start">
        <AlertCircle className="text-yellow-500 mr-2 mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <p className="text-yellow-800 font-medium">Importante</p>
          <p className="text-yellow-700 text-sm">
            Estes webhooks permitem que outras plataformas enviem dados de pedidos automaticamente para o sistema de
            logística. Personalize o token de segurança antes de usar em produção.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Personalize as configurações dos webhooks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">URL Base</Label>
              <Input
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://seu-dominio.com"
              />
              <p className="text-xs text-gray-500">URL base do seu sistema</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Token de Segurança</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Seu token de segurança"
              />
              <p className="text-xs text-gray-500">Token para autenticação dos webhooks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="zeroone">
        <TabsList className="mb-4 grid grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="zeroone">ZeroOnePay</TabsTrigger>
          <TabsTrigger value="generic">JavaScript</TabsTrigger>
          <TabsTrigger value="php">PHP</TabsTrigger>
        </TabsList>

        <TabsContent value="zeroone">
          <Card>
            <CardHeader>
              <CardTitle>Webhook para ZeroOnePay</CardTitle>
              <CardDescription>Código para integrar a ZeroOnePay com o sistema de logística</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm max-h-[500px]">
                  {zeroOneCode}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 h-8 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                  onClick={() => handleCopy(zeroOneCode, "zeroone")}
                >
                  {copied === "zeroone" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="font-medium">Instruções:</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>Copie o código acima e cole em um arquivo JavaScript no seu servidor Node.js</li>
                  <li>
                    Instale as dependências necessárias:{" "}
                    <code className="bg-gray-100 px-1 py-0.5 rounded">npm install express</code>
                  </li>
                  <li>
                    Substitua <code className="bg-gray-100 px-1 py-0.5 rounded">SEU_TOKEN_AQUI</code> por um token
                    seguro
                  </li>
                  <li>Inicie o servidor e configure a ZeroOnePay para enviar webhooks para este endpoint</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generic">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Genérico (JavaScript)</CardTitle>
              <CardDescription>Código JavaScript para integrar qualquer plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">{genericCode}</pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 h-8 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                  onClick={() => handleCopy(genericCode, "generic")}
                >
                  {copied === "generic" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="font-medium">Instruções:</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>Copie o código acima e adapte para sua plataforma</li>
                  <li>Substitua os dados de exemplo pelos dados reais do pedido</li>
                  <li>Personalize o token de autorização</li>
                  <li>Execute este código quando um pedido for aprovado</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="php">
          <Card>
            <CardHeader>
              <CardTitle>Webhook em PHP</CardTitle>
              <CardDescription>Código PHP para integrar com o sistema de logística</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">{phpCode}</pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 h-8 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                  onClick={() => handleCopy(phpCode, "php")}
                >
                  {copied === "php" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="font-medium">Instruções:</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>Copie o código acima e cole em um arquivo PHP no seu servidor</li>
                  <li>Substitua os dados de exemplo pelos dados reais do pedido</li>
                  <li>Personalize o token de autorização</li>
                  <li>Execute este código quando um pedido for aprovado</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Endpoint do Webhook</h2>
        <div className="bg-gray-100 p-4 rounded-lg mb-4 flex items-center justify-between">
          <code className="text-sm font-mono">{baseUrl}/api/webhook/whitelabel</code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(`${baseUrl}/api/webhook/whitelabel`, "endpoint")}
          >
            {copied === "endpoint" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Este é o endpoint para onde todos os webhooks devem enviar os dados. Configure sua plataforma para enviar
          requisições POST para este URL com os dados do pedido no formato JSON.
        </p>
      </div>
    </div>
  )
}
