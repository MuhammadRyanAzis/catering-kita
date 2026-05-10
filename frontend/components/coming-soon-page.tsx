import Link from 'next/link'

import { Button } from '@/components/ui/button'

type ComingSoonPageProps = {
  title: string
  description: string
  backHref: string
  backLabel: string
}

export function ComingSoonPage({ title, description, backHref, backLabel }: ComingSoonPageProps) {
  return (
    <main className='min-h-screen bg-linear-to-b from-primary/5 via-background to-background px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl rounded-3xl border bg-card p-8 shadow-sm sm:p-10'>
        <p className='mb-4 inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground'>
          Segera Hadir
        </p>
        <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>{title}</h1>
        <p className='mt-3 text-sm text-muted-foreground sm:text-base'>{description}</p>

        <div className='mt-8 flex flex-wrap gap-3'>
          <Button asChild>
            <Link href={backHref}>{backLabel}</Link>
          </Button>
          <Button asChild variant='outline'>
            <Link href='/signin'>Ganti Akun</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
