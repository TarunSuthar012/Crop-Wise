import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslator } from './TranslationProvider'

export default function TranslateMenu({ className = '' }) {
  const { language, setLanguage, languages, isTranslating, error } = useTranslator()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  const active = useMemo(
    () => languages.find((l) => l.code === language) || languages[0],
    [language, languages],
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (!menuRef.current || menuRef.current.contains(event.target)) return
      setOpen(false)
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div ref={menuRef} data-no-translate="true" className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 bg-white/70 hover:bg-white text-stone-700 text-sm font-semibold shadow-sm transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base">🌐</span>
        <span>{active?.label || 'Translate'}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-stone-200 bg-white shadow-lg overflow-hidden z-50">
          <div className="max-h-64 overflow-auto">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code)
                  setOpen(false)
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors ${
                  language === lang.code
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
                role="option"
                aria-selected={language === lang.code}
              >
                <span>{lang.label}</span>
                {language === lang.code && <span className="text-emerald-500">✓</span>}
              </button>
            ))}
          </div>
          {(isTranslating || error) && (
            <div className="border-t border-stone-100 px-4 py-2 text-xs">
              {isTranslating && <span className="text-stone-500">Translating...</span>}
              {!isTranslating && error && <span className="text-red-500">{error}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
