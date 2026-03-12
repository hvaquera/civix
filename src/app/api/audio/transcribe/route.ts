import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Se requiere un archivo de audio' },
        { status: 400 }
      )
    }

    // Validar tamaño (max 25MB para Whisper)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo de audio es demasiado grande (máximo 25MB)' },
        { status: 400 }
      )
    }

    // Validar tipo
    const validTypes = ['audio/webm', 'audio/mp3', 'audio/mp4', 'audio/mpeg', 'audio/mpga', 'audio/m4a', 'audio/wav']
    if (!validTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Formato de audio no soportado' },
        { status: 400 }
      )
    }

    // Transcribir con Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'es', // Español mexicano
      response_format: 'verbose_json',
    })

    return NextResponse.json({
      success: true,
      text: transcription.text,
      duration: transcription.duration,
      language: transcription.language,
    })
  } catch (error) {
    console.error('Transcription Error:', error)
    return NextResponse.json(
      { 
        error: 'Error transcribiendo el audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
