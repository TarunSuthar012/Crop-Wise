import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Registration from './pages/Registration'
import Dashboard from './pages/Dashboard'
import { TranslationProvider } from './translation/TranslationProvider'
import { loadRegistration } from './lib/registration'
import ChatbotWidget from './components/ChatbotWidget'

function App() {
  const { session, registrationComplete, loading, refresh, signOut } = useAuth()
  const [registration, setRegistration] = useState(null)

  useEffect(() => {
    if (session?.id && registrationComplete) {
      loadRegistration(session.id).then((data) => {
        if (data) setRegistration(data)
      })
    } else {
      setRegistration(null)
    }
  }, [session?.id, registrationComplete])


  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 flex flex-col items-center justify-center gap-4 sm:gap-6 p-4 overflow-x-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-40 h-40 sm:w-64 sm:h-64 bg-emerald-500/20 rounded-full blur-2xl sm:blur-3xl animate-blob" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-teal-500/20 rounded-full blur-2xl sm:blur-3xl animate-blob-slow" />
        </div>

        {/* Logo */}
        <div className="relative animate-float">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden shadow-glow-emerald bg-white/5 flex items-center justify-center">
            <img src="/tea.png" alt="Cropwise" className="w-full h-full object-contain p-1" />
          </div>
        </div>

        {/* Spinner */}
        <div className="relative">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-[3px] border-white/10 border-t-emerald-400 animate-spin" />
        </div>

        <p className="text-emerald-200/80 font-medium tracking-wide text-xs sm:text-sm">Loading Cropwise...</p>
      </div>
    )
  }

  return (
    <TranslationProvider>
      <Routes>
        {/* Login: only accessible when NOT logged in */}
        <Route
          path="/login"
          element={
            !session
              ? <Login onLogin={refresh} />
              : registrationComplete
                ? <Navigate to="/dashboard" replace />
                : <Navigate to="/registration" replace />
          }
        />

        {/* Registration: only accessible when logged in and NOT registered */}
        <Route
          path="/registration"
          element={
            !session
              ? <Navigate to="/login" replace />
              : registrationComplete
                ? <Navigate to="/dashboard" replace />
                : <Registration session={session} onComplete={refresh} onSignOut={signOut} />
          }
        />

        {/* Dashboard: only accessible when logged in and registered */}
        <Route
          path="/dashboard"
          element={
            !session
              ? <Navigate to="/login" replace />
              : !registrationComplete
                ? <Navigate to="/registration" replace />
                : <Dashboard session={session} onSignOut={signOut} />
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      {session && registrationComplete && (
        <ChatbotWidget farmerContext={registration} />
      )}
    </TranslationProvider>
  )
}

export default App
