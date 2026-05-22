import Link from 'next/link'
import { Users, Building2, Shield, ChevronRight } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-navy-900 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-civix-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-civix-900/40">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">CIVIX</h1>
          <p className="text-navy-400 text-sm mt-1.5">Ciudadanos y gobierno, conectados</p>
        </div>

        {/* Entry cards */}
        <div className="w-full max-w-sm space-y-3">
          <Link href="/onboarding" className="block group">
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-civix-500/50 rounded-2xl p-5 flex items-center gap-4 transition-all">
              <div className="w-11 h-11 bg-civix-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">Soy ciudadano</p>
                <p className="text-navy-400 text-xs mt-0.5">Reporta y da seguimiento a problemas</p>
              </div>
              <ChevronRight className="w-4 h-4 text-navy-500 group-hover:text-civix-400 transition-colors" />
            </div>
          </Link>

          <Link href="/panel/login" className="block group">
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-5 flex items-center gap-4 transition-all">
              <div className="w-11 h-11 bg-navy-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-navy-300" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">Soy del municipio</p>
                <p className="text-navy-400 text-xs mt-0.5">Accede al panel de gestión</p>
              </div>
              <ChevronRight className="w-4 h-4 text-navy-500 group-hover:text-white/60 transition-colors" />
            </div>
          </Link>

          <Link href="/campo/login" className="block group">
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-5 flex items-center gap-4 transition-all">
              <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">Soy brigadista</p>
                <p className="text-navy-400 text-xs mt-0.5">Accede a CIVIX Campo</p>
              </div>
              <ChevronRight className="w-4 h-4 text-navy-500 group-hover:text-emerald-400 transition-colors" />
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 px-6">
        <p className="text-navy-500 text-xs">© 2025 CIVIX. Todos los derechos reservados.</p>
      </footer>
    </main>
  )
}
