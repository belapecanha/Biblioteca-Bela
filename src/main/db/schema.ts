import { sql } from 'drizzle-orm'
import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const editoras = sqliteTable('editoras', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull().unique()
})

export const series = sqliteTable('series', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  totalVolumes: integer('total_volumes')
})

export const autores = sqliteTable('autores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull().unique()
})

export const marcadores = sqliteTable('marcadores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tipo: text('tipo').notNull(), // genero | tema | tag
  nome: text('nome').notNull()
})

export const estantes = sqliteTable('estantes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  ordem: integer('ordem').notNull().default(0)
})

export const livros = sqliteTable(
  'livros',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    titulo: text('titulo').notNull(),
    subtitulo: text('subtitulo'),
    tituloOriginal: text('titulo_original'),
    isbn10: text('isbn10'),
    isbn13: text('isbn13'),
    editoraId: integer('editora_id').references(() => editoras.id),
    anoEdicao: integer('ano_edicao'),
    anoOriginal: integer('ano_original'),
    edicao: text('edicao'),
    paginas: integer('paginas'),
    idioma: text('idioma'),
    formatoEdicao: text('formato_edicao'), // fisico | ebook | audiolivro
    sinopse: text('sinopse'),
    capaArquivo: text('capa_arquivo'),
    corDominante: text('cor_dominante'),
    serieId: integer('serie_id').references(() => series.id),
    numeroVolume: real('numero_volume'),
    statusAtual: text('status_atual').notNull().default('quero_ler'), // quero_ler | lendo | lido | pausado | abandonado
    favorito: integer('favorito', { mode: 'boolean' }).notNull().default(false),
    posse: text('posse').notNull().default('nao_tenho'), // tenho | nao_tenho | ja_tive
    prioridadeDesejo: text('prioridade_desejo'), // alta | media | baixa
    anotacoes: text('anotacoes'),
    notasPrivadas: text('notas_privadas'),
    goodreadsId: text('goodreads_id'),
    dataAdicao: text('data_adicao').notNull().default(sql`CURRENT_TIMESTAMP`),
    criadoEm: text('criado_em').notNull().default(sql`CURRENT_TIMESTAMP`),
    atualizadoEm: text('atualizado_em').notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (t) => [index('idx_livros_isbn13').on(t.isbn13), index('idx_livros_status').on(t.statusAtual)]
)

export const livroAutores = sqliteTable(
  'livro_autores',
  {
    livroId: integer('livro_id')
      .notNull()
      .references(() => livros.id, { onDelete: 'cascade' }),
    autorId: integer('autor_id')
      .notNull()
      .references(() => autores.id, { onDelete: 'cascade' }),
    papel: text('papel').notNull().default('autor') // autor | tradutor | ilustrador
  },
  (t) => [primaryKey({ columns: [t.livroId, t.autorId, t.papel] })]
)

export const livroMarcadores = sqliteTable(
  'livro_marcadores',
  {
    livroId: integer('livro_id')
      .notNull()
      .references(() => livros.id, { onDelete: 'cascade' }),
    marcadorId: integer('marcador_id')
      .notNull()
      .references(() => marcadores.id, { onDelete: 'cascade' })
  },
  (t) => [primaryKey({ columns: [t.livroId, t.marcadorId] })]
)

export const livroEstantes = sqliteTable(
  'livro_estantes',
  {
    livroId: integer('livro_id')
      .notNull()
      .references(() => livros.id, { onDelete: 'cascade' }),
    estanteId: integer('estante_id')
      .notNull()
      .references(() => estantes.id, { onDelete: 'cascade' })
  },
  (t) => [primaryKey({ columns: [t.livroId, t.estanteId] })]
)

export const leituras = sqliteTable(
  'leituras',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    livroId: integer('livro_id')
      .notNull()
      .references(() => livros.id, { onDelete: 'cascade' }),
    formatoLido: text('formato_lido'), // fisico | ebook | audiolivro
    status: text('status').notNull(),
    dataInicio: text('data_inicio'),
    dataFim: text('data_fim'),
    paginaAtual: integer('pagina_atual'),
    nota: real('nota'),
    resenha: text('resenha')
  },
  (t) => [index('idx_leituras_data_fim').on(t.dataFim), index('idx_leituras_livro').on(t.livroId)]
)

export const metas = sqliteTable('metas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ano: integer('ano').notNull(),
  tipo: text('tipo').notNull(), // livros | paginas
  alvo: integer('alvo').notNull()
})

export const configuracoes = sqliteTable('configuracoes', {
  chave: text('chave').primaryKey(),
  valor: text('valor')
})
