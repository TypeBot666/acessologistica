export default function ApiDocsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Documentação da API de Integração</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Webhook para Plataforma Whitelabel</h2>
        <p className="mb-4">Endpoint para receber dados de pedidos da sua plataforma whitelabel.</p>

        <div className="bg-gray-100 p-4 rounded mb-4">
          <p className="font-mono">POST /api/webhook/whitelabel</p>
        </div>

        <h3 className="text-xl font-semibold mb-2">Exemplo de Payload</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto mb-4">
          {JSON.stringify(
            {
              order_id: "12345",
              customer: {
                name: "Nome do Cliente",
                email: "cliente@email.com",
                phone: "11999998888",
                document: "123.456.789-00",
              },
              shipping_address: {
                street: "Rua Exemplo",
                number: "123",
                complement: "Apto 45",
                neighborhood: "Centro",
                city: "São Paulo",
                state: "SP",
                postal_code: "01234-567",
              },
              items: [
                {
                  name: "Produto Exemplo",
                  quantity: 2,
                  weight: 0.5,
                },
              ],
              payment_status: "approved",
              created_at: "2023-05-01T10:30:00Z",
            },
            null,
            2,
          )}
        </pre>

        <h3 className="text-xl font-semibold mb-2">Resposta de Sucesso</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto mb-4">
          {JSON.stringify(
            {
              success: true,
              tracking_code: "LOG-20230501-1234",
              message: "Remessa criada com sucesso",
              notification_sent: true,
            },
            null,
            2,
          )}
        </pre>

        <h3 className="text-xl font-semibold mb-2">Resposta de Erro</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
          {JSON.stringify(
            {
              error: "Mensagem de erro específica",
            },
            null,
            2,
          )}
        </pre>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Como Testar</h2>
        <ol className="list-decimal pl-6 mb-4 space-y-2">
          <li>Use uma ferramenta como Postman ou Insomnia para enviar uma requisição POST para o endpoint</li>
          <li>Defina o Content-Type como application/json</li>
          <li>No corpo da requisição, adicione um JSON com os dados de um pedido conforme o exemplo acima</li>
          <li>Envie a requisição e verifique a resposta</li>
          <li>Verifique no painel administrativo se a remessa foi criada</li>
        </ol>

        <div className="bg-yellow-100 p-4 rounded">
          <p className="font-semibold">Importante:</p>
          <p>
            Para que a remessa seja criada, o status de pagamento deve ser "approved", "paid", "confirmed" ou
            "completed".
          </p>
        </div>
      </div>
    </div>
  )
}
