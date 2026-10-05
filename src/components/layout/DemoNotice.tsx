import { Link } from '@tanstack/react-router'
import type { ErrorKind } from '~/lib/api/errors'
import type { DataSource } from '~/lib/api/endpoints'
import { Badge } from '~/components/ui/Badge'
import { useIsAuthed } from '~/lib/auth/store'

const TEXT: Partial<Record<ErrorKind | 'mode', string>> = {
  mode: 'מצב הדגמה: הנתונים והתשלום מדומים.',
  network: 'השרת אינו זמין כרגע, ולכן מוצגים נתוני הדגמה.',
  unauthorized: 'צפייה בטיסות בשרת מחייבת התחברות, ולכן עד אז מוצגים נתוני הדגמה.',
  forbidden: 'אין הרשאה לצפות בטיסות בשרת, ולכן מוצגים נתוני הדגמה.',
  server: 'השרת החזיר שגיאה, ולכן מוצגים נתוני הדגמה.',
}

/** מופיע רק כשהנתונים אינם מהשרת: כדי שאף אחד לא יטעה בין הדגמה למציאות */
export function DemoNotice({ source, reason }: { source?: DataSource; reason?: ErrorKind }) {
  const authed = useIsAuthed()
  if (source !== 'demo') return null
  return (
    <div role="note" className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Badge tone="warning" dot>
        נתוני הדגמה
      </Badge>
      <span className="text-caption text-foreground-muted">{TEXT[reason ?? 'mode']}</span>
      {(reason === 'unauthorized' || reason === 'forbidden') && !authed && (
        <Link to="/account" className="text-caption text-primary underline underline-offset-4">
          כניסה לצפייה בטיסות אמיתיות
        </Link>
      )}
    </div>
  )
}
