import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import type { LivroDetalhe, LivroInput } from '@shared/types'
import { TagInput } from './TagInput'

const numeroOpcional = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number().optional()
)

const schema = z.object({
  titulo: z.string().min(1, 'Informe o título'),
  subtitulo: z.string().optional(),
  tituloOriginal: z.string().optional(),
  autores: z.array(z.string()).min(1, 'Informe pelo menos um autor'),
  tradutor: z.array(z.string()).optional(),
  ilustrador: z.array(z.string()).optional(),
  isbn10: z.string().optional(),
  isbn13: z.string().optional(),
  serie: z.string().optional(),
  numeroVolume: numeroOpcional,
  editora: z.string().optional(),
  anoEdicao: numeroOpcional,
  anoOriginal: numeroOpcional,
  edicao: z.string().optional(),
  paginas: numeroOpcional,
  idioma: z.string().optional(),
  formatoEdicao: z.string().optional(),
  sinopse: z.string().optional(),
  generos: z.array(z.string()).optional(),
  temas: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  posse: z.enum(['tenho', 'nao_tenho', 'ja_tive'])
})

type FormValues = z.infer<typeof schema>

const valoresVazios: FormValues = {
  titulo: '',
  autores: [],
  tradutor: [],
  ilustrador: [],
  generos: [],
  temas: [],
  tags: [],
  posse: 'nao_tenho'
}

function mesclarComPadrao(parcial?: Partial<LivroInput>): FormValues {
  if (!parcial) return valoresVazios
  return {
    ...valoresVazios,
    ...parcial,
    autores: parcial.autores ?? [],
    tradutor: parcial.tradutor ?? [],
    ilustrador: parcial.ilustrador ?? [],
    generos: parcial.generos ?? [],
    temas: parcial.temas ?? [],
    tags: parcial.tags ?? [],
    formatoEdicao: parcial.formatoEdicao ?? ''
  }
}

function paraFormulario(livro: LivroDetalhe): FormValues {
  return {
    titulo: livro.titulo,
    subtitulo: livro.subtitulo ?? '',
    tituloOriginal: livro.tituloOriginal ?? '',
    autores: livro.autores,
    tradutor: livro.tradutor,
    ilustrador: livro.ilustrador,
    isbn10: livro.isbn10 ?? '',
    isbn13: livro.isbn13 ?? '',
    serie: livro.serie,
    numeroVolume: livro.numeroVolume ?? undefined,
    editora: livro.editora,
    anoEdicao: livro.anoEdicao ?? undefined,
    anoOriginal: livro.anoOriginal ?? undefined,
    edicao: livro.edicao ?? '',
    paginas: livro.paginas ?? undefined,
    idioma: livro.idioma ?? '',
    formatoEdicao: livro.formatoEdicao ?? '',
    sinopse: livro.sinopse ?? '',
    generos: livro.generos,
    temas: livro.temas,
    tags: livro.tags,
    posse: livro.posse
  }
}

interface LivroFormProps {
  livro?: LivroDetalhe
  valoresIniciais?: Partial<LivroInput>
  onSalvar: (dados: LivroInput) => Promise<number>
  salvando: boolean
}

const inputClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500'

function Campo({ label, erro, children }: { label: string; erro?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      {children}
      {erro && <p className="mt-1 text-xs text-red-500">{erro}</p>}
    </label>
  )
}

export function LivroForm({ livro, valoresIniciais, onSalvar, salvando }: LivroFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    // @hookform/resolvers + zod 4 geram um tipo de Resolver estruturalmente
    // igual mas nominalmente distinto do esperado pelo react-hook-form 7 no
    // TypeScript 6; o cast é só para o checker, o comportamento em runtime
    // é o mesmo.
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: livro ? paraFormulario(livro) : mesclarComPadrao(valoresIniciais)
  })

  async function onSubmit(dados: FormValues): Promise<void> {
    await onSalvar({
      ...dados,
      formatoEdicao: dados.formatoEdicao ? (dados.formatoEdicao as LivroInput['formatoEdicao']) : undefined,
      id: livro?.id
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <fieldset className="space-y-3">
        <legend className="font-serif text-lg text-stone-900">Identificação</legend>
        <Campo label="Título" erro={errors.titulo?.message}>
          <input {...register('titulo')} className={inputClass} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Subtítulo">
            <input {...register('subtitulo')} className={inputClass} />
          </Campo>
          <Campo label="Título original">
            <input {...register('tituloOriginal')} className={inputClass} />
          </Campo>
        </div>
        <Controller
          name="autores"
          control={control}
          render={({ field }) => (
            <TagInput label="Autor(es)" value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.autores && <p className="text-xs text-red-500">{errors.autores.message as string}</p>}
        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="tradutor"
            control={control}
            render={({ field }) => (
              <TagInput label="Tradutor" value={field.value ?? []} onChange={field.onChange} />
            )}
          />
          <Controller
            name="ilustrador"
            control={control}
            render={({ field }) => (
              <TagInput label="Ilustrador" value={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="ISBN-10">
            <input {...register('isbn10')} className={inputClass} />
          </Campo>
          <Campo label="ISBN-13">
            <input {...register('isbn13')} className={inputClass} />
          </Campo>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Série">
            <input {...register('serie')} className={inputClass} />
          </Campo>
          <Campo label="Número do volume">
            <input type="number" step="0.1" {...register('numeroVolume')} className={inputClass} />
          </Campo>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-serif text-lg text-stone-900">Edição</legend>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Editora">
            <input {...register('editora')} className={inputClass} />
          </Campo>
          <Campo label="Edição">
            <input {...register('edicao')} placeholder='ex.: "2ª edição"' className={inputClass} />
          </Campo>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Campo label="Ano da edição">
            <input type="number" {...register('anoEdicao')} className={inputClass} />
          </Campo>
          <Campo label="Ano original">
            <input type="number" {...register('anoOriginal')} className={inputClass} />
          </Campo>
          <Campo label="Páginas">
            <input type="number" {...register('paginas')} className={inputClass} />
          </Campo>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Idioma">
            <input {...register('idioma')} className={inputClass} />
          </Campo>
          <Campo label="Formato da edição">
            <select {...register('formatoEdicao')} className={inputClass}>
              <option value="">Selecione</option>
              <option value="fisico">Físico</option>
              <option value="ebook">E-book</option>
              <option value="audiolivro">Audiolivro</option>
            </select>
          </Campo>
        </div>
        <Campo label="Sinopse">
          <textarea {...register('sinopse')} rows={4} className={inputClass} />
        </Campo>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-serif text-lg text-stone-900">Classificação</legend>
        <div className="grid grid-cols-3 gap-3">
          <Controller
            name="generos"
            control={control}
            render={({ field }) => (
              <TagInput label="Gêneros" value={field.value ?? []} onChange={field.onChange} />
            )}
          />
          <Controller
            name="temas"
            control={control}
            render={({ field }) => (
              <TagInput label="Temas" value={field.value ?? []} onChange={field.onChange} />
            )}
          />
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <TagInput label="Tags" value={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-serif text-lg text-stone-900">Posse</legend>
        <Campo label="Eu possuo este livro?">
          <select {...register('posse')} className={inputClass}>
            <option value="tenho">Tenho</option>
            <option value="nao_tenho">Não tenho</option>
            <option value="ja_tive">Já tive</option>
          </select>
        </Campo>
      </fieldset>

      <button
        type="submit"
        disabled={salvando}
        className="rounded-lg bg-stone-900 px-5 py-2 text-sm text-white disabled:opacity-50"
      >
        {salvando ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  )
}
