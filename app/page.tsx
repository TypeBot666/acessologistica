import Link from "next/link"
import { ArrowRight, MapPin, Clock, Shield } from "lucide-react"
import { TrackingSearch } from "@/components/tracking-search"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto flex items-center px-4 py-3">
          <div className="flex items-center">
            <Link href="/">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo_home%20%281%29-k4dNWea9Xt8N85gYxkxe0vxCGH4uG9.webp"
                alt="Jadlog"
                className="h-8 w-auto sm:h-10"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-50 to-gray-100 py-8 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center md:flex-row md:justify-between">
            <div className="mb-8 max-w-xl md:mb-0">
              <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:mb-6 sm:text-4xl md:text-5xl">
                Sua encomenda no <span className="text-red-600">melhor caminho</span>
              </h1>
              <p className="mb-6 text-base text-gray-600 sm:mb-8 sm:text-lg">
                Rastreie suas remessas de forma simples e rápida. Entregamos com segurança e pontualidade para todo o
                Brasil.
              </p>
              <div className="rounded-lg bg-white p-2 shadow-lg">
                <TrackingSearch />
              </div>
            </div>
            <div className="relative mt-4 md:mt-0">
              <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-red-600 p-3 sm:-right-4 sm:-top-4 sm:h-20 sm:w-20 sm:p-4">
                <div className="flex h-full w-full items-center justify-center">
                  <svg
                    className="h-8 w-8 text-white sm:h-10 sm:w-10"
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
      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:mb-12 sm:text-3xl">
            Por que escolher a Jadlog?
          </h2>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3 md:gap-8">
            <div className="rounded-lg bg-white p-4 text-center shadow-md transition-all hover:shadow-lg sm:p-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:h-16 sm:w-16 sm:mb-4">
                <MapPin className="h-6 w-6 text-red-600 sm:h-8 sm:w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold sm:mb-3 sm:text-xl">Cobertura Nacional</h3>
              <p className="text-sm text-gray-600 sm:text-base">
                Entregamos em todo o território brasileiro, com rapidez e eficiência.
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 text-center shadow-md transition-all hover:shadow-lg sm:p-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:h-16 sm:w-16 sm:mb-4">
                <Clock className="h-6 w-6 text-red-600 sm:h-8 sm:w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold sm:mb-3 sm:text-xl">Pontualidade</h3>
              <p className="text-sm text-gray-600 sm:text-base">
                Compromisso com prazos e horários para suas entregas chegarem no tempo certo.
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 text-center shadow-md transition-all hover:shadow-lg sm:p-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:h-16 sm:w-16 sm:mb-4">
                <Shield className="h-6 w-6 text-red-600 sm:h-8 sm:w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold sm:mb-3 sm:text-xl">Segurança</h3>
              <p className="text-sm text-gray-600 sm:text-base">
                Suas encomendas são tratadas com o máximo cuidado do início ao fim.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-red-600 py-8 text-white sm:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center md:flex-row md:justify-between">
            <div className="mb-6 text-center md:mb-0 md:text-left md:w-1/2">
              <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl">Acompanhe sua entrega em tempo real</h2>
              <p className="mb-4 text-sm text-red-100 sm:mb-6 sm:text-base">
                Tenha acesso a informações detalhadas sobre o status da sua remessa a qualquer momento.
              </p>
              <Link
                href="/rastreio"
                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-lg transition-colors hover:bg-gray-100 sm:px-6 sm:py-3 sm:text-base"
              >
                Rastrear agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 w-full max-w-xs md:mt-0 md:w-2/5">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ft_home01-XCTQwo334ManiZLtYop51fz7klzwjD.webp"
                alt="Entregador Jadlog"
                className="mx-auto rounded-lg shadow-xl md:mx-0"
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
