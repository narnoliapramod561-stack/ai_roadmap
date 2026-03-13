import { Calendar as CalendarIcon, Clock, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const PlannerPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📅 Study Planner</h1>
          <p className="text-muted-foreground mt-1">AI-generated schedule tailored to your weak points.</p>
        </div>
        <Button className="gap-2 shadow-sm"><Zap className="w-4 h-4" /> Optimize Plan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { day: "Today", date: "Oct 24", topics: [{ name: "Maxwell Equations", time: "45 mins", type: "Re-learn" }, { name: "Gauss Law", time: "30 mins", type: "Practice" }] },
          { day: "Tomorrow", date: "Oct 25", topics: [{ name: "Ampere Law", time: "60 mins", type: "New Topic" }] },
          { day: "Wednesday", date: "Oct 26", topics: [{ name: "Mock Test 1", time: "90 mins", type: "Exam Format" }] },
        ].map((day) => (
          <Card key={day.day} className={day.day === 'Today' ? 'border-primary shadow-md' : 'shadow-sm'}>
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{day.day}</CardTitle>
                <span className="text-sm font-medium text-muted-foreground bg-background px-2 py-1 rounded-md border">{day.date}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {day.topics.map((t, idx) => (
                <div key={idx} className="flex items-start justify-between border-l-2 pl-3 py-1 border-primary/40 text-sm">
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-muted-foreground flex items-center gap-1 mt-0.5"><CalendarIcon className="w-3 h-3" /> {t.type}</div>
                  </div>
                  <div className="font-mono text-xs flex items-center gap-1 bg-muted px-2 py-1 rounded">
                    <Clock className="w-3 h-3" /> {t.time}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
