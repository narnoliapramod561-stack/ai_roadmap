import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface KineticGridProps {
  opacity?: number;
}

const GridMesh = ({ opacity = 0.3 }: KineticGridProps) => {
  const meshRef = useRef<THREE.Points>(null!)
  const { mouse, viewport } = useThree()

  const count = 50
  const [positions, initialPositions] = useMemo(() => {
    const pos = new Float32Array(count * count * 3)
    const init = new Float32Array(count * count * 3)
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const idx = (i * count + j) * 3
        pos[idx] = (i - count / 2) * 0.8
        pos[idx + 1] = -5 // Ground level
        pos[idx + 2] = (j - count / 2) * 0.8
        init[idx] = pos[idx]
        init[idx + 1] = pos[idx + 1]
        init[idx + 2] = pos[idx + 2]
      }
    }
    return [pos, init]
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (!meshRef.current) return

    const pos = meshRef.current.geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < count * count; i++) {
        const idx = i * 3
        const x = initialPositions[idx]
        const z = initialPositions[idx + 2]
        
        // Mouse interaction: dip
        const dist = Math.sqrt(Math.pow(x - mouse.x * viewport.width, 2) + Math.pow(z + mouse.y * viewport.height * 2, 2))
        const dip = Math.exp(-dist * 0.5) * 2
        
        // Wave animation
        const wave = Math.sin(x * 0.5 + time) * 0.1 + Math.cos(z * 0.5 + time) * 0.1
        
        pos[idx + 1] = initialPositions[idx + 1] - dip + wave
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
    meshRef.current.rotation.y = time * 0.05
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#00F5D4"
        transparent
        opacity={opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export const KineticGrid = ({ opacity = 0.3 }: KineticGridProps) => {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none pb-40">
            <Canvas camera={{ position: [0, 2, 10], fov: 45 }}>
                <ambientLight intensity={1} />
                <pointLight position={[0, 10, 0]} color="#00F5D4" intensity={5} />
                <GridMesh opacity={opacity} />
            </Canvas>
        </div>
    )
}
