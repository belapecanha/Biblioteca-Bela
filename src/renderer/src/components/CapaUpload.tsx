import { useRef, useState, type DragEvent } from 'react'
import { CapaPlaceholder } from './CapaPlaceholder'

interface CapaUploadProps {
  livroId: number
  capaUrl: string | null
  titulo: string
  autor?: string
  onChanged: () => void
}

export function CapaUpload({ livroId, capaUrl, titulo, autor, onChanged }: CapaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviarArquivo(file: File): Promise<void> {
    setEnviando(true)
    try {
      const bytes = await file.arrayBuffer()
      const extensao = file.name.split('.').pop() || 'jpg'
      await window.api.livros.salvarCapa({ livroId, bytes, extensao })
      onChanged()
    } finally {
      setEnviando(false)
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) void enviarArquivo(file)
  }

  async function remover(): Promise<void> {
    await window.api.livros.removerCapa(livroId)
    onChanged()
  }

  return (
    <div className="w-40 shrink-0">
      <div
        className="relative aspect-[2/3] w-40 cursor-pointer overflow-hidden rounded-lg border border-stone-200 shadow-sm"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {capaUrl ? (
          <img src={capaUrl} alt={titulo} className="h-full w-full object-cover" />
        ) : (
          <CapaPlaceholder titulo={titulo} autor={autor} />
        )}
        {enviando && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs text-stone-600">
            Enviando...
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void enviarArquivo(file)
        }}
      />
      <div className="mt-2 flex gap-3 text-xs">
        <button type="button" onClick={() => inputRef.current?.click()} className="text-stone-600 underline">
          Trocar capa
        </button>
        {capaUrl && (
          <button type="button" onClick={remover} className="text-red-500 underline">
            Remover
          </button>
        )}
      </div>
    </div>
  )
}
