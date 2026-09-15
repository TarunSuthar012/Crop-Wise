import { useState } from 'react'
import { supabase, setLocalSession, formatSupabaseQueryError, isSupabaseConfigured } from '../lib/supabase'
import { localSignUp, localLogin } from '../lib/localDb'
import { GoogleTranslateWidget } from '../translation'

export default function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const mobileOnly = (v) => v.replace(/\D/g, '').slice(0, 10)

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (mobile.length !== 10) { setError('Please enter a valid 10-digit mobile number.'); return }

    setLoading(true)
    let data
    let err
    try {
      if (isSupabaseConfigured()) {
        ;({ data, error: err } = await supabase
          .from('farmers')
          .insert({ name: name.trim(), mobile })
          .select()
          .single())
      } else {
        ;({ data, error: err } = await localSignUp(name.trim(), mobile))
      }
    } catch (e) {
      err = e
    }
    setLoading(false)

    if (err) {
      if (err.code === '23505') {
        setError('This mobile number is already registered. Try signing in.')
      } else {
        console.error(err)
        setError(formatSupabaseQueryError(err))
      }
      return
    }

    setLocalSession(data)
    onLogin()
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    if (mobile.length !== 10) { setError('Please enter a valid 10-digit mobile number.'); return }

    setLoading(true)
    let data
    let err
    try {
      if (isSupabaseConfigured()) {
        ;({ data, error: err } = await supabase
          .from('farmers')
          .select('*')
          .eq('mobile', mobile)
          .maybeSingle())
      } else {
        ;({ data, error: err } = await localLogin(mobile))
      }
    } catch (e) {
      err = e
    }
    setLoading(false)

    if (err) {
      console.error(err)
      setError(formatSupabaseQueryError(err))
      return
    }
    if (!data) { setError('No account found with this number. Please sign up first.'); return }

    setLocalSession(data)
    onLogin()
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-3 sm:p-4 relative overflow-x-hidden bg-[#0a1a12] safe-area-inset">
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 max-w-[calc(100vw-1.5rem)]">
        <GoogleTranslateWidget />
      </div>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-[#0a1a12] to-teal-950 pointer-events-none" />

      {/* Animated blobs — smaller on mobile to avoid overflow */}
      <div className="absolute top-[-10%] left-[-10%] w-[280px] h-[280px] sm:w-[500px] sm:h-[500px] bg-emerald-600/20 rounded-full blur-[60px] sm:blur-[100px] animate-blob pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[280px] h-[280px] sm:w-[500px] sm:h-[500px] bg-teal-500/15 rounded-full blur-[60px] sm:blur-[100px] animate-blob-slow pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[180px] h-[180px] sm:w-[300px] sm:h-[300px] bg-amber-500/10 rounded-full blur-[50px] sm:blur-[80px] animate-blob-slower pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating particles */}
      <div className="absolute top-[15%] left-[20%] w-2 h-2 bg-emerald-400/40 rounded-full animate-float pointer-events-none" />
      <div className="absolute top-[60%] left-[10%] w-1.5 h-1.5 bg-teal-400/30 rounded-full animate-float-slow pointer-events-none" />
      <div className="absolute top-[30%] right-[15%] w-1 h-1 bg-amber-400/40 rounded-full animate-float-slower pointer-events-none" />
      <div className="absolute bottom-[20%] left-[30%] w-2.5 h-2.5 bg-emerald-300/20 rounded-full animate-float pointer-events-none" />
      <div className="absolute top-[70%] right-[25%] w-1.5 h-1.5 bg-emerald-400/30 rounded-full animate-float-slow pointer-events-none" />

      <div className="w-full max-w-[420px] min-w-0 px-1 sm:px-0 relative z-10 animate-slide-up">
        {/* Logo + Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-glow-emerald mb-4 sm:mb-5 animate-float-slow bg-white/5">
            <img src="/tea.png" alt="Cropwise" className="w-full h-full object-contain p-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-shadow">
            Cropwise
          </h1>
          <p className="mt-1.5 sm:mt-2 text-emerald-300/70 text-xs sm:text-sm font-medium tracking-wide px-2">
            Seed Protection Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white/[0.07] backdrop-blur-2xl border border-white/[0.08] shadow-glass-lg overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-white/[0.06]">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError('') }}
              className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-all duration-300 ${
                !isSignUp
                  ? 'text-white bg-white/[0.06] border-b-2 border-emerald-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError('') }}
              className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-all duration-300 ${
                isSignUp
                  ? 'text-white bg-white/[0.06] border-b-2 border-emerald-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Create account
            </button>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-medium animate-scale-in" role="alert">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5">
              {isSignUp && (
                <div className="animate-slide-up">
                  <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-2">
                    Your name
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/30 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-2">
                  Mobile number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(mobileOnly(e.target.value))}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    maxLength={10}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/30 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 transition-all duration-300 relative overflow-hidden min-h-[44px]"
            >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none" />
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Please wait...
                  </span>
                ) : isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-white/20 text-xs tracking-wide">
            Satellite-powered AgriTech for Indian farmers
          </p>
        </div>
      </div>
    </div>
  )
}
