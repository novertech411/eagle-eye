export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="dashboard-heading">
      <h1 className="text-balance">{title}</h1>
      {subtitle ? <p className="dashboard-description">{subtitle}</p> : null}
    </header>
  )
}

export function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`dashboard-card min-w-0 p-5 text-card-foreground md:p-6 ${className}`}
    >
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="clinic-section-title">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}
