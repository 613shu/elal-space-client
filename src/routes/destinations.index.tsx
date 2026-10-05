import { createFileRoute } from '@tanstack/react-router'
import { DestinationChapter } from '~/components/home/DestinationChapter'
import { Eyebrow } from '~/components/ui/Eyebrow'
import { DESTINATIONS } from '~/lib/content/destinations'
import { pageHead } from '~/lib/seo'

export const Route = createFileRoute('/destinations/')({
  head: () => pageHead('יעדים', 'הירח, מאדים, שבתאי, אירופה ותחנת המסלול: כל יעד, כל מסע, כל מה שצריך לדעת.'),
  component: DestinationsPage,
})

function DestinationsPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-8 pt-32 sm:px-8 lg:pt-40">
      <header className="flex max-w-3xl flex-col gap-5">
        <Eyebrow>יעדים</Eyebrow>
        <h1 className="text-headline">היכן תרצו להתעורר?</h1>
        <p className="text-lead text-foreground-muted">
          כל יעד הוא עולם שלם: כבידה אחרת, אור אחר, ושקט שאין לו דומה. בחרו אחד, ונדאג לשאר.
        </p>
      </header>
      <div className="mt-10 divide-y divide-border">
        {DESTINATIONS.map((d, i) => (
          <DestinationChapter key={d.slug} d={d} index={i} />
        ))}
      </div>
    </div>
  )
}
