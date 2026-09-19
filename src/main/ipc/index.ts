import { registerAppHandlers } from './app'
import { registerBuscaHandlers } from './busca'
import { registerLivrosHandlers } from './livros'

// Cada funcionalidade (livros, estatisticas, estante, importacao...) ganha
// seu proprio arquivo aqui conforme for implementada nas proximas fases.
export function registerIpcHandlers(): void {
  registerAppHandlers()
  registerLivrosHandlers()
  registerBuscaHandlers()
}
