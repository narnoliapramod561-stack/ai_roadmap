import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'

import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'

// Placeholder imports for remaining pages
import { UploadPage } from './pages/UploadPage'
import { MapPage } from './pages/MapPage'
import { QuizPage } from './pages/QuizPage'
import { PlannerPage } from './pages/PlannerPage'
import { RevisionPage } from './pages/RevisionPage'
import { TutorPage } from './pages/TutorPage'
import { GraderPage } from './pages/GraderPage'
import { ProgressPage } from './pages/ProgressPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/planner" element={<PlannerPage />} />
            <Route path="/revision" element={<RevisionPage />} />
            <Route path="/tutor" element={<TutorPage />} />
            <Route path="/grader" element={<GraderPage />} />
          <Route path="/progress" element={<ProgressPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
