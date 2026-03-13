import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Timer, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const mockQuestions = [
  {
    id: 1,
    text: "What does Gauss's Law relate?",
    options: {
      A: "Magnetic field to its current source",
      B: "Electric flux to the enclosed charge",
      C: "Induced EMF to changing magnetic flux",
      D: "Electric potential to work done"
    },
    correct: "B",
    explanation: "Gauss's law states that the net electric flux through any closed surface is equal to the net charge inside the surface divided by the permittivity of free space."
  }
]

export const QuizPage = () => {
  const [timeLeft, setTimeLeft] = useState(60)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const question = mockQuestions[0]

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timerId)
    }
  }, [timeLeft, isSubmitted])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Topic: Gauss Law</div>
          <div className="font-semibold">Question 1 of 10</div>
        </div>
        <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg font-mono font-medium">
          <Timer className="w-4 h-4 text-primary" />
          <span className={timeLeft < 10 ? 'text-red-500' : ''}>00:{timeLeft.toString().padStart(2, '0')}</span>
        </div>
      </div>

      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl leading-relaxed">{question.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {Object.entries(question.options).map(([key, value]) => {
              const isSelected = selectedOption === key
              const isCorrect = key === question.correct
              
              let buttonStyle = "w-full justify-start h-auto p-4 text-left font-normal border-2 "
              
              if (!isSubmitted) {
                buttonStyle += isSelected ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
              } else {
                if (isCorrect) buttonStyle += "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                else if (isSelected && !isCorrect) buttonStyle += "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                else buttonStyle += "border-muted opacity-50"
              }

              return (
                <Button
                  key={key}
                  variant="outline"
                  className={buttonStyle}
                  onClick={() => !isSubmitted && setSelectedOption(key)}
                  disabled={isSubmitted}
                >
                  <div className="flex items-start gap-4">
                    <span className="font-bold font-mono bg-background/50 px-2.5 py-1 rounded border shadow-sm">{key}</span>
                    <span className="text-base">{value}</span>
                  </div>
                </Button>
              )
            })}
          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            <Button variant="ghost" disabled={isSubmitted}>Skip Question</Button>
            {!isSubmitted ? (
              <Button size="lg" onClick={() => setIsSubmitted(true)} disabled={!selectedOption}>
                Submit Answer
              </Button>
            ) : (
              <Button size="lg">Next Question</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Explanation Panel */}
      {isSubmitted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`border-l-4 ${selectedOption === question.correct ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {selectedOption === question.correct ? (
                  <><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Correct!</>
                ) : (
                  <><XCircle className="w-5 h-5 text-red-500" /> Incorrect</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 text-muted-foreground bg-muted/30 p-4 rounded-lg">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
                <div>
                  <div className="font-medium text-foreground mb-1">AI Explanation</div>
                  {question.explanation}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
