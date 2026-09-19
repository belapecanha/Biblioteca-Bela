function corDeFundo(texto: string): string {
  let hash = 0
  for (const char of texto) hash = char.charCodeAt(0) + ((hash << 5) - hash)
  const matiz = Math.abs(hash) % 360
  return `hsl(${matiz}, 45%, 88%)`
}

export function CapaPlaceholder({ titulo, autor }: { titulo: string; autor?: string | null }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-1 p-3 text-center"
      style={{ backgroundColor: corDeFundo(titulo) }}
    >
      <span className="line-clamp-3 font-serif text-sm font-medium text-stone-800">{titulo}</span>
      {autor && <span className="line-clamp-1 text-xs text-stone-600">{autor}</span>}
    </div>
  )
}
