import { useState, type KeyboardEvent } from 'react'

interface TagInputProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function TagInput({ label, value, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState('')

  function adicionar(): void {
    const nome = draft.trim()
    if (nome && !value.includes(nome)) onChange([...value, nome])
    setDraft('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      adicionar()
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      <div className="flex flex-wrap gap-1 rounded-lg border border-stone-300 p-2 focus-within:border-stone-500">
        {value.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== item))}
              className="text-stone-400 hover:text-stone-700"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={adicionar}
          placeholder={placeholder ?? 'nome e Enter'}
          className="min-w-[80px] flex-1 border-none bg-transparent text-sm outline-none"
        />
      </div>
    </label>
  )
}
