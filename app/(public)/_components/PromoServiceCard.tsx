type Props = {
  icon: string
  title: string
  description: string
}

export default function PromoServiceCard({ icon, title, description }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
      <img src={icon} alt={title} className="w-10 h-10 mb-4" />
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
