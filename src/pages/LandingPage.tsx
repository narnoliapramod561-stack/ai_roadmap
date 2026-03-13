import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Rocket, Upload, BrainCircuit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/Navbar'

const pipelineSteps = [
  "AI analyzing syllabus...",
  "Extracting topics...",
  "Generating knowledge graph...",
  "Building study plan...",
  "Ready to learn!"
]

export const LandingPage = () => {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % pipelineSteps.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 -mt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4 font-medium">
            <BrainCircuit className="w-5 h-5" />
            <span>SmartScholar AI 3.0</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Your Syllabus <br className="hidden md:block" />
            <span className="text-muted-foreground">→</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
              AI Study Coach
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your course materials and let AI generate a complete learning roadmap, adaptive quizzes, and a personalized study schedule in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full text-lg h-14 px-8 rounded-xl shadow-lg shadow-primary/25">
                <Rocket className="mr-2" /> Try Live Demo
              </Button>
            </Link>
            <Link to="/upload" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full text-lg h-14 px-8 rounded-xl border-primary/20 hover:bg-primary/5">
                <Upload className="mr-2" /> Upload Study Material
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-20 w-full max-w-2xl bg-card border rounded-2xl shadow-xl p-8 relative overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />
          <h3 className="text-lg font-semibold mb-6 flex items-center justify-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" /> Live AI Pipeline
          </h3>
          
          <div className="h-20 flex items-center justify-center">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl font-mono text-primary font-medium"
            >
              {pipelineSteps[step]}
            </motion.p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
