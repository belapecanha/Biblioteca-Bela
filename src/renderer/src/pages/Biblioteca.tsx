import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { LivroResumo } from '@shared/types'
import { CapaPlaceholder } from '../components/CapaPlaceholder'

type Ordenacao = 'titulo' | 'anoEdicao' | 'dataAdicao'

export function Biblioteca() {
  const { data: livros = [], isLoading } = useQuery({
    queryKey: ['livros'],
    queryFn: () => window.api.livros.listar()
  })

  const [busca, setBusca] = useState('')
  const [posse, setPosse] = useState('')
  const [formato, setFormato] = useState('')
  const [ordenarPor, setOrdenarPor] = useState<Ordenacao>('titulo')
  const [decrescente, setDecrescente] = useState(false)

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const filtrada = livros.filter((livro) => {
      if (termo && !`${livro.titulo} ${livro.autores ?? ''}`.toLowerCase().includes(termo)) return false
      if (posse && livro.posse !== posse) return false
      if (formato && livro.formatoEdicao !== formato) return false
      return true
    })
    const comparar = (a: LivroResumo, b: LivroResumo): number => {
      const va = a[ordenarPor] ?? ''
      const vb = b[ordenarPor] ?? ''
      const resultado = va < vb ? -1 : va > vb ? 1 : 0
      return decrescente ? -resultado : resultado
    }
    return [...filtrada].sort(comparar)
  }, [livros, busca, posse, formato, ordenarPor, decrescente])

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <h2 className="mr-auto font-serif text-2xl text-stone-900">Biblioteca ({listaFiltrada.length})</h2>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por título ou autor"
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
        />
        <select
          value={posse}
          onChange={(e) => setPosse(e.target.value)}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
        >
          <option value="">Posse: todas</option>
          <option value="tenho">Tenho</option>
          <option value="nao_tenho">Não tenho</option>
          <option value="ja_tive">Já tive</option>
        </select>
        <select
          value={formato}
          onChange={(e) => setFormato(e.target.value)}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
        >
          <option value="">Formato: todos</option>
          <option value="fisico">Físico</option>
          <option value="ebook">E-book</option>
          <option value="audiolivro">Audiolivro</option>
        </select>
        <select
          value={ordenarPor}
          onChange={(e) => setOrdenarPor(e.target.value as Ordenacao)}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
        >
          <option value="titulo">Ordenar: título</option>
          <option value="anoEdicao">Ordenar: ano</option>
          <option value="dataAdicao">Ordenar: adicionado em</option>
        </select>
        <button
          type="button"
          onClick={() => setDecrescente((v) => !v)}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
          title={decrescente ? 'Decrescente' : 'Crescente'}
        >
          {decrescente ? '↓' : '↑'}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-stone-500">Carregando...</p>
      ) : listaFiltrada.length === 0 ? (
        <p className="text-sm text-stone-500">Nenhum livro encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {listaFiltrada.map((livro) => (
            <Link key={livro.id} to={`/livros/${livro.id}`} className="group">
              <div className="aspect-[2/3] overflow-hidden rounded-lg border border-stone-200 shadow-sm transition-transform group-hover:-translate-y-1">
                {livro.capaUrl ? (
                  <img src={livro.capaUrl} alt={livro.titulo} className="h-full w-full object-cover" />
                ) : (
                  <CapaPlaceholder titulo={livro.titulo} autor={livro.autores} />
                )}
              </div>
              <p className="mt-1 truncate text-xs font-medium text-stone-800">{livro.titulo}</p>
              <p className="truncate text-xs text-stone-500">{livro.autores}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
