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
  Repeat2,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStudyStore } from '@/stores/useStudyStore'
import { useUserStore } from '@/stores/useUserStore'

export const DashboardPage = () => {
  const { readinessScore, weakTopics, revisionQueue, currentMaterialId } = useStudyStore()
  const user = useUserStore(state => state.user)

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {user?.firstName || 'Scholar'}</h1>
          <p className="text-muted-foreground font-medium">Ready to master {user?.subject || 'your subjects'} today?</p>
        </div>
        {!currentMaterialId && (
          <Link to="/upload">
            <Button className="gap-2">
              <Upload className="w-4 h-4" /> Upload Initial Syllabus
            </Button>
          </Link>
        )}
      </div>

      {/* Top 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Study Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Daily Streak</div>
            <p className="text-sm text-muted-foreground mt-1">Keep the momentum going!</p>
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
                <CheckCircle2 className="w-4 h-4 mr-1" /> {readinessScore > 50 ? 'On Track' : 'Starting Out'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Predicted subject mastery</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-orange-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mt-1">
              {weakTopics.length > 0 ? (
                weakTopics.slice(0, 2).map(t => (
                  <div key={t.id} className="text-sm font-medium p-2 bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-md">
                    {t.label}
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground italic">No weak topics detected yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Center Hero Button */}
      {!currentMaterialId ? (
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Link to="/upload">
            <Button 
              size="lg" 
              className="w-full h-auto py-8 rounded-2xl bg-gradient-to-r from-primary to-purple-600 shadow-xl shadow-primary/20 flex flex-col items-center justify-center gap-3 border border-white/10"
            >
              <div className="flex items-center gap-3 text-2xl font-bold">
                <Zap className="w-8 h-8 fill-current text-yellow-300" />
                Analyze Your First Syllabus
              </div>
              <span className="text-primary-foreground/80 font-medium tracking-wide">
                Build your AI knowledge map and study plan instantly
              </span>
            </Button>
          </Link>
        </motion.div>
      ) : (
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Link to="/map">
            <Button 
              size="lg" 
              className="w-full h-auto py-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-primary shadow-xl shadow-emerald-500/10 flex flex-col items-center justify-center gap-3 border border-white/10"
            >
              <div className="flex items-center gap-3 text-2xl font-bold">
                <Sparkles className="w-8 h-8 fill-current text-emerald-300" />
                Resume Your Roadmap
              </div>
              <span className="text-primary-foreground/80 font-medium tracking-wide">
                {weakTopics.length} areas need your attention • Continue mastery flow
              </span>
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat2 className="w-5 h-5 text-blue-500" /> Mastery Queue
            </CardTitle>
            <CardDescription>Topic items prioritized for review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {revisionQueue.length > 0 ? (
              revisionQueue.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/40 font-medium">
                  <div>
                    <div className="">{item.label}</div>
                    <div className="text-xs text-muted-foreground">Mastery: {item.mastery}%</div>
                  </div>
                  <Link to="/quiz">
                    <Button variant="secondary" size="sm">Review Now</Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground italic border border-dashed rounded-lg">
                Your mastery queue is empty. Take a quiz to start!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Direct navigation to AI core tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/upload" className="w-full">
              <Button variant="outline" className="w-full justify-start h-12 font-medium">
                <Upload className="w-5 h-5 mr-3 text-muted-foreground" />
                Upload New Material
              </Button>
            </Link>
            <Link to="/quiz" className="w-full">
              <Button variant="outline" className="w-full justify-start h-12 font-medium">
                <PlayCircle className="w-5 h-5 mr-3 text-primary" />
                Start AI Quiz
              </Button>
            </Link>
            <Link to="/tutor" className="w-full">
              <Button variant="outline" className="w-full justify-start h-12 font-medium">
                <MessageSquare className="w-5 h-5 mr-3 text-blue-500" />
                Chat with AI Tutor
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

