import { registerAppHandlers } from './app'

// Cada funcionalidade (livros, estatisticas, estante, importacao...) ganha
// seu proprio arquivo aqui conforme for implementada nas proximas fases.
export function registerIpcHandlers(): void {
  registerAppHandlers()
}
