import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion'
import { Network, ChevronRight, Cpu, Globe, BrainCircuit, ShieldCheck, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

// --- 1. HUD: Technical Readouts ---
const HUD = () => {
  return (
    <div className="fixed inset-0 z-[1001] pointer-events-none p-6 md:p-10 font-mono text-[9px] uppercase tracking-[0.4em] text-primary/40 hidden sm:block">
      <div className="absolute top-10 left-10 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="glitch-text" data-text="LATENCY: 400MS">LATENCY: 400MS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/20" />
          <span className="opacity-50">ENGINE: GROQ_L3.3_V4</span>
        </div>
      </div>
      
      <div className="absolute top-10 right-10 text-right flex flex-col gap-2">
        <div className="glitch-text" data-text="SYNC: ACTIVE">SYNC: ACTIVE</div>
        <div className="opacity-50">CORE: NEURAL_B1</div>
      </div>

      <div className="absolute bottom-10 left-10 opacity-30">
        [51.5284° N, 0.1287° W] // GLOBAL_MESH_ACTIVE
      </div>

      <div className="absolute bottom-10 right-10 flex gap-10 opacity-60">
        <span className="glitch-text" data-text="ST_L4_SCOUT">ST_L4_SCOUT</span>
        <span>X_THREAD_ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
      </div>
    </div>
  )
}

// Removed local KineticGrid component implementation

// --- 3. High-Refraction Tilt Card ---
const RefractedCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), { damping: 40, stiffness: 300 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), { damping: 40, stiffness: 300 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const xPct = (e.clientX - rect.left) / rect.width - 0.5
    const yPct = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(xPct)
    mouseY.set(yPct)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
      whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{ delay, duration: 0.8, ease: "circOut" }}
      viewport={{ once: true, margin: "-50px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative group p-12 rounded-[40px] refracted-glass border-highlight overflow-hidden"
    >
      <div 
        style={{ transform: "translateZ(60px)" }}
        className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-10 transition-all group-hover:bg-primary/20 border border-primary/20"
      >
        <Icon className="w-12 h-12 text-primary drop-shadow-[0_0_15px_#00F5D4]" />
      </div>
      
      <h3 style={{ transform: "translateZ(40px)" }} className="text-4xl font-black mb-6 tracking-tighter uppercase italic text-white group-hover:text-primary transition-colors">
        {title}
      </h3>
      
      <p style={{ transform: "translateZ(30px)" }} className="text-white/40 text-lg font-bold leading-relaxed uppercase tracking-tighter group-hover:text-white/70 transition-colors">
        {desc}
      </p>

      {/* Internal Radial Glow */}
      <motion.div 
        className="absolute inset-0 z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: useMotionTemplate`radial-gradient(500px circle at ${useTransform(mouseX, [-0.5, 0.5], [0, 100])}% ${useTransform(mouseY, [-0.5, 0.5], [0, 100])}%, rgba(0, 245, 212, 0.1), transparent 70%)`
        }}
      />
    </motion.div>
  )
}

