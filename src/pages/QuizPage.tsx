import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Timer, ChevronRight, AlertCircle, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useStudyStore } from '@/stores/useStudyStore'

export const QuizPage = () => {
  const { topicId } = useParams()
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quizId, setQuizId] = useState<string | null>(null)

  const roadmap = useStudyStore(state => state.roadmap)
  const currentTopic = topicId 
    ? roadmap.find(t => t.id === topicId) 
    : roadmap[0]

  useEffect(() => {
    const loadQuiz = async () => {
      if (!currentTopic) {
        setIsLoading(false)
        setError('No topic available. Please upload a material first.')
        return
      }
      try {
        setError(null)
        const result = await api.generateQuiz(currentTopic.id, 5, 'medium', currentTopic.label)
        if (result.error) {
          setError(result.error);
          return;
        }
        setQuestions(result.questions || [])
        setQuizId(result.quiz_id)
      } catch (err: any) {
        console.error('Quiz generation error:', err)
        setError(err.message || 'Failed to generate quiz. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    loadQuiz()
  }, [currentTopic])

  const question = questions.length > 0 ? questions[currentIdx] : null

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted && !isFinished && !isLoading) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, isSubmitted, isFinished, isLoading])

  const handleSubmit = async () => {
    if (selectedOption === null || !quizId || !currentTopic) return
    setIsSubmitted(true)
    
    if (selectedOption === question.correct) {
      setScore(s => s + 1)
    }
  }

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1)
      setSelectedOption(null)
      setIsSubmitted(false)
      setTimeLeft(30)
    } else {
      if (quizId && currentTopic) {
        const userAnswers = questions.map((_, i) => i === currentIdx ? selectedOption : -1)
        await api.submitQuiz(quizId, userAnswers as number[], currentTopic.id)
      }
      setIsFinished(true)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">AI generating personalized quiz...</p>
      </div>
    )
  }

  if (!currentTopic && !isLoading) {
    return (
      <div className="text-center py-20 px-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold">No Material Found</h2>
        <p className="text-muted-foreground mb-6">Please upload a syllabus first to generate study quizzes.</p>
        <Link to="/upload">
          <Button>Go to Upload</Button>
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 space-y-6">
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-semibold">Quiz Generation Failed</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => {
            setError(null)
            setIsLoading(true)
            window.location.reload()
          }}>Try Again</Button>
          <Link to="/map">
            <Button variant="outline">Back to Map</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isFinished) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto text-center space-y-8 pt-10">
        <div className="space-y-4">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mb-2">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Quiz Complete!</h1>
          <p className="text-xl text-muted-foreground">You scored {score} out of {questions.length}</p>
        </div>
        
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="text-lg font-medium mb-2">Topic Mastery: {currentTopic?.label}</div>
          <Progress value={(score/questions.length)*100} className="h-3 mb-4" />
          <p className="text-sm text-muted-foreground">Based on your results, we've updated your Knowledge Map.</p>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => window.location.reload()}>Retry Quiz</Button>
          <Link to="/map">
            <Button size="lg" variant="outline">View Progress Map</Button>
          </Link>
        </div>
      </motion.div>
    )
  }
  if (!question && !isLoading && !error && !isFinished) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p>Preparing questions...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex items-center justify-between gap-8 glass p-6 rounded-[32px] border-white/5 shadow-xl">
        <div className="flex-1 space-y-4">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
            <span>Progress: {currentIdx + 1} / {questions.length}</span>
            <span className="text-primary text-glow-teal">Module: {currentTopic?.label}</span>
          </div>
          <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-1 bg-white/5" />
        </div>
        <div className={`w-16 h-16 rounded-[20px] glass border-white/10 flex flex-col items-center justify-center shrink-0 shadow-lg ${
          timeLeft < 10 ? 'border-red-500/50 text-red-500 animate-pulse' : 'text-primary'
        }`}>
          <Timer className="w-4 h-4 mb-1" />
          <span className="text-lg font-black tracking-tighter">{timeLeft}</span>
        </div>
      </div>

      <Card className="glass-card rounded-[40px] border-white/10 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-right from-primary/0 via-primary/40 to-primary/0" />
        <CardHeader className="bg-white/[0.02] py-8 px-10 border-b border-white/5">
          <CardTitle className="leading-tight text-2xl font-black tracking-tight text-white/90 italic">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="py-10 px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question?.options?.map((opt: string, i: number) => (
              <div 
                key={i} 
                onClick={() => !isSubmitted && setSelectedOption(i)}
                className={`group relative flex items-center rounded-3xl border p-6 transition-all select-none ${
                  !isSubmitted ? 'cursor-pointer' : 'cursor-default'
                } ${
                  selectedOption === i && !isSubmitted ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(0,245,212,0.1)]' : 
                  selectedOption !== i && !isSubmitted ? 'border-white/5 hover:bg-white/5 hover:border-white/15' : ''
                } ${
                  isSubmitted && i === question.correct ? 'border-emerald-500/50 bg-emerald-500/10' : ''
                } ${
                  isSubmitted && selectedOption === i && i !== question.correct ? 'border-red-500/50 bg-red-500/10' : ''
                } ${
                  isSubmitted && selectedOption === i && i === question.correct ? 'border-emerald-500/50 bg-emerald-500/10' : ''
                }`}
              >
                <div className="flex items-start gap-4 flex-1 pointer-events-none">
                  <span className={`text-[10px] font-black uppercase tracking-widest shrink-0 mt-0.5 transition-colors ${
                    selectedOption === i ? 'text-primary' : 'text-white/20 group-hover:text-white/60'
                  }`}>0{i+1}</span>
                  <span className={`font-bold text-sm tracking-tight leading-snug transition-colors ${
                    selectedOption === i ? 'text-white' : 'text-white/60 group-hover:text-white/90'
                  }`}>{opt}</span>
                </div>
                <div className="shrink-0 ml-3 pointer-events-none">
                  {isSubmitted && i === question.correct && <CheckCircle2 className="w-5 h-5 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" />}
                  {isSubmitted && selectedOption === i && i !== question.correct && <XCircle className="w-5 h-5 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center items-center h-20">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div key="submit" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full">
              <Button 
                className="w-full h-16 text-[10px] font-black uppercase tracking-[0.3em] bg-primary text-black rounded-[24px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30" 
                onClick={handleSubmit}
                disabled={selectedOption === null}
              >
                Execute Analysis
              </Button>
            </motion.div>
          ) : (
            <motion.div key="next" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full">
              <Button 
                className="w-full h-16 text-[10px] font-black uppercase tracking-[0.3em] glass border-white/20 text-white rounded-[24px] hover:bg-white/10 transition-all flex gap-3" 
                onClick={handleNext}
              >
                {currentIdx < questions.length - 1 ? 'Compute Next Phase' : 'Finalize Session'} <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isSubmitted && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className={`rounded-[40px] glass border-white/10 overflow-hidden shadow-2xl ${selectedOption === question.correct ? 'shadow-emerald-900/10' : 'shadow-red-900/10'}`}>
              <CardHeader className="pb-4 py-8 px-10 border-b border-white/5 bg-white/[0.01]">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-4">
                  {selectedOption === question.correct 
                    ? <><div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div> <span className="text-emerald-500">Validation Successful</span></> 
                    : <><div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-500" /></div> <span className="text-red-500">Logic Mismatch Detected</span></>}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-10 px-10 space-y-10">
                <div className="flex gap-6 items-start glass p-8 rounded-[32px] border-white/5 relative group">
                  <div className="absolute inset-0 bg-primary/5 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Sparkles className="w-8 h-8 shrink-0 text-primary text-glow-teal mt-1" />
                  <div>
                    <div className="font-black text-[10px] text-primary mb-3 uppercase tracking-widest leading-none">AI Insight Engine</div>
                    <p className="text-lg font-bold tracking-tight text-white/80 leading-relaxed">{question.explanation}</p>
                  </div>
                </div>

                <div className="space-y-6 border-t border-white/5 pt-10">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 italic">Internal Reasoning Trace</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {question.ai_reasoning?.map((step: string, i: number) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex gap-6 p-6 rounded-[24px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <span className="font-black text-[10px] text-primary/40 bg-white/5 w-8 h-8 flex items-center justify-center rounded-xl shrink-0 tracking-tighter">0{i+1}</span>
                        <span className="text-xs font-bold text-white/50 leading-relaxed group-hover:text-white/80 transition-colors uppercase tracking-wider">{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
