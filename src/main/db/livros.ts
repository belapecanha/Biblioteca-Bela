import { and, eq, sql } from 'drizzle-orm'
import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { FormatoEdicao, LivroDetalhe, LivroInput, LivroResumo, Posse } from '../../shared/types'
import { capasDir, db } from './index'
import { autores, editoras, livroAutores, livroMarcadores, livros, marcadores, series } from './schema'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

function vazio<T>(valor: T | undefined | null | ''): T | null {
  return valor === undefined || valor === null || valor === '' ? null : valor
}

function capaUrl(nomeArquivo: string | null): string | null {
  if (!nomeArquivo) return null
  return `file://${join(capasDir, nomeArquivo).replace(/\\/g, '/')}`
}

function removerArquivoCapa(nomeArquivo: string | null): void {
  if (!nomeArquivo) return
  const caminho = join(capasDir, nomeArquivo)
  if (existsSync(caminho)) rmSync(caminho)
}

function autoresPorPapel(livroId: number, papel: string): string[] {
  return db
    .all<{ nome: string }>(
      sql`SELECT a.nome FROM livro_autores la JOIN autores a ON a.id = la.autor_id
          WHERE la.livro_id = ${livroId} AND la.papel = ${papel}`
    )
    .map((r) => r.nome)
}

function marcadoresPorTipo(livroId: number, tipo: string): string[] {
  return db
    .all<{ nome: string }>(
      sql`SELECT m.nome FROM livro_marcadores lm JOIN marcadores m ON m.id = lm.marcador_id
          WHERE lm.livro_id = ${livroId} AND m.tipo = ${tipo}`
    )
    .map((r) => r.nome)
}

function findOrCreateEditora(tx: Tx, nome: string): number {
  const existente = tx.select({ id: editoras.id }).from(editoras).where(eq(editoras.nome, nome)).get()
  if (existente) return existente.id
  return Number(tx.insert(editoras).values({ nome }).run().lastInsertRowid)
}

function findOrCreateSerie(tx: Tx, nome: string): number {
  const existente = tx.select({ id: series.id }).from(series).where(eq(series.nome, nome)).get()
  if (existente) return existente.id
  return Number(tx.insert(series).values({ nome }).run().lastInsertRowid)
}

function findOrCreateAutor(tx: Tx, nome: string): number {
  const existente = tx.select({ id: autores.id }).from(autores).where(eq(autores.nome, nome)).get()
  if (existente) return existente.id
  return Number(tx.insert(autores).values({ nome }).run().lastInsertRowid)
}

function findOrCreateMarcador(tx: Tx, tipo: string, nome: string): number {
  const existente = tx
    .select({ id: marcadores.id })
    .from(marcadores)
    .where(and(eq(marcadores.tipo, tipo), eq(marcadores.nome, nome)))
    .get()
  if (existente) return existente.id
  return Number(tx.insert(marcadores).values({ tipo, nome }).run().lastInsertRowid)
}

function linkAutores(tx: Tx, livroId: number, papel: string, nomes: string[]): void {
  for (const nome of nomes.map((n) => n.trim()).filter(Boolean)) {
    const autorId = findOrCreateAutor(tx, nome)
    tx.insert(livroAutores).values({ livroId, autorId, papel }).run()
  }
}

function linkMarcadores(tx: Tx, livroId: number, tipo: string, nomes: string[]): void {
  for (const nome of nomes.map((n) => n.trim()).filter(Boolean)) {
    const marcadorId = findOrCreateMarcador(tx, tipo, nome)
    tx.insert(livroMarcadores).values({ livroId, marcadorId }).run()
  }
}

export function listarLivros(): LivroResumo[] {
  const linhas = db.all<{
    id: number
    titulo: string
    autores: string | null
    anoEdicao: number | null
    formatoEdicao: FormatoEdicao | null
    posse: Posse
    capaArquivo: string | null
    dataAdicao: string
  }>(sql`
    SELECT l.id, l.titulo, l.ano_edicao as anoEdicao, l.formato_edicao as formatoEdicao,
           l.posse, l.capa_arquivo as capaArquivo, l.data_adicao as dataAdicao,
           (SELECT GROUP_CONCAT(a.nome, ', ') FROM livro_autores la
              JOIN autores a ON a.id = la.autor_id
              WHERE la.livro_id = l.id AND la.papel = 'autor') as autores
    FROM livros l
    ORDER BY l.titulo COLLATE NOCASE
  `)
  return linhas.map(({ capaArquivo, ...resto }) => ({ ...resto, capaUrl: capaUrl(capaArquivo) }))
}

export function obterLivro(id: number): LivroDetalhe | null {
  const livro = db.select().from(livros).where(eq(livros.id, id)).get()
  if (!livro) return null

  const editora = livro.editoraId
    ? db.select({ nome: editoras.nome }).from(editoras).where(eq(editoras.id, livro.editoraId)).get()
    : null
  const serie = livro.serieId
    ? db.select({ nome: series.nome }).from(series).where(eq(series.id, livro.serieId)).get()
    : null

  return {
    id: livro.id,
    titulo: livro.titulo,
    subtitulo: livro.subtitulo,
    tituloOriginal: livro.tituloOriginal,
    autores: autoresPorPapel(id, 'autor'),
    tradutor: autoresPorPapel(id, 'tradutor'),
    ilustrador: autoresPorPapel(id, 'ilustrador'),
    isbn10: livro.isbn10,
    isbn13: livro.isbn13,
    serie: serie?.nome ?? '',
    numeroVolume: livro.numeroVolume,
    editora: editora?.nome ?? '',
    anoEdicao: livro.anoEdicao,
    anoOriginal: livro.anoOriginal,
    edicao: livro.edicao,
    paginas: livro.paginas,
    idioma: livro.idioma,
    formatoEdicao: livro.formatoEdicao as FormatoEdicao | null,
    sinopse: livro.sinopse,
    generos: marcadoresPorTipo(id, 'genero'),
    temas: marcadoresPorTipo(id, 'tema'),
    tags: marcadoresPorTipo(id, 'tag'),
    posse: livro.posse as Posse,
    capaUrl: capaUrl(livro.capaArquivo),
    statusAtual: livro.statusAtual,
    criadoEm: livro.criadoEm,
    atualizadoEm: livro.atualizadoEm
  }
}

