import Link from "next/link"
import { ArrowRight, MapPin, Clock, Shield } from "lucide-react"
import { TrackingSearch } from "@/components/tracking-search"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto flex items-center px-4 py-4">
          <div className="flex items-center">
            <Link href="/">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo_home%20%281%29-k4dNWea9Xt8N85gYxkxe0vxCGH4uG9.webp"
                alt="Jadlog"
                className="h-10 w-auto"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-50 to-gray-100 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center md:flex-row md:justify-between">
            <div className="mb-10 max-w-xl md:mb-0">
              <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
                Sua encomenda no <span className="text-red-600">melhor caminho</span>
              </h1>
              <p className="mb-8 text-lg text-gray-600">
                Rastreie suas remessas de forma simples e rápida. Entregamos com segurança e pontualidade para todo o
                Brasil.
              </p>
              <div className="rounded-lg bg-white p-2 shadow-lg">
                <TrackingSearch />
              </div>
            </div>
            <div className="relative">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-red-600 p-4">
                <div className="flex h-full w-full items-center justify-center">
                  <svg
                    className="h-10 w-10 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 19H16M10 3H14L17 7H7L10 3ZM4 7H20V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/outdoor02-8xGg6Kznas7KqUjExN6HDQwlGd2QSJ.webp"
                alt="Entrega Jadlog"
                className="rounded-lg shadow-xl"
                width={500}
                height={300}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">Por que escolher a Jadlog?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 text-center shadow-md transition-all hover:shadow-lg">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <MapPin className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">Cobertura Nacional</h3>
              <p className="text-gray-600">Entregamos em todo o território brasileiro, com rapidez e eficiência.</p>
            </div>
            <div className="rounded-lg bg-white p-6 text-center shadow-md transition-all hover:shadow-lg">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <Clock className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">Pontualidade</h3>
              <p className="text-gray-600">
                Compromisso com prazos e horários para suas entregas chegarem no tempo certo.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 text-center shadow-md transition-all hover:shadow-lg">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">Segurança</h3>
              <p className="text-gray-600">Suas encomendas são tratadas com o máximo cuidado do início ao fim.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-red-600 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center md:flex-row md:justify-between">
            <div className="mb-8 md:mb-0 md:w-1/2">
              <h2 className="mb-4 text-3xl font-bold">Acompanhe sua entrega em tempo real</h2>
              <p className="mb-6 text-lg text-red-100">
                Tenha acesso a informações detalhadas sobre o status da sua remessa a qualquer momento.
              </p>
              <Link
                href="/rastreio"
                className="inline-flex items-center rounded-lg bg-white px-6 py-3 font-medium text-red-600 shadow-lg transition-colors hover:bg-gray-100"
              >
                Rastrear agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="md:w-2/5">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ft_home01-XCTQwo334ManiZLtYop51fz7klzwjD.webp"
                alt="Entregador Jadlog"
                className="rounded-lg shadow-xl"
                width={400}
                height={400}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
