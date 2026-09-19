import { ipcMain } from 'electron'
import type { BuscaPorTextoInput, ResultadoBusca } from '../../shared/types'

// Identifica o app pra Open Library, que dá 3 req/s pra chamadas identificadas
// (User-Agent com nome+contato) contra 1 req/s pra chamadas anonimas. Sem chave.
const USER_AGENT_OPEN_LIBRARY = 'MinhaEstante/0.1 (app pessoal de catalogo de livros)'

// Conexoes com a Open Library ocasionalmente caem (ECONNRESET, timeout) mesmo
// quando o servico esta no ar; uma segunda tentativa resolve a maioria dos casos.
async function fetchOpenLibrary(url: string): Promise<Response> {
  let ultimoErro: unknown
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      return await fetch(url, { headers: { 'User-Agent': USER_AGENT_OPEN_LIBRARY } })
    } catch (erro) {
      ultimoErro = erro
    }
  }
  throw ultimoErro
}

// --- Open Library: fonte principal (sem chave, sem cota diaria) ---

interface DocBuscaOpenLibrary {
  title?: string
  author_name?: string[]
  publisher?: string[]
  first_publish_year?: number
  number_of_pages_median?: number
  language?: string[]
  isbn?: string[]
  cover_i?: number
}

interface EdicaoOpenLibrary {
  title?: string
  subtitle?: string
  authors?: { key: string }[]
  publishers?: string[]
  publish_date?: string
  number_of_pages?: number
  languages?: { key: string }[]
  isbn_10?: string[]
  isbn_13?: string[]
  covers?: number[]
}

function capaOpenLibraryPorId(coverId: number | undefined): string | undefined {
  return coverId && coverId > 0 ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : undefined
}

function mapearDocBusca(doc: DocBuscaOpenLibrary): ResultadoBusca | null {
  if (!doc.title) return null
  return {
    titulo: doc.title,
    autores: doc.author_name ?? [],
    editora: doc.publisher?.[0],
    anoEdicao: doc.first_publish_year,
    paginas: doc.number_of_pages_median,
    idioma: doc.language?.[0],
    isbn10: doc.isbn?.find((i) => i.length === 10),
    isbn13: doc.isbn?.find((i) => i.length === 13),
    capaUrlExterna: capaOpenLibraryPorId(doc.cover_i)
  }
}

async function nomeAutorOpenLibrary(key: string): Promise<string | null> {
  try {
    const resposta = await fetchOpenLibrary(`https://openlibrary.org${key}.json`)
    if (!resposta.ok) return null
    const dados = (await resposta.json()) as { name?: string }
    return dados.name ?? null
  } catch {
    return null
  }
}

async function buscarPorIsbnOpenLibrary(isbn: string): Promise<ResultadoBusca | null> {
  const resposta = await fetchOpenLibrary(`https://openlibrary.org/isbn/${isbn}.json`)
  if (resposta.status === 404) return null
  if (!resposta.ok) throw new Error('Não foi possível buscar agora (a Open Library respondeu com erro).')

  const edicao = (await resposta.json()) as EdicaoOpenLibrary
  if (!edicao.title) return null

  const autores = edicao.authors
    ? (await Promise.all(edicao.authors.map((a) => nomeAutorOpenLibrary(a.key)))).filter(
        (nome): nome is string => nome !== null
      )
    : []
  const ano = edicao.publish_date?.match(/\d{4}/)?.[0]

  return {
    titulo: edicao.title,
    subtitulo: edicao.subtitle,
    autores,
    editora: edicao.publishers?.[0],
    anoEdicao: ano ? Number(ano) : undefined,
    paginas: edicao.number_of_pages,
    idioma: edicao.languages?.[0]?.key.split('/').pop(),
    isbn10: edicao.isbn_10?.[0],
    isbn13: edicao.isbn_13?.[0],
    capaUrlExterna: capaOpenLibraryPorId(edicao.covers?.find((c) => c > 0))
  }
}