export function salvarLivro(input: LivroInput): number {
  return db.transaction((tx) => {
    const editoraId = input.editora?.trim() ? findOrCreateEditora(tx, input.editora.trim()) : null
    const serieId = input.serie?.trim() ? findOrCreateSerie(tx, input.serie.trim()) : null

    const valores = {
      titulo: input.titulo,
      subtitulo: vazio(input.subtitulo),
      tituloOriginal: vazio(input.tituloOriginal),
      isbn10: vazio(input.isbn10),
      isbn13: vazio(input.isbn13),
      editoraId,
      anoEdicao: vazio(input.anoEdicao),
      anoOriginal: vazio(input.anoOriginal),
      edicao: vazio(input.edicao),
      paginas: vazio(input.paginas),
      idioma: vazio(input.idioma),
      formatoEdicao: vazio(input.formatoEdicao),
      sinopse: vazio(input.sinopse),
      serieId,
      numeroVolume: vazio(input.numeroVolume),
      posse: input.posse,
      atualizadoEm: sql`CURRENT_TIMESTAMP`
    }

    let livroId = input.id
    if (livroId) {
      tx.update(livros).set(valores).where(eq(livros.id, livroId)).run()
      tx.delete(livroAutores).where(eq(livroAutores.livroId, livroId)).run()
      tx.delete(livroMarcadores).where(eq(livroMarcadores.livroId, livroId)).run()
    } else {
      const resultado = tx.insert(livros).values(valores).run()
      livroId = Number(resultado.lastInsertRowid)
    }

    linkAutores(tx, livroId, 'autor', input.autores)
    linkAutores(tx, livroId, 'tradutor', input.tradutor ?? [])
    linkAutores(tx, livroId, 'ilustrador', input.ilustrador ?? [])
    linkMarcadores(tx, livroId, 'genero', input.generos ?? [])
    linkMarcadores(tx, livroId, 'tema', input.temas ?? [])
    linkMarcadores(tx, livroId, 'tag', input.tags ?? [])

    return livroId
  })
}

export function excluirLivro(id: number): void {
  const livro = db.select({ capaArquivo: livros.capaArquivo }).from(livros).where(eq(livros.id, id)).get()
  removerArquivoCapa(livro?.capaArquivo ?? null)
  db.delete(livros).where(eq(livros.id, id)).run()
}

export function salvarCapa(livroId: number, bytes: Uint8Array, extensao: string): string | null {
  const livro = db.select({ capaArquivo: livros.capaArquivo }).from(livros).where(eq(livros.id, livroId)).get()
  removerArquivoCapa(livro?.capaArquivo ?? null)

  const extensaoLimpa = extensao.replace(/[^a-z0-9]/gi, '') || 'jpg'
  const nomeArquivo = `${livroId}-${Date.now()}.${extensaoLimpa}`
  writeFileSync(join(capasDir, nomeArquivo), Buffer.from(bytes))
  db.update(livros).set({ capaArquivo: nomeArquivo }).where(eq(livros.id, livroId)).run()
  return capaUrl(nomeArquivo)
}

export function removerCapa(livroId: number): void {
  const livro = db.select({ capaArquivo: livros.capaArquivo }).from(livros).where(eq(livros.id, livroId)).get()
  removerArquivoCapa(livro?.capaArquivo ?? null)
  db.update(livros).set({ capaArquivo: null }).where(eq(livros.id, livroId)).run()
}

export async function salvarCapaPorUrl(livroId: number, url: string): Promise<string | null> {
  const resposta = await fetch(url)
  if (!resposta.ok) return null
  const bytes = new Uint8Array(await resposta.arrayBuffer())
  const extensao = url.split('?')[0].split('.').pop() || 'jpg'
  return salvarCapa(livroId, bytes, extensao)
}

function obterResumoPorId(id: number): LivroResumo | null {
  return listarLivros().find((l) => l.id === id) ?? null
}

export function verificarDuplicado(input: {
  isbn10?: string
  isbn13?: string
  titulo: string
  autores: string[]
}): LivroResumo | null {
  if (input.isbn13) {
    const existente = db.select({ id: livros.id }).from(livros).where(eq(livros.isbn13, input.isbn13)).get()
    if (existente) return obterResumoPorId(existente.id)
  }
  if (input.isbn10) {
    const existente = db.select({ id: livros.id }).from(livros).where(eq(livros.isbn10, input.isbn10)).get()
    if (existente) return obterResumoPorId(existente.id)
  }

  const mesmoTitulo = db
    .all<{ id: number }>(sql`SELECT id FROM livros WHERE lower(titulo) = lower(${input.titulo})`)
  for (const { id } of mesmoTitulo) {
    const autoresExistentes = autoresPorPapel(id, 'autor').map((n) => n.toLowerCase())
    const temAutorEmComum = input.autores.some((a) => autoresExistentes.includes(a.toLowerCase()))
    if (temAutorEmComum) return obterResumoPorId(id)
  }

  return null
}
