import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import type { LivroInput } from '@shared/types'
import { CapaUpload } from '../components/CapaUpload'
import { LivroForm } from '../components/LivroForm'

const ROTULOS_FORMATO: Record<string, string> = { fisico: 'Físico', ebook: 'E-book', audiolivro: 'Audiolivro' }
const ROTULOS_POSSE: Record<string, string> = { tenho: 'Tenho', nao_tenho: 'Não tenho', ja_tive: 'Já tive' }

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-stone-900">{valor}</dd>
    </div>
  )
}

export function LivroDetalhe() {
  const { id } = useParams()
  const livroId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editando, setEditando] = useState(false)

  const { data: livro, isLoading } = useQuery({
    queryKey: ['livros', livroId],
    queryFn: () => window.api.livros.obter(livroId)
  })

  const salvar = useMutation({
    mutationFn: (dados: LivroInput) => window.api.livros.salvar(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livros'] })
      setEditando(false)
    }
  })

  const excluir = useMutation({
    mutationFn: () => window.api.livros.excluir(livroId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livros'] })
      navigate('/biblioteca')
    }
  })

  function confirmarExclusao(): void {
    if (window.confirm('Excluir este livro? Essa ação não pode ser desfeita.')) {
      excluir.mutate()
    }
  }

  if (isLoading) return <div className="p-8 text-sm text-stone-500">Carregando...</div>
  if (!livro) return <div className="p-8 text-sm text-stone-500">Livro não encontrado.</div>

  return (
    <div className="flex gap-8 p-8">
      <CapaUpload
        livroId={livro.id}
        capaUrl={livro.capaUrl}
        titulo={livro.titulo}
        autor={livro.autores[0]}
        onChanged={() => queryClient.invalidateQueries({ queryKey: ['livros', livroId] })}
      />

      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-stone-900">{livro.titulo}</h2>
          <div className="flex gap-3 text-sm">
            <button type="button" onClick={() => setEditando((v) => !v)} className="text-stone-600 underline">
              {editando ? 'Cancelar' : 'Editar'}
            </button>
            <button type="button" onClick={confirmarExclusao} className="text-red-500 underline">
              Excluir
            </button>
          </div>
        </div>

        {editando ? (
          <LivroForm livro={livro} onSalvar={(dados) => salvar.mutateAsync(dados)} salvando={salvar.isPending} />
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Info label="Autor(es)" valor={livro.autores.join(', ') || '—'} />
            <Info label="Editora" valor={livro.editora || '—'} />
            <Info label="Ano" valor={livro.anoEdicao?.toString() ?? '—'} />
            <Info label="Páginas" valor={livro.paginas?.toString() ?? '—'} />
            <Info label="Formato" valor={(livro.formatoEdicao && ROTULOS_FORMATO[livro.formatoEdicao]) || '—'} />
            <Info label="Idioma" valor={livro.idioma || '—'} />
            <Info label="ISBN-13" valor={livro.isbn13 || '—'} />
            <Info label="Posse" valor={ROTULOS_POSSE[livro.posse]} />
            <Info label="Gêneros" valor={livro.generos.join(', ') || '—'} />
            <Info label="Temas" valor={livro.temas.join(', ') || '—'} />
            <Info label="Tags" valor={livro.tags.join(', ') || '—'} />
            {livro.sinopse && (
              <div className="col-span-2">
                <dt className="text-stone-500">Sinopse</dt>
                <dd className="mt-1 text-stone-900">{livro.sinopse}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  )
}
