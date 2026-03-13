import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Calendar, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  PlayCircle, 
  MessageSquare,
  Repeat2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStudyStore } from '@/stores/useStudyStore'

export const DashboardPage = () => {
  const { readinessScore, weakTopics, revisionQueue } = useStudyStore()

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, Scholar</h1>
        <p className="text-muted-foreground">Here is your daily AI learning overview.</p>
      </div>

      {/* Top 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Exam Countdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4 days</div>
            <p className="text-sm text-muted-foreground mt-1">Data Structures Exam</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" /> Readiness Gauge
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-extrabold text-primary">{readinessScore}%</div>
              <div className="text-sm font-medium text-emerald-500 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" /> On Track
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Predicted exam score</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-orange-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Weak Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mt-1">
              {weakTopics.slice(0, 2).map(t => (
                <div key={t.id} className="text-sm font-medium p-2 bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-md">
                  {t.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Center Hero Button (The WOW Screen trigger) */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full"
      >
        <Button 
          size="lg" 
          className="w-full h-auto py-8 rounded-2xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl shadow-primary/20 flex flex-col items-center justify-center gap-3 border border-white/10"
        >
          <div className="flex items-center gap-3 text-2xl font-bold">
            <Zap className="w-8 h-8 fill-current text-yellow-300" />
            Generate Entire Study System
          </div>
          <span className="text-primary-foreground/80 font-medium text-sm md:text-base">
            Create roadmap • quizzes • schedule • revision queue
          </span>
        </Button>
      </motion.div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat2 className="w-5 h-5 text-blue-500" /> Next Reviews
            </CardTitle>
            <CardDescription>SM-2 spaced repetition queue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {revisionQueue.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-muted-foreground">Review in 12 minutes</div>
                </div>
                <Link to="/revision">
                  <Button variant="secondary" size="sm">Review Now</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/upload" className="w-full">
              <Button variant="outline" className="w-full justify-start h-12">
                <Upload className="w-5 h-5 mr-3 text-muted-foreground" />
                Upload New Material
              </Button>
            </Link>
            <Link to="/quiz" className="w-full">
              <Button variant="outline" className="w-full justify-start h-12">
                <PlayCircle className="w-5 h-5 mr-3 text-primary" />
                Start Smart Quiz
              </Button>
            </Link>
            <Link to="/tutor" className="w-full">
              <Button variant="outline" className="w-full justify-start h-12">
                <MessageSquare className="w-5 h-5 mr-3 text-blue-500" />
                Ask AI Tutor
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
