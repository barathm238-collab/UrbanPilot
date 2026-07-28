import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, MapPin, X } from 'lucide-react'
import type { SearchResult } from './types'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const cache = new Map<string, SearchResult[]>()

async function nominatimSearch(query: string): Promise<SearchResult[]> {
  if (cache.has(query)) return cache.get(query)!
  const url = `${NOMINATIM}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&countrycodes=in`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  if (!res.ok) throw new Error('Search unavailable')
  const data = (await res.json()) as Array<{ place_id: number; display_name: string; lat: string; lon: string }>
  const results: SearchResult[] = data.map((d) => ({
    place_id: d.place_id,
    display_name: d.display_name,
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
  }))
  cache.set(query, results)
  return results
}

type LocationSearchProps = {
  label: string
  placeholder: string
  icon: React.ReactNode
  value: SearchResult | null
  onSelect: (result: SearchResult) => void
  onClear: () => void
}

export function LocationSearch({ label, placeholder, icon, value, onSelect, onClear }: LocationSearchProps) {
  const [query, setQuery] = useState(value?.display_name.split(',')[0] ?? '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!value) setQuery('')
  }, [value])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setResults([]); setOpen(false); return }
    setLoading(true)
    setError(null)
    try {
      const data = await nominatimSearch(q)
      setResults(data)
      setOpen(true)
      if (data.length === 0) setError('No results found')
    } catch {
      setError('Search unavailable — check your connection')
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (value) onClear()
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(q), 350)
  }

  const handleSelect = (result: SearchResult) => {
    setQuery(result.display_name.split(',')[0])
    setOpen(false)
    setResults([])
    onSelect(result)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
    onClear()
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block rounded-xl border border-[#e0e0e0] bg-white p-3 transition focus-within:border-[#1a73e8] focus-within:ring-2 focus-within:ring-[#1a73e8]/20 hover:border-[#bdbdbd]">
        <span className="flex items-center gap-2 text-xs font-medium text-[#5f6368]">
          {icon} {label}
        </span>
        <div className="mt-1.5 flex items-center gap-2">
          <input
            value={query}
            onChange={handleChange}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder={placeholder}
            className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-[#202124] outline-none placeholder:text-[#9aa0a6]"
          />
          {loading && <Loader2 size={14} className="shrink-0 animate-spin text-[#5f6368]" />}
          {!loading && query && (
            <button type="button" onClick={handleClear} className="shrink-0 text-[#9aa0a6] hover:text-[#5f6368]">
              <X size={14} />
            </button>
          )}
        </div>
      </label>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-1 overflow-hidden rounded-xl border border-[#e0e0e0] bg-white shadow-lg">
          {error ? (
            <p className="px-4 py-3 text-sm text-[#ea4335]">{error}</p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={r.place_id}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelect(r)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#f1f3f4]"
                  >
                    <MapPin size={14} className="mt-0.5 shrink-0 text-[#ea4335]" />
                    <span className="text-sm leading-5 text-[#202124]">{r.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
