import { ipcMain } from 'electron'
import type {
  LivroInput,
  SalvarCapaPayload,
  SalvarCapaPorUrlPayload,
  VerificarDuplicadoInput
} from '../../shared/types'
import {
  excluirLivro,
  listarLivros,
  obterLivro,
  removerCapa,
  salvarCapa,
  salvarCapaPorUrl,
  salvarLivro,
  verificarDuplicado
} from '../db/livros'

export function registerLivrosHandlers(): void {
  ipcMain.handle('livros:listar', () => listarLivros())
  ipcMain.handle('livros:obter', (_e, id: number) => obterLivro(id))
  ipcMain.handle('livros:salvar', (_e, input: LivroInput) => salvarLivro(input))
  ipcMain.handle('livros:excluir', (_e, id: number) => excluirLivro(id))
  ipcMain.handle('livros:salvarCapa', (_e, payload: SalvarCapaPayload) =>
    salvarCapa(payload.livroId, new Uint8Array(payload.bytes), payload.extensao)
  )
  ipcMain.handle('livros:removerCapa', (_e, id: number) => removerCapa(id))
  ipcMain.handle('livros:salvarCapaPorUrl', (_e, payload: SalvarCapaPorUrlPayload) =>
    salvarCapaPorUrl(payload.livroId, payload.url)
  )
  ipcMain.handle('livros:verificarDuplicado', (_e, input: VerificarDuplicadoInput) => verificarDuplicado(input))
}
