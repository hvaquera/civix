import Link from 'next/link'
import { Building2, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-civix-50 to-white flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-civix-600 mb-2">CIVIX</h1>
        <p className="text-gray-600">Ciudadanos y gobierno, conectados</p>
      </div>

      {/* Entry points */}
      <div className="w-full max-w-md space-y-4">
        {/* Citizen App */}
        <Link
          href="/onboarding"
          className="block w-full p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-civix-300 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-civix-100 rounded-lg">
              <Users className="w-6 h-6 text-civix-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Soy ciudadano
              </h2>
              <p className="text-sm text-gray-500">
                Reporta problemas y da seguimiento
              </p>
            </div>
          </div>
        </Link>

        {/* Panel */}
        <Link
          href="/panel/login"
          className="block w-full p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-civix-300 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Building2 className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Soy del municipio
              </h2>
              <p className="text-sm text-gray-500">
                Accede al panel de gestión
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-400">
        <p>© 2024 CIVIX. Todos los derechos reservados.</p>
      </footer>
    </main>
  )
}
