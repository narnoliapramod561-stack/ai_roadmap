import { useCallback, useState } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { MessageSquare, PlayCircle, Repeat2, PenTool } from 'lucide-react'

const initialNodes = [
  {
    id: '1',
    position: { x: 250, y: 50 },
    data: { label: 'Electromagnetic Theory', mastery: 65, difficulty: 'hard' },
    style: { background: '#fef08a', color: '#854d0e', border: '1px solid #eab308' }, // Amber - Medium
  },
  {
    id: '2',
    position: { x: 100, y: 200 },
    data: { label: 'Maxwell Equations', mastery: 42, difficulty: 'hard' },
    style: { background: '#fecaca', color: '#991b1b', border: '1px solid #ef4444' }, // Red - Weak
  },
  {
    id: '3',
    position: { x: 400, y: 200 },
    data: { label: 'Gauss Law', mastery: 85, difficulty: 'medium' },
    style: { background: '#bbf7d0', color: '#166534', border: '1px solid #22c55e' }, // Green - Mastered
  },
  {
    id: '4',
    position: { x: 250, y: 350 },
    data: { label: 'Ampere Law', mastery: 0, difficulty: 'hard' },
    style: { background: '#f3f4f6', color: '#374151', border: '1px solid #9ca3af' }, // Gray - New
  },
]

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e1-3', source: '1', target: '3', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e2-4', source: '2', target: '4', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e3-4', source: '3', target: '4', markerEnd: { type: MarkerType.ArrowClosed } },
]

export const MapPage = () => {
  const [nodes, _, onNodesChange] = useNodesState(initialNodes)
  const [edges, __, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<any>(null)

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node)
  }, [])

  return (
    <div className="h-[calc(100vh-10rem)] w-full border rounded-xl overflow-hidden bg-background relative shadow-sm">
      <div className="absolute top-4 left-4 z-10 bg-background/90 p-3 rounded-lg border shadow-sm backdrop-blur-sm text-sm">
        <h3 className="font-semibold mb-2">Knowledge Map</h3>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-200 border border-green-500"></span> Mastered</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-200 border border-yellow-500"></span> Medium</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-200 border border-red-500"></span> Weak</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-200 border border-gray-500"></span> New</div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>

      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center justify-between">
              {selectedNode?.data?.label}
              <span className={`text-xs px-2 py-1 rounded-md uppercase tracking-wider ${
                selectedNode?.data?.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                selectedNode?.data?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {selectedNode?.data?.difficulty}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Mastery Level</span>
                <span>{selectedNode?.data?.mastery}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    selectedNode?.data?.mastery > 70 ? 'bg-green-500' :
                    selectedNode?.data?.mastery > 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${selectedNode?.data?.mastery}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link to="/tutor" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" /> Explain with AI
                </Button>
              </Link>
              <Link to="/quiz" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <PlayCircle className="w-4 h-4 mr-2" /> Generate Quiz
                </Button>
              </Link>
              <Link to="/revision" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Repeat2 className="w-4 h-4 mr-2" /> Add to Revision
                </Button>
              </Link>
              <Link to="/grader" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <PenTool className="w-4 h-4 mr-2" /> Grade Answer
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
