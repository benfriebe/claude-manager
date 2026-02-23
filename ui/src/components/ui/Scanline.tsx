export function Scanline() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[999] overflow-hidden opacity-[0.02]">
      <div
        className="absolute inset-0 animate-scanline"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          height: '200%',
        }}
      />
    </div>
  )
}
