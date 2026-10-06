import { Dialog } from '~/components/ui/Dialog'
import { WeightCalculator } from './WeightCalculator'

/** מחשבון "כמה תשקלו שם?" כחלון: זמין מהכותרת העליונה בכל עמוד */
export function WeightDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="כמה תשקלו שם?"
      description="המסה שלכם נשארת זהה בכל מקום. מה שמשתנה הוא הכבידה, ואיתה מה שהמאזניים אומרים."
      className="w-[min(96vw,58rem)]"
    >
      {open && <WeightCalculator embedded />}
    </Dialog>
  )
}
