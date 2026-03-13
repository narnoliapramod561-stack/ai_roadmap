import { TrendingUp, Flame, Award, Target } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useStudyStore } from '@/stores/useStudyStore'

const accuracyData = [
  { day: 'Mon', accuracy: 45 },
  { day: 'Tue', accuracy: 52 },
  { day: 'Wed', accuracy: 68 },
  { day: 'Thu', accuracy: 64 },
  { day: 'Fri', accuracy: 78 },
  { day: 'Sat', accuracy: 82 },
  { day: 'Sun', accuracy: 89 },
]

export const ProgressPage = () => {
  const { roadmap } = useStudyStore()

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📈 Progress Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your consistency and mastery over time.</p>
        </div>
      </div>

      {/* Badges Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Study Streak", value: "7 Days", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
          { title: "Quiz Master", value: "Level 4", icon: Award, color: "text-yellow-500", bg: "bg-yellow-500/10" },
          { title: "Focus Hours", value: "32h", icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Topics Mastered", value: "14", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((badge, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${badge.bg}`}>
                <badge.icon className={`w-6 h-6 ${badge.color}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">{badge.title}</div>
                <div className="text-xl font-bold">{badge.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quiz Accuracy Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accuracyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorAccuracy)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Topic Mastery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roadmap} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#333" opacity={0.2} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={120} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="mastery" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
