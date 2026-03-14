import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, XCircle, Timer, ChevronRight,
  Zap, RotateCcw, Brain, TrendingUp
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { useStudyStore } from '@/stores/useStudyStore'
import { useUserStore } from '@/stores/useUserStore'
import { useAppSync } from '@/stores/useAppSync'

// ── State Machine ─────────────────────────────────────
type QuizState = 'idle' | 'loading' | 'answering' | 'submitted' | 'results'

export const QuizPage = () => {
  const { topicId } = useParams()
  const roadmap = useStudyStore(s => s.roadmap)
  const user = useUserStore(s => s.user)

  const currentTopic = topicId ? roadmap.find(t => t.id === topicId) : roadmap[0]
  const { notifyQuizComplete, overdueTopics } = useAppSync()

  // State Machine
  const [phase, setPhase] = useState<QuizState>('idle')
  const [questions, setQuestions] = useState<any[]>([])
  const [quizId, setQuizId] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questionCount, setQuestionCount] = useState(5)
  const [quizSource, setQuizSource] = useState<'subject' | 'queue'>('queue')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  
  const subjects = useStudyStore(s => s.materials)

  // Answering state
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [timerActive, setTimerActive] = useState(false)

  // Results state
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Timer effect
  useEffect(() => {
    if (!timerActive || phase !== 'answering') return
    if (timeLeft <= 0) {
      handleAnswer(-1) // Auto-submit on timeout
      return
    }
    const tick = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(tick)
  }, [timeLeft, timerActive, phase])

  const startQuiz = useCallback(async () => {
    setPhase('loading')
    setError(null)
    try {
      let targetTopicLabel = currentTopic?.label || topicId || 'General Knowledge'
      let targetTopicId = topicId || 'general'

      // If source is Queue, we pick the most overdue topic if no topicId is explicitly provided in URL
      if (quizSource === 'queue' && !topicId && overdueTopics.length > 0) {
        targetTopicId = overdueTopics[0].topic_id
        targetTopicLabel = overdueTopics[0].topic_name
      } else if (quizSource === 'subject' && selectedSubjectId) {
        // Find subject name to use as context
        const subject = subjects.find(s => s.id === selectedSubjectId)
        targetTopicId = selectedSubjectId
        targetTopicLabel = subject?.subject_name || subject?.file_name || 'Subject Review'
      }

      const result = await api.generateQuizFull(
        targetTopicId,
        targetTopicLabel,
        undefined,
        user?.id,
        questionCount,
        difficulty
      )
      if (result.error) throw new Error(result.error)
      setQuestions(result.questions || [])
      setQuizId(result.quiz_id)
      setUserAnswers([])
      setCurrentIdx(0)
      setPhase('answering')
      setTimeLeft(30)
      setTimerActive(true)
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz')
      setPhase('idle')
    }
  }, [topicId, currentTopic, user?.id, questionCount, difficulty])

  const handleAnswer = useCallback((optionIdx: number) => {
    setTimerActive(false)
    setSelectedOption(optionIdx)
    setPhase('submitted')
  }, [])

  const nextQuestion = useCallback(() => {
    const newAnswers = [...userAnswers, selectedOption ?? -1]
    setUserAnswers(newAnswers)

    if (currentIdx + 1 >= questions.length) {
      // Submit quiz
      submitQuiz(newAnswers)
    } else {
      setCurrentIdx(i => i + 1)
      setSelectedOption(null)
      setPhase('answering')
      setTimeLeft(30)
      setTimerActive(true)
    }
  }, [userAnswers, selectedOption, currentIdx, questions.length])

  const submitQuiz = async (answers: number[]) => {
    setPhase('loading')
    try {
      const result = await api.submitQuizFull(
        quizId!,
        answers,
        topicId || 'general',
        currentTopic?.label || topicId || 'General',
        user?.id,
        difficulty
      )
      setResults(result)
      setPhase('results')
      // Notify sync — triggers readiness and quiz history refresh on dashboard
      if (user?.id) notifyQuizComplete(user.id)
    } catch (err: any) {
      // If submit fails, show local results
      const correct = answers.filter((a, i) => a === questions[i]?.correct).length
      setResults({ score: correct, total: questions.length, score_pct: Math.round((correct / questions.length) * 100), feedback: [] })
      setPhase('results')
    }
  }

  const resetQuiz = () => {
    setPhase('idle')
    setResults(null)
    setError(null)
    setUserAnswers([])
    setSelectedOption(null)
    setCurrentIdx(0)
  }

  const q = questions[currentIdx]
  const scorePct = results ? results.score_pct ?? Math.round((results.score / results.total) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
            <Brain className="w-3 h-3" /> Neural Quiz Engine
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white">
          {currentTopic?.label || 'Quiz'} <span className="text-primary">Assessment</span>
        </h1>
        <p className="text-white/40 text-sm font-bold uppercase tracking-widest mt-1">
          Adaptive MCQ — SM-2 Powered
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-bold">
                {error}
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-[30px] p-8 space-y-8">
              
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Quiz Source</label>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setQuizSource('queue')}
                    className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${quizSource === 'queue' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    Revision Queue
                  </button>
                  <button 
                    onClick={() => setQuizSource('subject')}
                    className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${quizSource === 'subject' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    By Subject
                  </button>
                </div>
              </div>

              {quizSource === 'queue' && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">SM-2 Revision Queue</p>
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mt-1">{overdueTopics.length} topics due for review</p>
                  </div>
                </div>
              )}

              {quizSource === 'subject' && (
                 <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Select Subject</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {subjects.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSubjectId(s.id)}
                        className={`p-3 rounded-xl border text-left truncate transition-all ${selectedSubjectId === s.id ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
                      >
                         <span className="text-xs font-bold uppercase tracking-wider">{s.subject_name || s.file_name || 'Untitled Subject'}</span>
                      </button>
                    ))}
                    {subjects.length === 0 && <p className="text-xs text-white/40 p-4">No subjects found. Upload a syllabus first.</p>}
                  </div>
                 </div>
              )}

              <div className="space-y-4 pt-4 border-t border-white/5">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Difficulty Level</label>
                <div className="flex gap-3">
                  {(['easy', 'medium', 'hard'] as const).map(d => (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className={`flex-1 py-3 rounded-2xl font-black uppercase tracking-widest text-xs border transition-all ${
                        difficulty === d
                          ? d === 'easy' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                            : d === 'medium' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                            : 'bg-red-500/20 border-red-500/50 text-red-400'
                          : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                      }`}
                    >{d}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Number of Questions</label>
                <div className="flex gap-3">
                  {[5, 10, 15].map(n => (
                    <button key={n} onClick={() => setQuestionCount(n)}
                      className={`flex-1 py-3 rounded-2xl font-black text-sm border transition-all ${
                        questionCount === n ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                      }`}
                    >{n} Q</button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={startQuiz}
              disabled={quizSource === 'subject' && !selectedSubjectId}
              className={`w-full py-6 font-black uppercase tracking-[0.3em] text-lg rounded-[24px] transition-all flex items-center justify-center gap-3 ${quizSource === 'subject' && !selectedSubjectId ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-primary text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(0,245,212,0.3)]'}`}
            >
              <Zap className="w-6 h-6" /> Initialize Assessment
            </button>
          </motion.div>
        )}

        {/* ── LOADING ── */}
        {phase === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="py-32 flex flex-col items-center gap-6"
          >
            <div className="w-20 h-20 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <div className="text-xs font-black uppercase tracking-[0.4em] text-primary animate-pulse">
              {results ? 'Submitting Results...' : 'Generating Questions...'}
            </div>
          </motion.div>
        )}

        {/* ── ANSWERING / SUBMITTED ── */}
        {(phase === 'answering' || phase === 'submitted') && q && (
          <motion.div key={`q-${currentIdx}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="space-y-8"
          >
            {/* Progress + Timer */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <motion.div className="h-full bg-primary" animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} transition={{ ease: 'easeOut' }} />
              </div>
              <div className={`flex items-center gap-2 font-black text-sm tabular-nums ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white/60'}`}>
                <Timer className="w-4 h-4" /> {timeLeft}s
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/30">
                {currentIdx + 1} / {questions.length}
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white/5 border border-white/10 rounded-[30px] p-8 space-y-8">
              <h2 className="text-xl font-bold text-white leading-relaxed">{q.question}</h2>

              <div className="grid gap-3">
                {q.options?.map((opt: string, idx: number) => {
                  const isSelected = selectedOption === idx
                  const correct = q.correct
                  const isCorrect = phase === 'submitted' && idx === correct
                  const isWrong = phase === 'submitted' && isSelected && idx !== correct

                  return (
                    <motion.button key={idx} whileHover={phase === 'answering' ? { x: 4 } : {}}
                      onClick={() => phase === 'answering' && handleAnswer(idx)}
                      className={`w-full text-left p-5 rounded-2xl border font-medium transition-all relative overflow-hidden ${
                        isCorrect ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : isWrong ? 'bg-red-500/20 border-red-500/50 text-red-300'
                        : isSelected && phase === 'submitted' ? 'bg-white/10 border-white/20 text-white'
                        : phase === 'answering' ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-primary/30 cursor-pointer'
                        : 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      <span className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-xs font-black shrink-0">
                          {['A','B','C','D'][idx]}
                        </span>
                        {opt}
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto shrink-0" />}
                        {isWrong && <XCircle className="w-5 h-5 text-red-400 ml-auto shrink-0" />}
                      </span>
                    </motion.button>
                  )
                })}
              </div>

              {/* AI Reasoning Panel  */}
              {phase === 'submitted' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-3"
                >
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">AI Reasoning</div>
                  <p className="text-sm text-white/70 leading-relaxed">{q.explanation}</p>
                  {q.ai_reasoning?.length > 0 && (
                    <ul className="space-y-1 pt-2 border-t border-primary/10">
                      {q.ai_reasoning.map((r: string, i: number) => (
                        <li key={i} className="text-[11px] text-white/40 flex gap-2"><span className="text-primary">·</span>{r}</li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}

              {phase === 'submitted' && (
                <button onClick={nextQuestion}
                  className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all flex items-center justify-center gap-3"
                >
                  {currentIdx + 1 >= questions.length ? 'See Results' : 'Next Question'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── RESULTS ── */}
        {phase === 'results' && results && (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* Score Card */}
            <div className={`rounded-[30px] p-10 text-center relative overflow-hidden border ${
              scorePct >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' :
              scorePct >= 50 ? 'bg-yellow-500/10 border-yellow-500/30' :
              'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="text-7xl font-black italic tracking-tighter mb-2" style={{
                color: scorePct >= 80 ? '#34d399' : scorePct >= 50 ? '#fbbf24' : '#f87171'
              }}>
                {scorePct}<span className="text-3xl">%</span>
              </div>
              <div className="text-lg font-black uppercase tracking-widest text-white/80 mb-1">
                {scorePct >= 80 ? '🏆 Mastered' : scorePct >= 50 ? '⚡ Progressing' : '📚 Keep Studying'}
              </div>
              <div className="text-white/40 text-sm font-bold uppercase tracking-widest">
                {results.score} correct out of {results.total} questions
              </div>
              {results.next_review_interval_days && (
                <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary">
                  SM-2 Next Review: in {results.next_review_interval_days} day{results.next_review_interval_days !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Feedback List */}
            {results.feedback && results.feedback.length > 0 && (
              <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Question Breakdown</div>
                {results.feedback.map((fb: any, i: number) => (
                  <div key={i} className={`p-5 rounded-2xl border text-sm font-medium ${fb.is_correct ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex items-start gap-3">
                      {fb.is_correct ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                      <div>
                        <p className="text-white/80">{fb.question}</p>
                        {!fb.is_correct && <p className="text-[11px] text-emerald-400 mt-1">✓ {fb.correct_answer}</p>}
                        {fb.explanation && <p className="text-[11px] text-white/40 mt-1">{fb.explanation}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button onClick={resetQuiz}
                className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retry Quiz
              </button>
              <Link to="/dashboard" className="flex-1">
                <button className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" /> See Readiness
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
