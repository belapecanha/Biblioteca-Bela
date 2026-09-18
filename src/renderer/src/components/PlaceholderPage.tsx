export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h2 className="font-serif text-2xl text-stone-900">{title}</h2>
      <p className="mt-2 text-sm text-stone-500">Em construção — chega em uma próxima fase.</p>
    </div>
  )
}
