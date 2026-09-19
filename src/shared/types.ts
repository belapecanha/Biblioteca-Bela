export type FormatoEdicao = 'fisico' | 'ebook' | 'audiolivro'
export type Posse = 'tenho' | 'nao_tenho' | 'ja_tive'

export interface LivroInput {
  id?: number
  titulo: string
  subtitulo?: string
  tituloOriginal?: string
  autores: string[]
  tradutor?: string[]
  ilustrador?: string[]
  isbn10?: string
  isbn13?: string
  serie?: string
  numeroVolume?: number
  editora?: string
  anoEdicao?: number
  anoOriginal?: number
  edicao?: string
  paginas?: number
  idioma?: string
  formatoEdicao?: FormatoEdicao
  sinopse?: string
  generos?: string[]
  temas?: string[]
  tags?: string[]
  posse: Posse
}

export interface LivroResumo {
  id: number
  titulo: string
  autores: string | null
  anoEdicao: number | null
  formatoEdicao: FormatoEdicao | null
  posse: Posse
  capaUrl: string | null
  dataAdicao: string
}

export interface LivroDetalhe {
  id: number
  titulo: string
  subtitulo: string | null
  tituloOriginal: string | null
  autores: string[]
  tradutor: string[]
  ilustrador: string[]
  isbn10: string | null
  isbn13: string | null
  serie: string
  numeroVolume: number | null
  editora: string
  anoEdicao: number | null
  anoOriginal: number | null
  edicao: string | null
  paginas: number | null
  idioma: string | null
  formatoEdicao: FormatoEdicao | null
  sinopse: string | null
  generos: string[]
  temas: string[]
  tags: string[]
  posse: Posse
  capaUrl: string | null
  statusAtual: string
  criadoEm: string
  atualizadoEm: string
}

export interface SalvarCapaPayload {
  livroId: number
  bytes: ArrayBuffer
  extensao: string
}

export interface SalvarCapaPorUrlPayload {
  livroId: number
  url: string
}

export interface ResultadoBusca {
  titulo: string
  subtitulo?: string
  autores: string[]
  editora?: string
  anoEdicao?: number
  paginas?: number
  idioma?: string
  sinopse?: string
  isbn10?: string
  isbn13?: string
  generos?: string[]
  capaUrlExterna?: string
}

export interface BuscaPorTextoInput {
  titulo?: string
  autor?: string
}

export interface VerificarDuplicadoInput {
  isbn10?: string
  isbn13?: string
  titulo: string
  autores: string[]
}
