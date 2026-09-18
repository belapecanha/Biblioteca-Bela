import { HashRouter, Route, Routes } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Estante } from './pages/Estante'
import { Biblioteca } from './pages/Biblioteca'
import { LivroDetalhe } from './pages/LivroDetalhe'
import { AdicionarLivro } from './pages/AdicionarLivro'
import { Desejos } from './pages/Desejos'
import { Series } from './pages/Series'
import { Estatisticas } from './pages/Estatisticas'
import { Metas } from './pages/Metas'
import { ImportarExportar } from './pages/ImportarExportar'
import { Configuracoes } from './pages/Configuracoes'

function App() {
  return (
    <HashRouter>
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/estante" element={<Estante />} />
            <Route path="/biblioteca" element={<Biblioteca />} />
            <Route path="/livros/:id" element={<LivroDetalhe />} />
            <Route path="/adicionar" element={<AdicionarLivro />} />
            <Route path="/desejos" element={<Desejos />} />
            <Route path="/series" element={<Series />} />
            <Route path="/estatisticas" element={<Estatisticas />} />
            <Route path="/metas" element={<Metas />} />
            <Route path="/importar-exportar" element={<ImportarExportar />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}

export default App
