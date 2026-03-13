import { useMemo } from 'react'
import { Calendar, Clock, BookOpen, Target, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { useStudyStore } from '@/stores/useStudyStore'
import { useUserStore } from '@/stores/useUserStore'

export const PlannerPage = () => {
  const weakTopics = useStudyStore(state => state.weakTopics)
  const roadmap = useStudyStore(state => state.roadmap)
  const user = useUserStore(state => state.user)

  // Generate real dates relative to today — Fix #9
  const schedule = useMemo(() => {
    const topics = weakTopics.length > 0 ? weakTopics : roadmap.slice(0, 5)
    if (topics.length === 0) return []

    const activities = ['Deep Dive', 'Practice Problems', 'Review & Flashcards', 'Quiz Yourself']
    const today = new Date()

    return topics.map((topic, i) => {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        topic: topic.label,
        difficulty: topic.difficulty,
        mastery: topic.mastery,
        duration: topic.difficulty === 'hard' ? 3 : topic.difficulty === 'medium' ? 2 : 1.5,
        activity: activities[i % activities.length],
      }
    })
  }, [weakTopics, roadmap])

  if (schedule.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
        <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">No Study Plan Yet</h2>
        <p className="text-muted-foreground max-w-sm mt-2 mb-6">
          Upload a syllabus first to generate your personalized study schedule.
        </p>
        <Link to="/upload">
          <Button>Upload Syllabus</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📅 Study Planner</h1>
          <p className="text-muted-foreground mt-1">
            Personalized schedule for {user?.subject || 'your subject'} based on your weak areas.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Topics to Cover</div>
              <div className="text-xl font-bold">{schedule.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Hours</div>
              <div className="text-xl font-bold">{schedule.reduce((s, d) => s + d.duration, 0).toFixed(1)}h</div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Hard Topics</div>
              <div className="text-xl font-bold">{schedule.filter(s => s.difficulty === 'hard').length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10">
              <Target className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Avg Mastery</div>
              <div className="text-xl font-bold">
                {schedule.length > 0 ? Math.round(schedule.reduce((s, d) => s + d.mastery, 0) / schedule.length) : 0}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Cards */}
      <div className="space-y-4">
        {schedule.map((session, i) => (
          <Card key={i} className="shadow-sm hover:shadow-md transition-shadow border-l-4" style={{
            borderLeftColor: session.difficulty === 'hard' ? '#ef4444' : session.difficulty === 'medium' ? '#eab308' : '#22c55e'
          }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <div className="text-xs text-muted-foreground font-medium">{session.date.split(',')[0]}</div>
                    <div className="text-sm font-bold">{session.date.split(' ').slice(1).join(' ')}</div>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div>
                    <h3 className="font-bold">{session.topic}</h3>
                    <p className="text-xs text-muted-foreground">{session.activity} • {session.duration}h</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={session.difficulty === 'hard' ? 'destructive' : 'secondary'}
                    className="capitalize text-xs"
                  >
                    {session.difficulty}
                  </Badge>
                  <div className="text-sm font-mono text-muted-foreground">{session.mastery}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
