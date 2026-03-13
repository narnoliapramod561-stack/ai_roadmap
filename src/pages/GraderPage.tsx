import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export const GraderPage = () => {
  const [isGrading, setIsGrading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  const startGradingMock = () => {
    setIsGrading(true)
    let p = 0
    const interval = setInterval(() => {
      p += 2
      setProgress(p)

      if (p < 30) setStatus('Analyzing handwriting...')
      else if (p < 60) setStatus('Evaluating logic structure...')
      else if (p < 90) setStatus('Comparing with model answer...')
      else setStatus('Finalizing score...')

      if (p >= 100) {
        clearInterval(interval)
        setIsGrading(false)
        setIsComplete(true)
      }
    }, 60)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">🖋️ Handwritten Grader</h1>
        <p className="text-muted-foreground mt-1">Upload a photo of your handwritten long-form answers for instant AI evaluation.</p>
      </div>

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
                  <Button size="lg" onClick={startGradingMock}>Browse Image</Button>
                  <Button size="lg" variant="secondary"><Camera className="w-4 h-4 mr-2" /> Open Camera</Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6 w-full max-w-md">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-spin">
                  <RefreshCw className="w-8 h-8 text-primary" />
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
              <div className="text-7xl font-extrabold text-primary">7<span className="text-4xl text-muted-foreground">/10</span></div>
              <div className="text-xl font-bold px-4 py-1 bg-primary text-primary-foreground rounded-full">Grade: B</div>
              <Button className="w-full mt-4" variant="outline" onClick={() => setIsComplete(false)}>Grade Another</Button>
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
                <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                  <li>Correct definition of electric flux.</li>
                  <li>Mathematical formula correctly written and boxed.</li>
                  <li>Good structured approach to the derivation.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <AlertCircle className="w-5 h-5" /> Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                  <li>Missing a clearly labeled diagram of the Gaussian surface.</li>
                  <li>You forgot to state that the surface must be closed.</li>
                </ul>
              </CardContent>
            </Card>

            <Button variant="secondary" className="w-full justify-start h-12 shadow-sm text-base">
              <FileText className="w-5 h-5 mr-3 text-primary" /> View Model Answer
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
