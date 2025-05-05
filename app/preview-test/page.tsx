export default function PreviewTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Teste de Preview</h1>
      <p className="mb-4">Esta página é apenas para testar se o preview está funcionando corretamente.</p>
      <div className="p-4 bg-red-100 border border-red-300 rounded-md">
        <p className="text-red-700">Se você consegue ver esta mensagem, o preview está funcionando!</p>
      </div>
    </div>
  )
}
