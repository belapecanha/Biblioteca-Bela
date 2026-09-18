import { useParams } from 'react-router-dom'
import { PlaceholderPage } from '../components/PlaceholderPage'

export function LivroDetalhe() {
  const { id } = useParams()
  return <PlaceholderPage title={`Detalhe do livro #${id}`} />
}
