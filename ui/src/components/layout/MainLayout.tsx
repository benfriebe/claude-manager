interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return <div className="flex flex-1 overflow-hidden">{children}</div>
}
