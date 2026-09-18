import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Início', end: true },
  { to: '/estante', label: 'Estante' },
  { to: '/biblioteca', label: 'Biblioteca' },
  { to: '/adicionar', label: 'Adicionar livro' },
  { to: '/desejos', label: 'Quero ler / Desejos' },
  { to: '/series', label: 'Séries' },
  { to: '/estatisticas', label: 'Estatísticas' },
  { to: '/metas', label: 'Metas' },
  { to: '/importar-exportar', label: 'Importar / Exportar' },
  { to: '/configuracoes', label: 'Configurações' }
]

export function Sidebar() {
  return (
    <nav className="flex h-screen w-56 shrink-0 flex-col gap-1 border-r border-stone-200 bg-white p-4">
      <h1 className="mb-4 font-serif text-xl text-stone-900">Minha Estante</h1>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
