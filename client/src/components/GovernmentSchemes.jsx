  import { useState, useEffect, useCallback } from 'react'

  /* ── Scope badge colors ── */
  const SCOPE_STYLES = {
    Central: 'bg-blue-100 text-blue-700 border-blue-200',
    Gujarat: 'bg-orange-100 text-orange-700 border-orange-200',
    Maharashtra: 'bg-purple-100 text-purple-700 border-purple-200',
    All: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }

  const INCIDENT_TYPES = ['Flood', 'Drought', 'Hailstorm', 'Cyclone', 'Pest Attack', 'Unseasonal Rain']

  const BACKEND_ORIGIN = (import.meta.env.VITE_BACKEND_ORIGIN || '').replace(/\/$/, '')
  // Use the Vite proxy in development; direct backend origin is used for preview/production.
  const schemesBase = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/schemes` : '/schemes-api'
  /** Normalize base64 for atob (padding, whitespace). */
  function normalizeBase64(b64) {
    if (!b64 || typeof b64 !== 'string') return ''
    const s = b64.replace(/\s/g, '')
    const pad = s.length % 4
    return pad ? s + '='.repeat(4 - pad) : s
  }

  function downloadPdfFromBase64(base64, filename = 'PMFBY_Claim.pdf') {
    const normalized = normalizeBase64(base64)
    if (!normalized) throw new Error('No PDF data')
    const bin = atob(normalized)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  /** Same-origin path (Vite proxy) or full backend URL for preview/production. */
  function resolvePdfFetchUrl(pdfUrl) {
    if (!pdfUrl) return ''
    if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) return pdfUrl
    const origin = import.meta.env.VITE_BACKEND_ORIGIN?.replace(/\/$/, '') || ''
    if (origin) return `${origin}${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`
    return pdfUrl
  }

  export default function GovernmentSchemes({ profile }) {
    /* ── Scheme Discovery State ── */
    const [schemes, setSchemes] = useState([])
    const [schemesLoading, setSchemesLoading] = useState(true)
    const [schemesError, setSchemesError] = useState(null)
    const [expandedScheme, setExpandedScheme] = useState(null)

    /* ── Claim Filing State ── */
    const [showClaimForm, setShowClaimForm] = useState(false)
    const [claimForm, setClaimForm] = useState({
      farmerName: profile?.farmer_name || '',
      uid: profile?.aadhaar || '',
      location: profile?.village || '',
      bankAcc: '',
      crop: profile?.primary_crop || '',
      sowingDate: '',
      policyNo: '',
      area: profile?.land_area || '',
      incidentType: 'Flood',
      incidentDate: '',
      rainfall: '',
    })
    const [claimLoading, setClaimLoading] = useState(false)
    const [claimResult, setClaimResult] = useState(null)
    const [claimError, setClaimError] = useState(null)
    /** PDF from last successful claim (?format=pdf) — avoids GET /schemes/static 404 in dev */
    const [claimPdfBlob, setClaimPdfBlob] = useState(null)

    /* ── Fetch recommended schemes ── */
    const fetchSchemes = useCallback(async () => {
      setSchemesLoading(true)
      setSchemesError(null)
      try {
        const landHa = profile?.land_unit === 'acre'
          ? (parseFloat(profile?.land_area) || 2) * 0.4047
          : parseFloat(profile?.land_area) || 2
        const category = landHa < 2 ? 'small_farmer' : 'large_farmer'

        const res = await fetch(`${schemesBase}/api/v1/schemes/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state: profile?.state || 'Gujarat',
            land_size_hectares: landHa,
            category,
          }),
        })
        if (!res.ok) throw new Error('API returned ' + res.status)
        const data = await res.json()
        setSchemes(data.schemes || [])
      } catch (err) {
        setSchemesError(err.message)
      } finally {
        setSchemesLoading(false)
      }
    }, [profile?.state, profile?.land_area, profile?.land_unit])

    useEffect(() => { fetchSchemes() }, [fetchSchemes])

    /* ── Pre-fill form when profile loads ── */
    useEffect(() => {
      if (!profile) return
      setClaimForm(prev => ({
        ...prev,
        farmerName: profile.farmer_name || prev.farmerName,
        uid: profile.aadhaar || prev.uid,
        location: profile.village || prev.location,
        crop: profile.primary_crop || prev.crop,
        area: profile.land_area || prev.area,
      }))
    }, [profile])

    /* ── Submit insurance claim ── */
    const submitClaim = async (e) => {
      e.preventDefault()
      setClaimLoading(true)
      setClaimError(null)
      setClaimResult(null)
      setClaimPdfBlob(null)
      const body = JSON.stringify({
        farmer: {
          name: claimForm.farmerName,
          uid: claimForm.uid,
          location: claimForm.location,
          bank_acc: claimForm.bankAcc,
        },
        crop: {
          crop: claimForm.crop,
          sowing_date: claimForm.sowingDate,
          policy_no: claimForm.policyNo,
          area: String(claimForm.area),
        },
        incident: {
          type: claimForm.incidentType,
          timestamp: claimForm.incidentDate,
          detected_rainfall_mm: parseFloat(claimForm.rainfall) || 0,
        },
      })
      try {
        // Raw PDF response — no JSON/base64/static URL (fixes 404 on /schemes/static)
        const res = await fetch(`${schemesBase}/api/v1/claims/generate?format=pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        })
        if (!res.ok) {
          const text = await res.text()
          let msg = text || `Claim failed (${res.status})`
          try {
            const j = JSON.parse(text)
            if (typeof j.detail === 'string') msg = j.detail
            else if (Array.isArray(j.detail)) msg = j.detail.map((d) => d.msg || d).join('; ')
          } catch {
            /* use msg */
          }
          throw new Error(msg)
        }

        const ct = res.headers.get('content-type') || ''
        if (ct.includes('application/pdf')) {
          const buf = await res.arrayBuffer()
          if (buf.byteLength < 80) {
            const t = new TextDecoder().decode(buf)
            try {
              const j = JSON.parse(t)
              throw new Error(typeof j.detail === 'string' ? j.detail : 'PDF generation failed')
            } catch (parseErr) {
              if (parseErr instanceof SyntaxError) throw new Error(t || 'Invalid PDF response')
              throw parseErr
            }
          }
          const blob = new Blob([buf], { type: 'application/pdf' })
          const risk = res.headers.get('X-Claim-Risk') || 'LOW'
          const loss = res.headers.get('X-Claim-Loss') || '10%'
          setClaimPdfBlob(blob)
          setClaimResult({
            status: 'success',
            ai_assessment: { risk_level: risk, loss_percentage: loss },
            pdf_ready: true,
          })
          const u = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = u
          a.download = 'PMFBY_Claim.pdf'
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(u)
          return
        }

        const data = await res.json()
        const merged = {
          ...data,
          pdf_base64: data.pdf_base64 ?? data.pdfBase64,
          pdf_url: data.pdf_url ?? data.pdfUrl,
        }
        setClaimResult(merged)
      } catch (err) {
        setClaimError(err.message)
      } finally {
        setClaimLoading(false)
      }
    }

    const updateField = (field, value) => setClaimForm(prev => ({ ...prev, [field]: value }))

    /* ═══════════════════════════════════════
      RENDER
      ═══════════════════════════════════════ */
    return (
      <div className="space-y-4 sm:space-y-6 max-w-6xl w-full min-w-0 animate-fade-in">

        {/* ── Hero ── */}
        <div className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-4 sm:p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/[0.03] rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl sm:text-2xl">🏛️</span>
              <p className="text-indigo-200 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">AI-Powered Scheme Matcher</p>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold mt-1">Government Schemes & Insurance Claims</h2>
            <p className="text-indigo-100/70 text-xs sm:text-sm mt-2 max-w-xl">
              Discover schemes you're eligible for based on your farm profile, and file crop insurance claims with AI-verified damage assessment — all in one place.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4 mt-4">
              <span className="text-indigo-200/80 text-[10px] sm:text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 bg-indigo-300 rounded-full" />
                {schemes.length} scheme{schemes.length !== 1 ? 's' : ''} matched
              </span>
              <span className="text-indigo-200/80 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 bg-violet-300 rounded-full" />
                {profile?.state || 'Gujarat'} farmer
              </span>
            </div>
          </div>
        </div>

        {/* ── Scheme Discovery ── */}
        <div className="rounded-xl sm:rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden min-w-0">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h3 className="font-bold text-stone-800 text-sm sm:text-base">Eligible Government Schemes</h3>
              <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5">Personalized for your state, land size, and farmer category</p>
            </div>
            <button
              onClick={fetchSchemes}
              disabled={schemesLoading}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg border border-indigo-200 transition-all disabled:opacity-50 shrink-0 min-h-[36px]"
            >
              {schemesLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {schemesLoading && (
            <div className="p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-stone-500">Finding schemes for you...</p>
              </div>
            </div>
          )}

          {schemesError && (
            <div className="p-6">
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
                <p className="text-sm font-semibold text-red-700">Could not load schemes</p>
                <p className="text-xs text-red-500 mt-1">{schemesError}</p>
                <p className="text-xs text-stone-400 mt-2">The scheme service is running with the AI API. Keep it running and refresh this tab.</p>
              </div>
            </div>
          )}

          {!schemesLoading && !schemesError && schemes.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-stone-400 text-sm">No schemes matched your profile. Try updating your registration details.</p>
            </div>
          )}

          {!schemesLoading && !schemesError && schemes.length > 0 && (
            <div className="divide-y divide-stone-100">
              {schemes.map((scheme, idx) => {
                const isExpanded = expandedScheme === idx
                const scope = scheme.type || 'All'
                const scopeStyle = SCOPE_STYLES[scope] || SCOPE_STYLES.All
                /* API only returns schemes that pass state/category rules — treat as eligible. */
                const isEligible = scheme.eligible !== false

                return (
                  <div key={idx} className="group">
                    <div
                      className="px-4 sm:px-6 py-4 sm:py-5 flex items-start gap-3 sm:gap-4 cursor-pointer hover:bg-stone-50/50 transition-colors"
                      onClick={() => setExpandedScheme(isExpanded ? null : idx)}
                    >
                      {/* Rank */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0">
                        #{idx + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-bold text-stone-800 text-[15px]">{scheme.scheme_name}</h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${scopeStyle}`}>{scope}</span>
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed">{scheme.description}</p>

                        <div className="mt-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                              isEligible
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                            {isEligible ? 'Eligible' : 'Not eligible'}
                          </span>
                        </div>
                      </div>

                      {/* Expand arrow */}
                      <svg
                        className={`w-5 h-5 text-stone-400 shrink-0 mt-2 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-6 pb-5 pt-0 ml-14 animate-fade-in">
                        <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 space-y-3">
                          <div className="rounded-lg bg-white border border-stone-200 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Farmer eligibility</p>
                              <p className="text-sm font-bold text-stone-800 mt-0.5">
                                {isEligible ? 'You are eligible for this scheme.' : 'You are not eligible for this scheme.'}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 self-start sm:self-center text-xs font-bold px-3 py-1.5 rounded-lg border ${
                                isEligible
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-stone-100 text-stone-600 border-stone-200'
                              }`}
                            >
                              {isEligible ? 'Eligible' : 'Not eligible'}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Details</p>
                            <p className="text-sm text-stone-700 mt-0.5">{scheme.eligibility_text || scheme.description}</p>
                          </div>
                          {Array.isArray(scheme.documents) && scheme.documents.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Documents usually required</p>
                              <p className="text-sm text-stone-700 mt-0.5">{scheme.documents.join(', ')}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {scheme.official_url && (
                              <a
                                href={scheme.official_url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => event.stopPropagation()}
                                className="text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-50"
                              >
                                Official information
                              </a>
                            )}
                            {scheme.apply_url && (
                              <a
                                href={scheme.apply_url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => event.stopPropagation()}
                                className="text-xs font-bold text-emerald-700 bg-white border border-emerald-200 rounded-lg px-3 py-2 hover:bg-emerald-50"
                              >
                                Apply online
                              </a>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-white border border-stone-200 p-3 text-center">
                              <p className="text-[10px] text-stone-400 font-semibold uppercase">Scope</p>
                              <p className="text-sm font-bold text-stone-800 mt-0.5">{scope}</p>
                            </div>
                            <div className="rounded-lg bg-white border border-stone-200 p-3 text-center">
                              <p className="text-[10px] text-stone-400 font-semibold uppercase">Category</p>
                              <p className="text-sm font-bold text-stone-800 mt-0.5 capitalize">{profile?.land_area && parseFloat(profile.land_area) < 5 ? 'Small Farmer' : 'All Farmers'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Insurance Claim Section ── */}
        <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
          <div
            className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-stone-50/50 transition-colors"
            onClick={() => setShowClaimForm(!showClaimForm)}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl shadow-md">
                📋
              </div>
              <div>
                <h3 className="font-bold text-stone-800">File Insurance Claim (PMFBY)</h3>
                <p className="text-xs text-stone-400 mt-0.5">AI-verified damage assessment with instant PDF generation</p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-stone-400 transition-transform duration-200 ${showClaimForm ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {showClaimForm && (
            <div className="border-t border-stone-100 animate-fade-in">
              {/* Claim result */}
              {claimResult && (
                <div className="px-6 pt-5">
                  <div className={`rounded-2xl p-5 ${
                    claimResult.ai_assessment?.risk_level === 'CRITICAL'
                      ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
                      : 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{claimResult.ai_assessment?.risk_level === 'CRITICAL' ? '🔴' : '🟢'}</span>
                        <div>
                          <p className="font-extrabold text-stone-800 text-lg">AI Assessment Complete</p>
                          <p className="text-xs text-stone-500">Claim generated successfully</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-xl bg-white border border-stone-200 p-4 text-center">
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Risk Level</p>
                        <p className={`text-2xl font-extrabold mt-1 ${
                          claimResult.ai_assessment?.risk_level === 'CRITICAL' ? 'text-red-600' : 'text-emerald-600'
                        }`}>{claimResult.ai_assessment?.risk_level}</p>
                      </div>
                      <div className="rounded-xl bg-white border border-stone-200 p-4 text-center">
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Estimated Loss</p>
                        <p className={`text-2xl font-extrabold mt-1 ${
                          claimResult.ai_assessment?.risk_level === 'CRITICAL' ? 'text-red-600' : 'text-emerald-600'
                        }`}>{claimResult.ai_assessment?.loss_percentage}</p>
                      </div>
                    </div>
                    {claimResult.status === 'success' && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              if (claimPdfBlob) {
                                const u = URL.createObjectURL(claimPdfBlob)
                                const a = document.createElement('a')
                                a.href = u
                                a.download = 'PMFBY_Claim.pdf'
                                document.body.appendChild(a)
                                a.click()
                                a.remove()
                                URL.revokeObjectURL(u)
                                return
                              }
                              const b64 = claimResult.pdf_base64 ?? claimResult.pdfBase64
                              const relUrl = claimResult.pdf_url ?? claimResult.pdfUrl
                              if (b64) {
                                downloadPdfFromBase64(b64)
                                return
                              }
                              const href = resolvePdfFetchUrl(relUrl)
                              if (!href) throw new Error('No PDF in response')
                              const r = await fetch(href)
                              if (!r.ok) throw new Error(`Could not fetch PDF (${r.status})`)
                              const blob = await r.blob()
                              if (!blob.size) throw new Error('Empty PDF')
                              const obj = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = obj
                              a.download = 'PMFBY_Claim.pdf'
                              document.body.appendChild(a)
                              a.click()
                              a.remove()
                              URL.revokeObjectURL(obj)
                            } catch (e) {
                              console.error(e)
                              window.alert(e?.message ? `Download failed: ${e.message}` : 'Could not download PDF.')
                            }
                          }}
                          disabled={
                            !claimPdfBlob &&
                            !claimResult.pdf_base64 &&
                            !claimResult.pdfBase64 &&
                            !claimResult.pdf_url &&
                            !claimResult.pdfUrl
                          }
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm hover:brightness-110 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Claim PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {claimError && (
                <div className="px-6 pt-5">
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
                    <p className="text-sm font-semibold text-red-700">Claim generation failed</p>
                    <p className="text-xs text-red-500 mt-1">{claimError}</p>
                  </div>
                </div>
              )}

              {/* Claim form */}
              <form onSubmit={submitClaim} className="p-6 space-y-5">
                {/* Farmer details */}
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-extrabold">1</span>
                    Farmer Details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500 mb-1 block">Full Name</label>
                      <input
                        type="text" required value={claimForm.farmerName}
                        onChange={e => updateField('farmerName', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500 mb-1 block">Aadhaar / Farmer ID</label>
                      <input
                        type="text" required value={claimForm.uid}
                        onChange={e => updateField('uid', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500 mb-1 block">Village / Tehsil</label>
                      <input
                        type="text" required value={claimForm.location}
                        onChange={e => updateField('location', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500 mb-1 block">Bank Account No.</label>
                      <input
                        type="text" required value={claimForm.bankAcc}
                        onChange={e => updateField('bankAcc', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        placeholder="Enter bank account number"
                      />
                    </div>
                  </div>
                </div>

                {/* Crop details */}
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-extrabold">2</span>
                    Insured Crop Details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500 mb-1 block">Crop</label>
                      <input
                        type="text" required value={claimForm.crop}
                        onChange={e => updateField('crop', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500 mb-1 block">Sowing Date</label>
                      <input
                        type="date" required value={claimForm.sowingDate}
                        onChange={e => updateField('sowingDate', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500 mb-1 block">Policy Number</label>
                      <input
                        type="text" required value={claimForm.policyNo}
                        onChange={e => updateField('policyNo', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        placeholder="PMFBY policy number"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500 mb-1 block">Land Area (Hectares)</label>
                      <input
                        type="number" step="0.1" required value={claimForm.area}
                        onChange={e => updateField('area', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Incident details */}
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-extrabold">3</span>
                    Incident &amp; Damage Report
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500 mb-1 block">Incident Type</label>
                      <select
                        value={claimForm.incidentType}
                        onChange={e => updateField('incidentType', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none cursor-pointer"
                      >
                        {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500 mb-1 block">Date of Incident</label>
                      <input
                        type="date" required value={claimForm.incidentDate}
                        onChange={e => updateField('incidentDate', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500 mb-1 block">Detected Rainfall (mm)</label>
                      <input
                        type="number" step="0.1" required value={claimForm.rainfall}
                        onChange={e => updateField('rainfall', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        placeholder="e.g. 150"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2 italic">
                    AI will assess risk level and estimate crop loss based on rainfall data. Claims with rainfall &gt; 100mm are flagged as CRITICAL.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={claimLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm hover:brightness-110 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {claimLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Generating claim...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Generate AI-Verified Claim
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    )
  }