export const LandingPage = () => {
  const { scrollYProgress } = useScroll()
  
  // Parallax Cylinder Transitions
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])
  const heroRotate = useTransform(scrollYProgress, [0, 0.2], [0, -20])
  const heroZ = useTransform(scrollYProgress, [0, 0.2], [0, -500])

  const featureOpacity = useTransform(scrollYProgress, [0.1, 0.3, 0.5], [0, 1, 0])
  const featureRotate = useTransform(scrollYProgress, [0.1, 0.3, 0.5], [20, 0, -20])
  const featureY = useTransform(scrollYProgress, [0.1, 0.3, 0.5], [200, 0, -200])

  return (
    <div className="bg-[#07070A] text-white selection:bg-primary/40 font-sans min-h-screen overflow-x-hidden" style={{ perspective: '2500px' }}>
      
      <HUD />
      
      {/* High-Frequency Scanlines */}
      <div className="fixed inset-0 z-[1002] pointer-events-none opacity-[0.04] mix-blend-overlay bg-[linear-gradient(transparent_50%,_rgba(0,0,0,1)_50%)] bg-[length:100%_4px]" />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        .glitch-text:hover::after {
          content: attr(data-text);
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background: #07070A;
          animation: glitch 0.1s infinite;
          clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%);
          color: #00F5D4;
        }
        .refracted-glass {
          background: rgba(10, 10, 15, 0.7);
          backdrop-filter: blur(25px) saturate(160%);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
        }
        .border-highlight {
          border: 1px solid transparent;
          background: linear-gradient(#07070A, #07070A) padding-box,
                      linear-gradient(135deg, rgba(0, 245, 212, 0.5) 0%, transparent 40%) border-box;
        }
        .text-plasma {
          background: linear-gradient(90deg, #00F5D4, #B9A7FF, #00F5D4);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 5s linear infinite;
        }
        @keyframes shimmer {
          to { background-position: 200% center; }
        }
      `}} />

{/* BACKGROUND SCENE (Now Global in App.tsx) */}


      <nav className="fixed top-12 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-5xl px-8 pointer-events-none">
        <div className="refracted-glass border-highlight py-5 px-12 rounded-full flex items-center justify-between pointer-events-auto">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-primary rounded-xl rotate-45 group-hover:rotate-0 transition-transform duration-700 shadow-[0_0_30px_#00F5D4]" />
            <span className="font-black text-2xl tracking-[0.2em] italic text-primary drop-shadow-[0_0_10px_#00F5D450]">SMARTSCHOLAR</span>
          </Link>
          <div className="hidden md:flex items-center gap-16 text-[10px] font-black uppercase tracking-[0.4em] opacity-80">
            <Link to="/auth" className="text-primary hover:text-white transition-all underline decoration-primary/40 underline-offset-8">Neural Portal</Link>
          </div>
        </div>
      </nav>

      {/* SECTION 1: HERO (Cylinder Roll 1) */}
      <section className="relative h-screen w-full flex items-center justify-center pt-32 px-10 pointer-events-none">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale, rotateX: heroRotate, translateZ: heroZ }}
          className="relative z-10 text-center space-y-20 max-w-7xl pointer-events-auto"
        >
          <motion.div
            initial={{ opacity: 0, filter: 'blur(30px)', scale: 0.8 }}
            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-4 px-8 py-3 rounded-full refracted-glass border-highlight text-primary text-xs font-black uppercase tracking-[0.6em] mb-12">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_#00F5D4]" />
              Establishing Neural Uplink...
            </div>

            <h1 className="text-6xl md:text-[140px] font-black tracking-tighter leading-[0.75] uppercase italic drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              FOCUS <br />
              <span className="text-plasma">ENGINE</span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-lg md:text-3xl text-white/40 max-w-5xl mx-auto leading-relaxed font-black uppercase tracking-[0.2em] italic"
          >
            Materialize your curriculum. <br />
            Sub-second roadmap generation powered by <br />
            <span className="text-white drop-shadow-[0_0_10px_#fff]">GROQ & LLAMA 4 SCOUT.</span>
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="pt-12"
          >
            <Link to="/auth" className="group relative z-20">
              <div className="absolute -inset-6 bg-primary/10 rounded-[40px] blur-3xl group-hover:bg-primary/30 transition duration-700" />
              <Button className="relative w-full sm:w-96 h-24 bg-primary text-black hover:bg-white transition-all rounded-[30px] font-black text-2xl uppercase tracking-[0.15em] shadow-[0_0_50px_rgba(0,245,212,0.4)]">
                SYNC NEURAL CORE <ChevronRight className="ml-3 w-8 h-8" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 2: FEATURES (Cylinder Roll 2) */}
      <section className="relative min-h-screen w-full flex flex-col items-center justify-center py-32 px-12 overflow-visible">
        <motion.div 
          style={{ opacity: featureOpacity, rotateX: featureRotate, y: featureY }}
          className="w-full max-w-7xl pt-32"
        >
          <div className="text-center mb-32">
             <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-6">Deep <span className="text-primary">Intelligence</span></h2>
             <p className="text-white/30 uppercase tracking-[0.5em] font-bold text-sm">Synchronizing syllabus metadata across distributed nodes.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 perspective-[2000px]">
            <RefractedCard icon={Network} title="Neural Map" desc="Visualize curriculum nodes through Llama 3.3 structured inference. 3D spatial learning paths." delay={0} />
            <RefractedCard icon={Cpu} title="Groq Inference" desc="0.4s response time for roadmap synthesis. High-frequency computation for high-intensity study." delay={0.2} />
            <RefractedCard icon={BrainCircuit} title="Llama 4 Vision" desc="OCR Grade handwritten materials with multi-modal precision. The ultimate vision for student success." delay={0.4} />
          </div>
        </motion.div>
      </section>

      {/* SECTION 3: FINAL CALL */}
      <section className="relative min-h-[80vh] w-full flex items-center justify-center py-32 px-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="w-full max-w-7xl refracted-glass p-12 md:p-40 rounded-[60px] md:rounded-[100px] border-highlight text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-[#B9A7FF]/10 pointer-events-none" />
          
          <div className="relative z-10 space-y-12">
             <h2 className="text-5xl md:text-[120px] font-black italic uppercase tracking-tighter leading-none">
                READY TO <br /> <span className="text-primary drop-shadow-[0_0_20px_#00F5D480]">INITIALIZE?</span>
             </h2>
             <p className="text-lg md:text-2xl text-white/40 uppercase tracking-widest font-black max-w-3xl mx-auto italic">
                Join 10k+ students hacking their study productivity with SmartScholar AI.
             </p>
             <div className="pt-12">
               <Link to="/auth" className="inline-block relative group">
                  <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl group-hover:bg-primary/40 transition duration-700" />
                  <Button className="relative w-full sm:w-80 h-20 bg-white text-black hover:bg-primary hover:text-black hover:scale-105 transition-all rounded-full font-black text-xl uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_50px_rgba(0,245,212,0.6)]">
                    ACCESS PORTAL
                  </Button>
               </Link>
             </div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="relative w-full py-40 px-12 border-t border-primary/10 bg-[#07070A] mt-32">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-24 relative z-10">
          <div className="flex flex-col items-center gap-12">
            <div className="w-20 h-20 bg-primary/20 p-5 rounded-3xl border border-primary/40 animate-pulse">
               <Globe className="w-full h-full text-primary" />
            </div>
            <span className="font-black text-4xl md:text-6xl tracking-[0.4em] uppercase italic text-primary/40">SMARTSCHOLAR.AI</span>
          </div>
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-16">
            <div className="text-[10px] md:text-[12px] text-white/20 font-black uppercase tracking-[0.6em] italic text-center md:text-left">
              ENGINE: V5.0_KINETIC // [ACCESS_GRANTED]
            </div>
            <div className="flex gap-12 md:gap-20">
              <Rocket className="w-8 h-8 md:w-10 md:h-10 text-primary/30 hover:text-primary transition-colors cursor-crosshair hover:drop-shadow-[0_0_10px_#00F5D4]" />
              <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-primary/30 hover:text-primary transition-colors cursor-crosshair hover:drop-shadow-[0_0_10px_#00F5D4]" />
              <BrainCircuit className="w-8 h-8 md:w-10 md:h-10 text-primary/30 hover:text-primary transition-colors cursor-crosshair hover:drop-shadow-[0_0_10px_#00F5D4]" />
            </div>
            <div className="text-[8px] md:text-[10px] text-white/20 font-black uppercase tracking-[0.2em] text-center md:text-right">
              © 2026 NEURAL SYSTEMS <br />
              COGNITIVE AUGMENTATION UNIT
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
