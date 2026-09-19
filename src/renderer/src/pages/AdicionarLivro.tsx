import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { LivroInput, ResultadoBusca } from '@shared/types'
import { LivroForm } from '../components/LivroForm'

type Modo = 'isbn' | 'buscar' | 'manual'

const inputClass = 'rounded-lg border border-stone-300 px-3 py-1.5 text-sm outline-none focus:border-stone-500'
const botaoClass =
  'rounded-lg bg-stone-900 px-4 py-1.5 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed'

function mensagemDeErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Erro ao buscar. Verifique sua conexão com a internet.'
}

function BuscaIsbn({ onEncontrado }: { onEncontrado: (r: ResultadoBusca) => void }) {
  const [isbn, setIsbn] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function buscar(): Promise<void> {
    setBuscando(true)
    setErro(null)
    try {
      const resultado = await window.api.busca.porIsbn(isbn.trim())
      if (resultado) onEncontrado(resultado)
      else setErro('Nenhum livro encontrado para esse ISBN.')
    } catch (erro) {
      setErro(mensagemDeErro(erro))
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="max-w-md space-y-3">
      <div className="flex gap-2">
        <input
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
          placeholder="ISBN-10 ou ISBN-13"
          className={`flex-1 ${inputClass}`}
        />
        <button type="button" onClick={buscar} disabled={buscando || !isbn.trim()} className={botaoClass}>
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
      {erro && <p className="text-xs text-red-500">{erro}</p>}
    </div>
  )
}

function BuscaTexto({ onSelecionar }: { onSelecionar: (r: ResultadoBusca) => void }) {
  const [titulo, setTitulo] = useState('')
  const [autor, setAutor] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<ResultadoBusca[]>([])
  const [erro, setErro] = useState<string | null>(null)

  async function buscar(): Promise<void> {
    setBuscando(true)
    setErro(null)
    try {
      const lista = await window.api.busca.porTexto({ titulo: titulo.trim(), autor: autor.trim() })
      setResultados(lista)
      if (lista.length === 0) setErro('Nenhum resultado encontrado.')
    } catch (erro) {
      setErro(mensagemDeErro(erro))
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-3">
      <div className="flex gap-2">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
          placeholder="Título"
          className={`flex-1 ${inputClass}`}
        />
        <input
          value={autor}
          onChange={(e) => setAutor(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
          placeholder="Autor"
          className={`flex-1 ${inputClass}`}
        />
        <button
          type="button"
          onClick={buscar}
          disabled={buscando || (!titulo.trim() && !autor.trim())}
          className={botaoClass}
        >
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
      {erro && <p className="text-xs text-red-500">{erro}</p>}
      <ul className="divide-y divide-stone-200">
        {resultados.map((r, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onSelecionar(r)}
              className="flex w-full items-center gap-3 py-2 text-left hover:bg-stone-50"
            >
              {r.capaUrlExterna ? (
                <img src={r.capaUrlExterna} alt="" className="h-16 w-11 shrink-0 object-cover" />
              ) : (
                <div className="h-16 w-11 shrink-0 bg-stone-100" />
              )}
              <div>
                <p className="text-sm font-medium text-stone-800">{r.titulo}</p>
                <p className="text-xs text-stone-500">
                  {r.autores.join(', ')}
                  {r.anoEdicao ? ` · ${r.anoEdicao}` : ''}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const ABAS: { modo: Modo; rotulo: string }[] = [
  { modo: 'isbn', rotulo: 'ISBN' },
  { modo: 'buscar', rotulo: 'Buscar' },
  { modo: 'manual', rotulo: 'Manual' }
]

export function AdicionarLivro() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modo, setModo] = useState<Modo>('isbn')
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null)

  const mutation = useMutation({
    mutationFn: (dados: LivroInput) => window.api.livros.salvar(dados)
  })

  function trocarModo(novoModo: Modo): void {
    setModo(novoModo)
    setResultado(null)
  }

  async function salvarComVerificacao(dados: LivroInput): Promise<number> {
    const duplicado = await window.api.livros.verificarDuplicado({
      isbn10: dados.isbn10,
      isbn13: dados.isbn13,
      titulo: dados.titulo,
      autores: dados.autores
    })
    if (duplicado) {
      const continuar = window.confirm(
        `Já existe "${duplicado.titulo}" na biblioteca (mesmo ISBN ou título/autor). Cadastrar mesmo assim?`
      )
      if (!continuar) return -1
    }

    const id = await mutation.mutateAsync(dados)
    if (resultado?.capaUrlExterna) {
      await window.api.livros.salvarCapaPorUrl({ livroId: id, url: resultado.capaUrlExterna })
    }
    queryClient.invalidateQueries({ queryKey: ['livros'] })
    navigate(`/livros/${id}`)
    return id
  }

  const mostrarFormulario = modo === 'manual' || resultado !== null

  return (
    <div className="p-8">
      <h2 className="mb-2 font-serif text-2xl text-stone-900">Adicionar livro</h2>
      <p className="mb-6 text-sm text-stone-500">
        Busque por ISBN ou por título/autor para preencher automaticamente, ou cadastre manualmente.
      </p>

      <div className="mb-6 flex gap-1 border-b border-stone-200">
        {ABAS.map((aba) => (
          <button
            key={aba.modo}
            type="button"
            onClick={() => trocarModo(aba.modo)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              modo === aba.modo
                ? 'border-stone-900 font-medium text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      {!mostrarFormulario && modo === 'isbn' && <BuscaIsbn onEncontrado={setResultado} />}
      {!mostrarFormulario && modo === 'buscar' && <BuscaTexto onSelecionar={setResultado} />}

      {mostrarFormulario && (
        <>
          {resultado && (
            <button
              type="button"
              onClick={() => setResultado(null)}
              className="mb-4 text-sm text-stone-600 underline"
            >
              ← Buscar outro livro
            </button>
          )}
          <LivroForm
            key={resultado?.isbn13 ?? resultado?.titulo ?? 'manual'}
            valoresIniciais={resultado ?? undefined}
            onSalvar={salvarComVerificacao}
            salvando={mutation.isPending}
          />
        </>
      )}
    </div>
  )
}
