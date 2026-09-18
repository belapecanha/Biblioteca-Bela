CREATE TABLE `autores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `autores_nome_unique` ON `autores` (`nome`);--> statement-breakpoint
CREATE TABLE `configuracoes` (
	`chave` text PRIMARY KEY NOT NULL,
	`valor` text
);
--> statement-breakpoint
CREATE TABLE `editoras` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `editoras_nome_unique` ON `editoras` (`nome`);--> statement-breakpoint
CREATE TABLE `estantes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`descricao` text,
	`ordem` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leituras` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`livro_id` integer NOT NULL,
	`formato_lido` text,
	`status` text NOT NULL,
	`data_inicio` text,
	`data_fim` text,
	`pagina_atual` integer,
	`nota` real,
	`resenha` text,
	FOREIGN KEY (`livro_id`) REFERENCES `livros`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_leituras_data_fim` ON `leituras` (`data_fim`);--> statement-breakpoint
CREATE INDEX `idx_leituras_livro` ON `leituras` (`livro_id`);--> statement-breakpoint
CREATE TABLE `livro_autores` (
	`livro_id` integer NOT NULL,
	`autor_id` integer NOT NULL,
	`papel` text DEFAULT 'autor' NOT NULL,
	PRIMARY KEY(`livro_id`, `autor_id`, `papel`),
	FOREIGN KEY (`livro_id`) REFERENCES `livros`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`autor_id`) REFERENCES `autores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `livro_estantes` (
	`livro_id` integer NOT NULL,
	`estante_id` integer NOT NULL,
	PRIMARY KEY(`livro_id`, `estante_id`),
	FOREIGN KEY (`livro_id`) REFERENCES `livros`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`estante_id`) REFERENCES `estantes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `livro_marcadores` (
	`livro_id` integer NOT NULL,
	`marcador_id` integer NOT NULL,
	PRIMARY KEY(`livro_id`, `marcador_id`),
	FOREIGN KEY (`livro_id`) REFERENCES `livros`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`marcador_id`) REFERENCES `marcadores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `livros` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`titulo` text NOT NULL,
	`subtitulo` text,
	`titulo_original` text,
	`isbn10` text,
	`isbn13` text,
	`editora_id` integer,
	`ano_edicao` integer,
	`ano_original` integer,
	`edicao` text,
	`paginas` integer,
	`idioma` text,
	`formato_edicao` text,
	`sinopse` text,
	`capa_arquivo` text,
	`cor_dominante` text,
	`serie_id` integer,
	`numero_volume` real,
	`status_atual` text DEFAULT 'quero_ler' NOT NULL,
	`favorito` integer DEFAULT false NOT NULL,
	`posse` text DEFAULT 'nao_tenho' NOT NULL,
	`prioridade_desejo` text,
	`anotacoes` text,
	`notas_privadas` text,
	`goodreads_id` text,
	`data_adicao` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`criado_em` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`atualizado_em` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`editora_id`) REFERENCES `editoras`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`serie_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_livros_isbn13` ON `livros` (`isbn13`);--> statement-breakpoint
CREATE INDEX `idx_livros_status` ON `livros` (`status_atual`);--> statement-breakpoint
CREATE TABLE `marcadores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tipo` text NOT NULL,
	`nome` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `metas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ano` integer NOT NULL,
	`tipo` text NOT NULL,
	`alvo` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `series` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`total_volumes` integer
);
