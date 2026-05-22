'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = ['Infraestructura', 'Seguridad', 'Servicios públicos', 'Empleo', 'Salud', 'Educación', 'Agua', 'Vivienda', 'Otro']

export default function CampoPeticionPage() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [urgency, setUrgency] = useState<'baja' | 'media' | 'alta'>('media')
  const [note, setNote] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)

  const toggleCat = (cat: string) => setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])

  const handleTextChange = (val: string) => {
    setText(val)
    if (val.length > 30 && !aiSuggestion) {
      setTimeout(() => {
        if (val.toLowerCase().includes('bache') || val.toLowerCase().includes('calle')) setAiSuggestion('Infraestructura')
        else if (val.toLowerCase().includes('segur') || val.toLowerCase().includes('robo')) setAiSuggestion('Seguridad')
        else if (val.toLowerCase().includes('agua') || val.toLowerCase().includes('fuga')) setAiSuggestion('Agua')
      }, 1000)
    }
  }

  const handleContinue = () => { localStorage.setItem('campo_registro_peticion', JSON.stringify({ text, categories, urgency, note })); router.push('/campo/registro/confirmar') }
  const handleSkip = () => { localStorage.setItem('campo_registro_peticion', JSON.stringify({ text: '', categories: [], urgency: 'media', note: '' })); router.push('/campo/registro/confirmar') }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-4 flex items-center justify-between border-b sticky top-0 bg-white z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-center"><p className="font-semibold text-gray-900">Paso 3 de 4</p><p className="text-gray-400 text-xs">¿Qué necesita?</p></div>
        <button onClick={handleSkip} className="text-sm text-civix-600 font-medium">Saltar</button>
      </div>
      <div className="px-4 py-2"><div className="h-1 bg-gray-200 rounded-full"><div className="h-full w-3/4 bg-civix-500 rounded-full" /></div></div>
      <div className="flex-1 px-4 pb-28 space-y-5 overflow-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Petición o comentario del ciudadano</label>
          <textarea rows={4} maxLength={1000} placeholder="¿Qué le pidió o comentó el ciudadano?" value={text} onChange={(e) => handleTextChange(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-civix-500" />
          <p className="text-xs text-gray-400 text-right mt-1">{text.length}/1000</p>
        </div>
        {aiSuggestion && !categories.includes(aiSuggestion) && (
          <button onClick={() => { toggleCat(aiSuggestion); setAiSuggestion(null) }} className="w-full flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-xl text-sm">
            <Sparkles className="w-4 h-4 text-purple-500" /><span className="text-purple-700">IA sugiere: <strong>{aiSuggestion}</strong></span><span className="ml-auto text-purple-500 font-medium">+ Agregar</span>
          </button>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categorías</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => toggleCat(cat)} className={cn('px-3 py-1.5 rounded-full text-sm font-medium border transition-colors', categories.includes(cat) ? 'bg-civix-500 text-white border-civix-500' : 'bg-white text-gray-600 border-gray-200 hover:border-civix-300')}>{cat}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de urgencia</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 'baja' as const, label: 'Baja', c: 'bg-gray-100 text-gray-700 border-gray-200', a: 'bg-gray-600 text-white border-gray-600' }, { id: 'media' as const, label: 'Media', c: 'bg-yellow-50 text-yellow-700 border-yellow-200', a: 'bg-yellow-500 text-white border-yellow-500' }, { id: 'alta' as const, label: 'Alta', c: 'bg-red-50 text-red-700 border-red-200', a: 'bg-red-500 text-white border-red-500' }].map((u) => (
              <button key={u.id} onClick={() => setUrgency(u.id)} className={cn('py-2 rounded-lg text-sm font-medium border', urgency === u.id ? u.a : u.c)}>{u.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nota interna <span className="text-gray-400 font-normal">(solo tú y tu coordinador)</span></label>
          <textarea rows={2} maxLength={500} placeholder="Notas para tu equipo..." value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-civix-500" />
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t"><Button className="w-full h-12 text-base" onClick={handleContinue}>Continuar<ChevronRight className="w-4 h-4 ml-2" /></Button></div>
    </div>
  )
}
