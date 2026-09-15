import { useEffect, useRef, useState } from 'react'

const GOOGLE_TRANSLATE_SCRIPT_ID = 'google-translate-script'

function loadGoogleTranslateScript() {
  return new Promise((resolve) => {
    if (document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID)) {
      resolve()
      return
    }

    window.googleTranslateElementInit = () => {
      resolve()
    }

    const script = document.createElement('script')
    script.id = GOOGLE_TRANSLATE_SCRIPT_ID
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    document.body.appendChild(script)
  })
}

function getGoogleTranslateCookie() {
  const match = document.cookie.match(/googtrans=\/[^/]*\/([^;]+)/)
  return match ? match[1] : 'en'
}

function setGoogleTranslateLanguage(langCode) {
  const domain = window.location.hostname
  document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain}`
  document.cookie = `googtrans=/en/${langCode}; path=/`
  
  // Trigger translation by reloading the page or using the widget
  const select = document.querySelector('.goog-te-combo')
  if (select) {
    select.value = langCode
    select.dispatchEvent(new Event('change'))
  } else {
    // If widget not ready, reload
    window.location.reload()
  }
}

export default function GoogleTranslateWidget({ className = '' }) {
  const containerRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    loadGoogleTranslateScript().then(() => {
      if (containerRef.current && window.google?.translate?.TranslateElement) {
        // Clear any existing widget
        containerRef.current.innerHTML = ''
        
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi,bn,te,mr,ta,ur,gu,kn,ml,pa,or,as,ne,sa',
            layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
            autoDisplay: false,
          },
          containerRef.current,
        )
        setLoaded(true)
      }
    })

    // Check current language from cookie
    setCurrentLang(getGoogleTranslateCookie())
  }, [])

  return (
    <div className={`google-translate-container ${className}`} data-no-translate="true">
      <div ref={containerRef} />
      {!loaded && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 bg-white/70 text-stone-500 text-sm">
          <span>🌐</span>
          <span>Loading...</span>
        </div>
      )}
    </div>
  )
}
