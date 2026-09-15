import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { LANGUAGES } from './languages'
import { translateDocument } from './translator'

const TranslationContext = createContext(null)

export function TranslationProvider({ children }) {
  const apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || ''
  const [language, setLanguage] = useState(() => localStorage.getItem('br:language') || 'en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState('')
  const observerRef = useRef(null)
  const debounceRef = useRef(null)
  const applyingRef = useRef(false)

  useEffect(() => {
    localStorage.setItem('br:language', language)
  }, [language])

  useEffect(() => {
    let cancelled = false

    async function runTranslation() {
      setError('')
      if (!apiKey && language !== 'en') {
        setError('Missing Google Translate API key.')
        return
      }

      setIsTranslating(true)
      applyingRef.current = true
      try {
        await translateDocument({ targetLang: language, apiKey })
        document.documentElement.lang = language || 'en'
      } catch (err) {
        setError(err?.message || 'Translation failed.')
      } finally {
        applyingRef.current = false
        if (!cancelled) setIsTranslating(false)
      }
    }

    runTranslation()

    return () => {
      cancelled = true
    }
  }, [language, apiKey])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    if (language === 'en') return

    const observer = new MutationObserver(() => {
      if (applyingRef.current) return

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        applyingRef.current = true
        try {
          await translateDocument({ targetLang: language, apiKey })
        } catch (err) {
          setError(err?.message || 'Translation failed.')
        } finally {
          applyingRef.current = false
        }
      }, 120)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    observerRef.current = observer

    return () => {
      observer.disconnect()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [language, apiKey])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      languages: LANGUAGES,
      isTranslating,
      error,
      apiKeyPresent: Boolean(apiKey),
    }),
    [language, isTranslating, error, apiKey],
  )

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
}

export function useTranslator() {
  const ctx = useContext(TranslationContext)
  if (!ctx) {
    throw new Error('useTranslator must be used within TranslationProvider.')
  }
  return ctx
}
