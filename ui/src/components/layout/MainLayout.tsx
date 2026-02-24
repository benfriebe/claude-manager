interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return <div className="flex min-h-0 flex-1 overflow-hidden">{children}</div>
}
