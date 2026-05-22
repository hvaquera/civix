'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function TerminosPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Atrás</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4 prose prose-sm max-w-none">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Términos de Uso y Aviso de Privacidad
          </h1>

          <p className="text-sm text-gray-500 mb-6">
            Última actualización: Marzo 2024
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            1. Aceptación de términos
          </h2>
          <p className="text-gray-600 mb-4">
            Al utilizar CIVIX, aceptas estos términos de uso y nuestro aviso de privacidad. 
            Si no estás de acuerdo, no utilices la aplicación.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            2. Descripción del servicio
          </h2>
          <p className="text-gray-600 mb-4">
            CIVIX es una plataforma que permite a los ciudadanos de Monterrey reportar 
            problemas de infraestructura pública y dar seguimiento a su resolución.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            3. Registro y verificación
          </h2>
          <p className="text-gray-600 mb-4">
            Para usar CIVIX debes verificar tu identidad mediante tu INE. Solo extraemos 
            y almacenamos: nombre, colonia, municipio y código postal. NO almacenamos: 
            CURP, clave de elector, número de INE, ni imágenes de tu identificación.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            4. Uso permitido
          </h2>
          <p className="text-gray-600 mb-2">Te comprometes a:</p>
          <ul className="text-gray-600 mb-4 list-disc pl-5 space-y-1">
            <li>Proporcionar información veraz en tus reportes</li>
            <li>No crear reportes falsos o malintencionados</li>
            <li>No usar la app para fines ilegales o de acoso</li>
            <li>Respetar a otros usuarios y al personal del municipio</li>
          </ul>

          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            5. Datos que recopilamos
          </h2>
          <ul className="text-gray-600 mb-4 list-disc pl-5 space-y-1">
            <li><strong>Datos de registro:</strong> Nombre, colonia, municipio, método de contacto</li>
            <li><strong>Datos de reportes:</strong> Ubicación, fotos, descripción del problema</li>
            <li><strong>Datos de uso:</strong> Interacciones con la app para mejorar el servicio</li>
          </ul>

          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            6. Cómo usamos tus datos
          </h2>
          <ul className="text-gray-600 mb-4 list-disc pl-5 space-y-1">
            <li>Procesar y dar seguimiento a tus reportes</li>
            <li>Comunicarte actualizaciones sobre tus reportes</li>
            <li>Mejorar el servicio y la experiencia de usuario</li>
            <li>Generar estadísticas anónimas de uso</li>
          </ul>

          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            7. Compartir información
          </h2>
          <p className="text-gray-600 mb-4">
            Compartimos información de tus reportes con las áreas correspondientes del 
            municipio de Monterrey para su atención. No vendemos ni compartimos tus datos 
            personales con terceros para fines comerciales.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            8. Seguridad
          </h2>
          <p className="text-gray-600 mb-4">
            Utilizamos encriptación y medidas de seguridad estándar de la industria para 
            proteger tus datos. Sin embargo, ningún sistema es 100% seguro.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            9. Tus derechos
          </h2>
          <p className="text-gray-600 mb-4">
            Conforme a la Ley Federal de Protección de Datos Personales, tienes derecho a 
            acceder, rectificar, cancelar u oponerte al tratamiento de tus datos (derechos ARCO). 
            Contacta a soporte@civix.mx para ejercer estos derechos.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            10. Modificaciones
          </h2>
          <p className="text-gray-600 mb-4">
            Podemos modificar estos términos en cualquier momento. Te notificaremos de 
            cambios importantes por correo o WhatsApp.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            11. Contacto
          </h2>
          <p className="text-gray-600 mb-4">
            Para dudas sobre estos términos o el tratamiento de tus datos:<br />
            <strong>Correo:</strong> soporte@civix.mx<br />
            <strong>WhatsApp:</strong> +52 81 1234 5678
          </p>

          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-500 text-center">
              Al usar CIVIX, confirmas que has leído y aceptas estos términos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
