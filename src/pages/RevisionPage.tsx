import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useStudyStore } from '@/stores/useStudyStore'
import { useUserStore } from '@/stores/useUserStore'
import { api } from '@/lib/api'
import { Link } from 'react-router-dom'

export const RevisionPage = () => {
  const revisionQueue = useStudyStore(state => state.revisionQueue)
  const roadmap = useStudyStore(state => state.roadmap)
  const setRoadmap = useStudyStore(state => state.setRoadmap)
  const user = useUserStore(state => state.user)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const handleReview = async (topicId: string, quality: number) => {
    setReviewingId(topicId)
    try {
      await api.updateMastery(topicId, quality, user?.id)
      
      // Optimistic UI — update mastery in the roadmap store
      const updated = roadmap.map(t => 
        t.id === topicId 
          ? { ...t, mastery: Math.min(100, t.mastery + quality * 10) } 
          : t
      )
      setRoadmap(updated)
    } catch (err) {
      console.error('Failed to update mastery:', err)
    } finally {
      setReviewingId(null)
    }
  }

  if (revisionQueue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
        <h2 className="text-2xl font-bold">All Caught Up!</h2>
        <p className="text-muted-foreground max-w-sm mt-2 mb-6">
          No topics pending review. Take a quiz to add more topics to your revision queue.
        </p>
        <div className="flex gap-3">
          <Link to="/quiz">
            <Button>Take a Quiz</Button>
          </Link>
          <Link to="/upload">
            <Button variant="outline">Upload Material</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">🔁 Revision Queue</h1>
        <p className="text-muted-foreground mt-1">
          Topics prioritized by the SM-2 algorithm. Review them to boost your mastery.
        </p>
      </div>

      <div className="space-y-4">
        {revisionQueue.map((topic) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            layout
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{topic.label}</h3>
                    <span className="text-xs text-muted-foreground capitalize">
                      Difficulty: {topic.difficulty}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary">{topic.mastery}%</div>
                    <div className="text-xs text-muted-foreground">Mastery</div>
                  </div>
                </div>
                
                <Progress value={topic.mastery} className="h-2 mb-4" />
                
                <div className="flex gap-2">
                  <span className="text-xs text-muted-foreground shrink-0 pt-1.5">How well do you know this?</span>
                  <div className="flex gap-1.5 flex-1 justify-end">
                    {[
                      { label: 'Again', quality: 1, color: 'text-red-600 border-red-200 hover:bg-red-50' },
                      { label: 'Hard', quality: 2, color: 'text-orange-600 border-orange-200 hover:bg-orange-50' },
                      { label: 'Good', quality: 3, color: 'text-blue-600 border-blue-200 hover:bg-blue-50' },
                      { label: 'Easy', quality: 5, color: 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' },
                    ].map(btn => (
                      <Button 
                        key={btn.label}
                        variant="outline" 
                        size="sm" 
                        className={`text-xs font-bold ${btn.color}`}
                        disabled={reviewingId === topic.id}
                        onClick={() => handleReview(topic.id, btn.quality)}
                      >
                        {reviewingId === topic.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          btn.label
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
