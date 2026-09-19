import { contextBridge, ipcRenderer } from 'electron'
import type {
  BuscaPorTextoInput,
  LivroDetalhe,
  LivroInput,
  LivroResumo,
  ResultadoBusca,
  SalvarCapaPayload,
  SalvarCapaPorUrlPayload,
  VerificarDuplicadoInput
} from '@shared/types'

const api = {
  ping: (): Promise<{ ok: boolean; timestamp: string }> => ipcRenderer.invoke('app:ping'),
  livros: {
    listar: (): Promise<LivroResumo[]> => ipcRenderer.invoke('livros:listar'),
    obter: (id: number): Promise<LivroDetalhe | null> => ipcRenderer.invoke('livros:obter', id),
    salvar: (input: LivroInput): Promise<number> => ipcRenderer.invoke('livros:salvar', input),
    excluir: (id: number): Promise<void> => ipcRenderer.invoke('livros:excluir', id),
    salvarCapa: (payload: SalvarCapaPayload): Promise<string | null> =>
      ipcRenderer.invoke('livros:salvarCapa', payload),
    removerCapa: (id: number): Promise<void> => ipcRenderer.invoke('livros:removerCapa', id),
    salvarCapaPorUrl: (payload: SalvarCapaPorUrlPayload): Promise<string | null> =>
      ipcRenderer.invoke('livros:salvarCapaPorUrl', payload),
    verificarDuplicado: (input: VerificarDuplicadoInput): Promise<LivroResumo | null> =>
      ipcRenderer.invoke('livros:verificarDuplicado', input)
  },
  busca: {
    porIsbn: (isbn: string): Promise<ResultadoBusca | null> => ipcRenderer.invoke('busca:porIsbn', isbn),
    porTexto: (input: BuscaPorTextoInput): Promise<ResultadoBusca[]> => ipcRenderer.invoke('busca:porTexto', input)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
