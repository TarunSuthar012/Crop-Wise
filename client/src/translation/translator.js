const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'IFRAME',
  'TEXTAREA',
  'INPUT',
  'CODE',
  'PRE',
  'SVG',
  'PATH',
  'HEAD',
  'TITLE',
])

const ORIGINAL_TEXT = new WeakMap()
const CACHE = new Map()

function getCache(lang) {
  if (!CACHE.has(lang)) {
    CACHE.set(lang, new Map())
  }
  return CACHE.get(lang)
}

function getOriginalText(node) {
  if (!ORIGINAL_TEXT.has(node)) {
    ORIGINAL_TEXT.set(node, node.textContent)
  }
  return ORIGINAL_TEXT.get(node)
}

function decodeHtml(text) {
  const decoder = document.createElement('textarea')
  decoder.innerHTML = text
  return decoder.value
}

function isTranslatableNode(node) {
  if (!node?.parentElement) return false
  if (!node.textContent || !node.textContent.trim()) return false
  const parent = node.parentElement
  if (parent.closest('[data-no-translate="true"]')) return false
  if (parent.isContentEditable) return false
  if (SKIP_TAGS.has(parent.tagName)) return false
  return true
}

function collectTextNodes(root) {
  const nodes = []
  if (!root) return nodes

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return isTranslatableNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    },
  })

  let current = walker.nextNode()
  while (current) {
    nodes.push(current)
    current = walker.nextNode()
  }

  return nodes
}

async function translateBatch({ texts, targetLang, apiKey, sourceLang }) {
  if (!texts.length) return []
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: texts,
        target: targetLang,
        source: sourceLang,
        format: 'text',
      }),
    },
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`Translate API error (${res.status}): ${msg || 'Unknown error'}`)
  }

  const data = await res.json()
  const translations = data?.data?.translations
  if (!Array.isArray(translations) || translations.length !== texts.length) {
    throw new Error('Translate API returned unexpected response.')
  }

  return translations.map((t) => decodeHtml(t.translatedText || ''))
}

export async function translateDocument({
  targetLang,
  apiKey,
  sourceLang = 'en',
  root = document.body,
  batchSize = 50,
}) {
  const nodes = collectTextNodes(root)

  if (targetLang === sourceLang) {
    nodes.forEach((node) => {
      const original = getOriginalText(node)
      if (node.textContent !== original) node.textContent = original
    })
    return
  }

  if (!apiKey) {
    throw new Error('Missing Google Translate API key.')
  }

  const cache = getCache(targetLang)
  const pendingTexts = []
  const nodeMap = new Map()

  nodes.forEach((node) => {
    const original = getOriginalText(node)
    if (!original || !original.trim()) return

    const cached = cache.get(original)
    if (cached) {
      if (node.textContent !== cached) node.textContent = cached
      return
    }

    if (nodeMap.has(original)) {
      nodeMap.get(original).push(node)
    } else {
      nodeMap.set(original, [node])
      pendingTexts.push(original)
    }
  })

  for (let i = 0; i < pendingTexts.length; i += batchSize) {
    const batch = pendingTexts.slice(i, i + batchSize)
    const translated = await translateBatch({
      texts: batch,
      targetLang,
      apiKey,
      sourceLang,
    })

    translated.forEach((value, idx) => {
      cache.set(batch[idx], value)
    })
  }

  nodeMap.forEach((nodesForText, original) => {
    const translated = cache.get(original) || original
    nodesForText.forEach((node) => {
      if (node.textContent !== translated) node.textContent = translated
    })
  })
}
