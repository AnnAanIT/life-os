'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { formatVND } from '@/lib/format'
import { parseSmartAmount } from '@/lib/parse-amount'

type State =
  | { status: 'idle' }
  | { status: 'loading'; currency: string }
  | { status: 'resolved'; vnd: number; currency?: string; rate?: number }
  | { status: 'error'; currency: string }

interface Props {
  placeholder: string
  onValue: (vnd: number | null) => void
  className?: string
  required?: boolean
  autoFocus?: boolean
  resetSignal?: number      // increment to clear the input
  defaultValue?: number | null  // pre-fill with existing VND value
}

export function SmartAmountInput({
  placeholder,
  onValue,
  className = '',
  required,
  autoFocus,
  resetSignal,
  defaultValue,
}: Props) {
  const [raw, setRaw]     = useState(defaultValue ? String(defaultValue) : '')
  const [state, setState] = useState<State>(
    defaultValue ? { status: 'resolved', vnd: defaultValue } : { status: 'idle' }
  )
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(false)

  // Report default value to parent on mount
  useEffect(() => {
    if (defaultValue) onValue(defaultValue)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when resetSignal changes — skip first mount so defaultValue isn't cleared
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    setRaw('')
    setState({ status: 'idle' })
    onValue(null)
  }, [resetSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  const resolve = useCallback(async (input: string) => {
    if (!input.trim()) {
      setState({ status: 'idle' })
      onValue(null)
      return
    }

    const parsed = parseSmartAmount(input)

    if (parsed.vnd !== null) {
      setState({ status: 'resolved', vnd: parsed.vnd })
      onValue(parsed.vnd)
      return
    }

    if (parsed.fxCurrency && parsed.fxAmount !== null) {
      setState({ status: 'loading', currency: parsed.fxCurrency })
      try {
        const res  = await fetch(`/api/prices/fx?currency=${parsed.fxCurrency}`)
        const data = await res.json()
        const rate: number = data.rate
        if (rate) {
          const vnd = Math.round(parsed.fxAmount * rate)
          setState({ status: 'resolved', vnd, currency: parsed.fxCurrency, rate: Math.round(rate) })
          onValue(vnd)
        } else {
          setState({ status: 'error', currency: parsed.fxCurrency })
          onValue(null)
        }
      } catch {
        setState({ status: 'error', currency: parsed.fxCurrency })
        onValue(null)
      }
      return
    }

    setState({ status: 'idle' })
    onValue(null)
  }, [onValue])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setRaw(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => resolve(val), 350)
  }

  const showVndIcon = state.status !== 'resolved' || !state.currency

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={raw}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          className={`${className} ${showVndIcon ? 'pr-8' : ''}`}
        />
        {showVndIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 pointer-events-none">₫</span>
        )}
      </div>

      {state.status === 'loading' && (
        <p className="text-xs text-stone-400 mt-1 px-1">Đang lấy tỷ giá {state.currency}...</p>
      )}
      {state.status === 'resolved' && (
        <p className="text-xs text-emerald-600 mt-1 px-1">
          = {formatVND(state.vnd)}
          {state.currency && state.rate && (
            <span className="text-stone-400 ml-1">(1 {state.currency} ≈ {formatVND(state.rate)})</span>
          )}
        </p>
      )}
      {state.status === 'error' && (
        <p className="text-xs text-red-400 mt-1 px-1">Không lấy được tỷ giá {state.currency}. Nhập VND thay thế.</p>
      )}
    </div>
  )
}