async function buscarPorTextoOpenLibrary(query: string): Promise<ResultadoBusca[]> {
  const campos = 'title,author_name,publisher,first_publish_year,number_of_pages_median,language,isbn,cover_i'
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=${campos}`
  const resposta = await fetchOpenLibrary(url)
  if (!resposta.ok) throw new Error('Não foi possível buscar agora (a Open Library respondeu com erro).')

  const dados = (await resposta.json()) as { docs?: DocBuscaOpenLibrary[] }
  return (dados.docs ?? []).map(mapearDocBusca).filter((r): r is ResultadoBusca => r !== null)
}

// --- Google Books: fallback quando a Open Library nao acha nada ---

interface VolumeGoogleBooks {
  volumeInfo?: {
    title?: string
    subtitle?: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    pageCount?: number
    language?: string
    description?: string
    categories?: string[]
    imageLinks?: { thumbnail?: string }
    industryIdentifiers?: { type: string; identifier: string }[]
  }
}

function mapearVolumeGoogle(volume: VolumeGoogleBooks): ResultadoBusca | null {
  const info = volume.volumeInfo
  if (!info?.title) return null

  const isbn10 = info.industryIdentifiers?.find((i) => i.type === 'ISBN_10')?.identifier
  const isbn13 = info.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier
  const ano = info.publishedDate ? Number(info.publishedDate.slice(0, 4)) : NaN

  return {
    titulo: info.title,
    subtitulo: info.subtitle,
    autores: info.authors ?? [],
    editora: info.publisher,
    anoEdicao: Number.isFinite(ano) ? ano : undefined,
    paginas: info.pageCount,
    idioma: info.language,
    sinopse: info.description,
    isbn10,
    isbn13,
    generos: info.categories?.flatMap((c) => c.split('/').map((s) => s.trim())),
    capaUrlExterna: info.imageLinks?.thumbnail?.replace(/^http:/, 'https:')
  }
}

async function buscarGoogleBooks(query: string): Promise<VolumeGoogleBooks[]> {
  // A cota anonima (sem chave) da Books API foi zerada pelo Google - sem uma
  // chave gratuita em GOOGLE_BOOKS_API_KEY (.env), toda chamada aqui vai falhar.
  const chave = process.env.GOOGLE_BOOKS_API_KEY
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10${chave ? `&key=${chave}` : ''}`
  let resposta: Response
  try {
    resposta = await fetch(url)
  } catch {
    throw new Error('Não foi possível buscar. Verifique sua conexão com a internet.')
  }
  if (resposta.status === 429) {
    throw new Error(
      chave
        ? 'Limite diário de buscas do Google Books atingido. Tente novamente mais tarde.'
        : 'O Google Books exige uma chave de API gratuita agora (a busca sem chave está desativada pelo Google). Veja o README para configurar GOOGLE_BOOKS_API_KEY.'
    )
  }
  if (!resposta.ok) {
    throw new Error('Não foi possível buscar agora (o Google Books respondeu com erro).')
  }
  const dados = (await resposta.json()) as { items?: VolumeGoogleBooks[] }
  return dados.items ?? []
}

async function buscarPorIsbnGoogleBooks(isbn: string): Promise<ResultadoBusca | null> {
  const volumes = await buscarGoogleBooks(`isbn:${isbn}`)
  return volumes.map(mapearVolumeGoogle).find((r): r is ResultadoBusca => r !== null) ?? null
}

async function buscarPorTextoGoogleBooks(query: string): Promise<ResultadoBusca[]> {
  const volumes = await buscarGoogleBooks(query)
  return volumes.map(mapearVolumeGoogle).filter((r): r is ResultadoBusca => r !== null)
}

// --- API publica: Open Library primeiro, Google Books so se a Open Library nao achar ---

export async function buscarPorIsbn(isbn: string): Promise<ResultadoBusca | null> {
  const limpo = isbn.replace(/[^0-9Xx]/g, '')
  if (!limpo) return null

  let falhouOpenLibrary = false
  try {
    const resultado = await buscarPorIsbnOpenLibrary(limpo)
    if (resultado) return resultado
  } catch (erro) {
    falhouOpenLibrary = true
    console.error('Busca na Open Library falhou, tentando Google Books:', erro)
  }

  try {
    return await buscarPorIsbnGoogleBooks(limpo)
  } catch (erroGoogle) {
    if (falhouOpenLibrary) {
      throw new Error(
        'Não foi possível buscar agora: a Open Library teve uma falha de conexão e o Google Books está sem cota. Tente novamente em alguns instantes.',
        { cause: erroGoogle }
      )
    }
    throw erroGoogle
  }
}

export async function buscarPorTexto({ titulo, autor }: BuscaPorTextoInput): Promise<ResultadoBusca[]> {
  // Query livre (sem intitle:/inauthor:) porque qualificadores por campo
  // restringem cada palavra ao campo exato e falham fácil com texto digitado
  // numa ordem/formato levemente diferente do catalogado.
  const partes = [titulo?.trim(), autor?.trim()].filter((parte): parte is string => Boolean(parte))
  if (partes.length === 0) return []
  const consulta = partes.join(' ')

  let falhouOpenLibrary = false
  try {
    const resultados = await buscarPorTextoOpenLibrary(consulta)
    if (resultados.length > 0) return resultados
  } catch (erro) {
    falhouOpenLibrary = true
    console.error('Busca na Open Library falhou, tentando Google Books:', erro)
  }

  try {
    return await buscarPorTextoGoogleBooks(consulta)
  } catch (erroGoogle) {
    if (falhouOpenLibrary) {
      throw new Error(
        'Não foi possível buscar agora: a Open Library teve uma falha de conexão e o Google Books está sem cota. Tente novamente em alguns instantes.',
        { cause: erroGoogle }
      )
    }
    throw erroGoogle
  }
}

export function registerBuscaHandlers(): void {
  ipcMain.handle('busca:porIsbn', (_e, isbn: string) => buscarPorIsbn(isbn))
  ipcMain.handle('busca:porTexto', (_e, input: BuscaPorTextoInput) => buscarPorTexto(input))
}
