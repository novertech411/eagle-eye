import Image from 'next/image'
import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative h-11 w-[88px] shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-border">
        <Image
          src="/images/eagle-eye-logo.jpg"
          alt="Eagle Eye logo"
          fill
          sizes="88px"
          className="object-contain p-1"
        />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-extrabold tracking-wide text-foreground">EAGLE LENSE</p>
        <p className="text-[11px] text-muted-foreground">by Eagle Eye Tech Ltd</p>
      </div>
    </div>
  )
}
