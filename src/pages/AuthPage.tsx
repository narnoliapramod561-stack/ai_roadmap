import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { User, Lock, Mail, ChevronRight, ShieldCheck, BrainCircuit } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 3D Tilt Effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { damping: 40, stiffness: 200 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { damping: 40, stiffness: 200 })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // Ensure user metadata is set after login for the avatar
        if (data.user && !data.user.user_metadata?.full_name && fullName) {
           await supabase.auth.updateUser({
              data: { full_name: fullName }
           });
        }
        
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;
        alert('Registration successful! Please sign in.');
        setIsLogin(true);
      }
      if (isLogin) {
         navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col justify-center items-center p-6 selection:bg-primary/40 font-sans overflow-hidden" style={{ perspective: '2000px' }}>
      
      {/* Background glow specific to auth */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
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
        .input-glow:focus-within {
          box-shadow: 0 0 20px rgba(0, 245, 212, 0.2);
          border-color: rgba(0, 245, 212, 0.5);
        }
      `}} />

      <Link to="/" className="absolute top-10 left-10 flex items-center gap-3 group z-50">
        <div className="w-8 h-8 bg-primary rounded-lg rotate-45 group-hover:rotate-0 transition-transform duration-500 shadow-[0_0_20px_#00F5D4]" />
        <span className="font-black text-xl tracking-[0.2em] italic text-primary drop-shadow-[0_0_10px_#00F5D450] hidden sm:block">SMARTSCHOLAR</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, filter: 'blur(20px)', scale: 0.9 }}
        animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="refracted-glass border-highlight rounded-[40px] p-10 md:p-12 relative overflow-hidden group"
        >
           {/* Internal Glow Follower */}
          <motion.div 
            className="absolute inset-0 z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: useMotionTemplate`radial-gradient(300px circle at ${useTransform(mouseX, [-0.5, 0.5], [0, 100])}% ${useTransform(mouseY, [-0.5, 0.5], [0, 100])}%, rgba(0, 245, 212, 0.1), transparent 70%)`
            }}
          />

          <div style={{ transform: "translateZ(40px)" }} className="text-center mb-10">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
              {isLogin ? 'NEURAL' : 'INITIALIZE'} <span className="text-primary truncate block drop-shadow-[0_0_10px_#00F5D440]">PORTAL</span>
            </h2>
            <p className="text-white/40 text-sm font-bold uppercase tracking-[0.2em]">
              {isLogin ? 'Authenticate to interface' : 'Create an uplink'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" style={{ transform: "translateZ(30px)" }}>
            {!isLogin && (
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 ml-4">Agent Name</label>
                <div className="relative input-glow transition-all rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-primary opacity-70" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder-white/20 focus:outline-none font-bold"
                    placeholder="Enter full name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 relative">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 ml-4">Uplink Frequency (Email)</label>
              <div className="relative input-glow transition-all rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-primary opacity-70" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder-white/20 focus:outline-none font-bold"
                  placeholder="Enter email channel"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 relative">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 ml-4">Encryption Key (Password)</label>
              <div className="relative input-glow transition-all rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-primary opacity-70" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder-white/20 focus:outline-none font-bold tracking-widest"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-4 mt-8 bg-primary text-black hover:bg-white hover:scale-[1.02] transition-all rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,245,212,0.2)] disabled:opacity-50 flex items-center justify-center group"
            >
              {loading ? (
                 <BrainCircuit className="w-6 h-6 animate-pulse" />
              ) : (
                <>
                  {isLogin ? 'AUTHENTICATE' : 'INITIALIZE'}
                  <ChevronRight className="w-6 h-6 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </button>
          </form>

          <div style={{ transform: "translateZ(20px)" }} className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-black uppercase tracking-[0.2em] text-white/40 hover:text-primary transition-colors underline decoration-white/20 hover:decoration-primary/50 underline-offset-4"
            >
              {isLogin ? 'Request New Uplink (Sign Up)' : 'Existing Agent (Sign In)'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
