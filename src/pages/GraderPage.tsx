import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'

export const GraderPage = () => {
  const [isGrading, setIsGrading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [gradeResult, setGradeResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) startRealGrading(file)
  }

  const startRealGrading = async (file: File) => {
    setIsGrading(true)
    setError(null)
    setProgress(20)
    setStatus('Analyzing handwriting...')
    
    try {
      const result = await api.gradeHandwritten(
        file, 
        "Explain Gauss's Law and its mathematical derivation.", 
        "Electromagnetics"
      )
      
      setProgress(60)
      setStatus('Evaluating logic structure...')
      
      // Brief delay for UX
      await new Promise(r => setTimeout(r, 500))
      
      setProgress(100)
      setStatus('Finalizing score...')
      
      setGradeResult(result)
      setIsGrading(false)
      setIsComplete(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Grading failed. Please try again.')
      setIsGrading(false)
      setProgress(0)
    }
  }

  const handleReset = () => {
    setIsComplete(false)
    setIsGrading(false)
    setError(null)
    setProgress(0)
    setGradeResult(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept="image/*"
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">🖋️ Handwritten Grader</h1>
        <p className="text-muted-foreground mt-1">Upload a photo of your handwritten long-form answers for instant AI evaluation.</p>
      </div>

      {/* Error banner — always visible above card — Fix #5+7 */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={handleReset}>Dismiss</Button>
        </div>
      )}

      {!isComplete ? (
        <Card className="border-dashed border-2 border-muted hover:border-primary/50 transition-colors bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-20 min-h-[400px]">
            {!isGrading ? (
              <div className="text-center space-y-6">
                <div className="flex justify-center gap-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center shadow-sm">
                    <UploadCloud className="w-10 h-10 text-primary" />
                  </div>
                  <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center shadow-sm">
                    <Camera className="w-10 h-10 text-blue-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Upload or Scan Answer</h3>
                  <p className="text-sm text-muted-foreground mx-auto max-w-sm mt-2">
                    Take a photo of your answer sheet or browse.
                  </p>
                </div>
                <div className="flex gap-4 justify-center mt-4">
                  <Button size="lg" onClick={() => fileInputRef.current?.click()}>Browse Image</Button>
                  <Button size="lg" variant="secondary" onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.capture = 'environment'
                    input.onchange = (e: any) => {
                      const file = e.target?.files?.[0]
                      if (file) startRealGrading(file)
                    }
                    input.click()
                  }}><Camera className="w-4 h-4 mr-2" /> Open Camera</Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6 w-full max-w-md">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium animate-pulse">{status}</h3>
                  <Progress value={progress} className="h-3 shadow-inner" />
                </div>
                <p className="text-xs font-mono text-muted-foreground">{progress}% Complete</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Score Card */}
          <Card className="md:col-span-1 shadow-md border-primary/20 bg-primary/5">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Final Result</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4">
              <div className="text-7xl font-extrabold text-primary">{gradeResult?.score}<span className="text-4xl text-muted-foreground">/10</span></div>
              <div className="text-xl font-bold px-4 py-1 bg-primary text-primary-foreground rounded-full">Grade: {gradeResult?.grade}</div>
              <Button className="w-full mt-4" variant="outline" onClick={handleReset}>Grade Another</Button>
            </CardContent>
          </Card>

          {/* Feedback Column */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-emerald-500/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {gradeResult?.strengths}
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <AlertCircle className="w-5 h-5" /> Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {gradeResult?.improvements}
                </div>
              </CardContent>
            </Card>

            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-xs font-bold text-primary uppercase tracking-widest select-none list-none opacity-80 hover:opacity-100 transition">
                <span className="w-4 h-4 border border-primary/40 rounded flex items-center justify-center group-open:rotate-90 transition-transform text-primary">›</span>
                Verify AI Scoring Logic
              </summary>
              <div className="mt-4 bg-muted/40 border border-dashed rounded-2xl p-5 space-y-3">
                {gradeResult?.ai_reasoning?.map((step: string, i: number) => (
                  <div key={i} className="flex gap-4 text-xs font-medium text-muted-foreground/80">
                    <span className="font-mono text-primary bg-primary/5 w-6 h-6 flex items-center justify-center rounded shrink-0">0{i+1}</span>
                    <span className="mt-0.5">{step}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </motion.div>
      )}
    </div>
  )
}
