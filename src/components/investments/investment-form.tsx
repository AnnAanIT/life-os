'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatVND } from '@/lib/format'
import { SmartAmountInput } from '@/components/ui/smart-amount-input'
import { Plus, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ASSET_TYPES = [
  { value: 'crypto',      label: '₿ Crypto',          hasUnits: true  },
  { value: 'gold',        label: '🪙 Vàng',            hasUnits: true  },
  { value: 'stock',       label: '📈 Chứng khoán',     hasUnits: true  },
  { value: 'savings',     label: '🏦 Tiết kiệm',       hasUnits: false },
  { value: 'real_estate', label: '🏠 Bất động sản',    hasUnits: false },
  { value: 'cash',        label: '💵 Tiền mặt',        hasUnits: false },
  { value: 'other',       label: '💼 Khác',            hasUnits: false },
]

const CRYPTO_LIST = [
  { symbol: 'BTC',  name: 'Bitcoin'  },
  { symbol: 'ETH',  name: 'Ethereum' },
  { symbol: 'BNB',  name: 'BNB'      },
  { symbol: 'SOL',  name: 'Solana'   },
  { symbol: 'XRP',  name: 'XRP'      },
  { symbol: 'TON',  name: 'TON'      },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'USDT', name: 'Tether'   },
  { symbol: 'ADA',  name: 'Cardano'  },
  { symbol: 'TRX',  name: 'TRON'     },
]

const GOLD_TYPES = [
  { value: 'SJC',      label: 'Vàng miếng SJC' },
  { value: 'NHAN9999', label: 'Vàng nhẫn 9999'  },
  { value: 'TIEM',     label: 'Vàng Tiệm'        },
]

const UNIT_DEFAULT: Record<string, string> = {
  gold:   'lượng',
  stock:  'cổ phiếu',
  crypto: '',
}

const INPUT = 'w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400'

type Phase = 'idle' | 'fetching-price' | 'saving'

interface Props { userId: string }

export function InvestmentForm({ userId }: Props) {
  const router = useRouter()
  const [open, setOpen]                 = useState(false)
  const [assetType, setAssetType]       = useState('crypto')
  const [name, setName]                 = useState('')
  const [symbol, setSymbol]             = useState('BTC')
  const [customSymbol, setCustomSymbol] = useState('')
  const [goldType, setGoldType]         = useState<'SJC' | 'NHAN9999' | 'TIEM'>('SJC')
  const [quantity, setQuantity]         = useState('')
  const [unit, setUnit]                 = useState('')
  const [buyPpu, setBuyPpu]             = useState<number | null>(null)
  const [totalVND, setTotalVND]         = useState<number | null>(null)
  const [initialVND, setInitialVND]     = useState<number | null>(null)
  const [buyDate, setBuyDate]           = useState(new Date().toISOString().slice(0, 10))
  const [phase, setPhase]               = useState<Phase>('idle')
  const [error, setError]               = useState<string | null>(null)
  const [resetKey, setResetKey]         = useState(0)

  const hasUnits = ASSET_TYPES.find(t => t.value === assetType)!.hasUnits
  const qty      = parseFloat(quantity.replace(',', '.'))
  const costPreview = buyPpu && qty > 0 ? formatVND(Math.round(buyPpu * qty)) : null
  const isPriceable = assetType === 'crypto' || assetType === 'gold' || assetType === 'stock'

  function handleTypeChange(type: string) {
    setAssetType(type)
    setUnit(UNIT_DEFAULT[type] ?? '')
    setSymbol('BTC')
    setGoldType('SJC')
    setName('')
    setQuantity('')
    setBuyPpu(null); setTotalVND(null); setInitialVND(null)
    setResetKey(k => k + 1)
    setError(null)
  }

  function resetForm() {
    setName(''); setSymbol('BTC'); setCustomSymbol(''); setGoldType('SJC'); setQuantity(''); setUnit('')
    setBuyPpu(null); setTotalVND(null); setInitialVND(null)
    setBuyDate(new Date().toISOString().slice(0, 10))
    setResetKey(k => k + 1)
    setError(null)
  }

  async function fetchMarketPrice(sym: string | null, assetName: string): Promise<number | null> {
    try {
      const res = await fetch('/api/investments/live-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assets: [{
            id:                 '__new__',
            name:               assetName,
            asset_type:         assetType,
            symbol:             sym,
            quantity:           qty,
            unit:               unit.trim() || null,
            buy_price_per_unit: buyPpu,
            buy_value:          null,
            current_value:      Math.round((buyPpu ?? 0) * qty),
          }],
        }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const result = data.results?.find((r: { id: string }) => r.id === '__new__')
      return result?.updated && result.currentPricePerUnit ? result.currentPricePerUnit : null
    } catch {
      return null
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const supabase = createClient()

    if (hasUnits) {
      if (!qty || !buyPpu) return

      let sym: string | null
      let assetName: string
      let assetUnit: string | null

      if (assetType === 'crypto') {
        sym       = symbol === '__custom' ? customSymbol.toUpperCase() : symbol
        assetName = sym + (name ? ` (${name})` : '')
        assetUnit = sym
      } else if (assetType === 'gold') {
        sym       = goldType
        assetName = GOLD_TYPES.find(g => g.value === goldType)!.label
        assetUnit = 'lượng'
      } else {
        // stock: store ticker as symbol so live-price lookup works
        sym       = name.trim().toUpperCase()
        assetName = name.trim().toUpperCase()
        assetUnit = unit.trim() || null
      }

      // Auto-fetch current market price for priceable assets
      let marketPpu: number | null = null
      if (isPriceable) {
        setPhase('fetching-price')
        marketPpu = await fetchMarketPrice(sym, assetName)
      }

      setPhase('saving')
      const effectivePpu = marketPpu ?? buyPpu
      const { data: newAsset, error: insertErr } = await supabase
        .from('assets')
        .insert({
          user_id:               userId,
          asset_type:            assetType,
          name:                  assetName,
          symbol:                sym,
          quantity:              qty,
          unit:                  assetUnit,
          buy_price_per_unit:    buyPpu,
          market_price_per_unit: marketPpu,
          current_value:         Math.round(effectivePpu * qty),
          buy_value:             Math.round(buyPpu * qty),
        })
        .select('id')
        .single()

      if (insertErr || !newAsset) {
        setPhase('idle')
        setError('Lỗi khi lưu: ' + (insertErr?.message ?? 'unknown'))
        return
      }

      // Create the first transaction record for history tracking
      await supabase.from('asset_transactions').insert({
        user_id:          userId,
        asset_id:         newAsset.id,
        type:             'buy',
        quantity:         qty,
        price_per_unit:   buyPpu,
        total_value:      Math.round(buyPpu * qty),
        transaction_date: buyDate,
      })
    } else {
      if (!name.trim() || !totalVND) return
      setPhase('saving')
      const result = await supabase.from('assets').insert({
        user_id:               userId,
        asset_type:            assetType,
        name:                  name.trim(),
        current_value:         totalVND,
        buy_value:             initialVND,
        quantity:              null,
        unit:                  null,
        buy_price_per_unit:    null,
        market_price_per_unit: null,
        symbol:                null,
      })

      if (result?.error) {
        setPhase('idle')
        setError('Lỗi khi lưu: ' + result.error.message)
        return
      }
    }

    setPhase('idle')
    setOpen(false)
    resetForm()
    router.refresh()
  }

  const busy = phase !== 'idle'

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-3 text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors text-sm"
      >
        <Plus size={15} strokeWidth={2} /> Thêm tài sản
      </button>
    )
  }

  return (
    <div className="border-t border-stone-200 bg-stone-50/60">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Thêm tài sản mới</p>
        <button
          type="button"
          onClick={() => { setOpen(false); resetForm() }}
          className="text-stone-400 hover:text-stone-600 text-lg leading-none px-1"
        >×</button>
      </div>
      <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3">

      {/* Asset type tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {ASSET_TYPES.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => handleTypeChange(t.value)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
              assetType === t.value
                ? 'bg-violet-600 text-white'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CRYPTO ── */}
      {assetType === 'crypto' && (
        <>
          <div className="relative">
            <select
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-700 focus:outline-none focus:border-violet-400 bg-white pr-8"
            >
              {CRYPTO_LIST.map(c => (
                <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</option>
              ))}
              <option value="__custom">Khác (nhập thủ công)</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
          {symbol === '__custom' && (
            <input type="text" placeholder="Symbol (VD: PEPE, WLD...)"
              value={customSymbol} onChange={e => setCustomSymbol(e.target.value.toUpperCase())}
              className={INPUT} required
            />
          )}
          <input type="text" placeholder="Ghi chú (tuỳ chọn, VD: ví Binance)"
            value={name} onChange={e => setName(e.target.value)}
            className={`${INPUT} text-stone-700 placeholder:text-stone-400`}
          />
          <input type="text" placeholder="Số lượng (VD: 0.05)"
            value={quantity} onChange={e => setQuantity(e.target.value)}
            className={INPUT} required
          />
          <SmartAmountInput
            key={`${resetKey}-buy`}
            placeholder="Giá mua (VD: 80tr, 3000USD)"
            onValue={setBuyPpu}
            className={INPUT}
            required
          />
          {costPreview && (
            <p className="text-xs text-stone-400 -mt-1 px-1">
              Giá vốn: {costPreview}
            </p>
          )}
        </>
      )}

      {/* ── GOLD ── */}
      {assetType === 'gold' && (
        <>
          {/* Gold type selector */}
          <div className="flex gap-1.5">
            {GOLD_TYPES.map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGoldType(g.value as 'SJC' | 'NHAN9999' | 'TIEM')}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-medium transition-colors border',
                  goldType === g.value
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input type="text" placeholder="Số lượng (lượng)"
              value={quantity} onChange={e => setQuantity(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400"
              required autoFocus
            />
            <span className="text-sm text-stone-400 shrink-0 pr-1">lượng</span>
          </div>
          <SmartAmountInput
            key={`${resetKey}-buy`}
            placeholder="Giá mua (VD: 95tr, 95000000)"
            onValue={setBuyPpu}
            className={INPUT}
            required
          />
          {costPreview && (
            <p className="text-xs text-stone-400 -mt-1 px-1">Giá vốn: {costPreview}</p>
          )}
        </>
      )}

      {/* ── STOCK ── */}
      {assetType === 'stock' && (
        <>
          <input type="text"
            placeholder="Mã CK (VD: VNM, BID, TCB, FPT...)"
            value={name} onChange={e => setName(e.target.value)}
            className={`${INPUT} text-stone-800 placeholder:text-stone-400`}
            required autoFocus
          />
          <div className="flex gap-2">
            <input type="text" placeholder="Số lượng"
              value={quantity} onChange={e => setQuantity(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400"
              required
            />
            <span className="flex items-center text-sm text-stone-400 shrink-0 pr-1">cổ phiếu</span>
          </div>
          <SmartAmountInput
            key={`${resetKey}-buy`}
            placeholder="Giá mua (VD: 75k, 75000)"
            onValue={setBuyPpu}
            className={INPUT}
            required
          />
          {costPreview && (
            <p className="text-xs text-stone-400 -mt-1 px-1">Giá vốn: {costPreview}</p>
          )}
        </>
      )}

      {/* ── SAVINGS / CASH / REAL_ESTATE / OTHER ── */}
      {!hasUnits && (
        <>
          <input type="text"
            placeholder={
              assetType === 'savings'     ? 'VD: Techcombank 6 tháng, OCB linh hoạt...' :
              assetType === 'real_estate' ? 'VD: Căn hộ Q7, Đất Bình Dương...' :
              assetType === 'cash'        ? 'VD: Tiền mặt, USD, EUR...' : 'Tên tài sản'
            }
            value={name} onChange={e => setName(e.target.value)}
            className={`${INPUT} text-stone-800 placeholder:text-stone-400`}
            required autoFocus
          />
          <SmartAmountInput
            key={`${resetKey}-total`}
            placeholder="Giá trị hiện tại (VD: 80tr, 5000USD)"
            onValue={setTotalVND}
            className={INPUT}
            required
          />
          <SmartAmountInput
            key={`${resetKey}-init`}
            placeholder="Giá trị ban đầu (tuỳ chọn, để tính lãi/lỗ)"
            onValue={setInitialVND}
            className={INPUT}
          />
        </>
      )}

      {/* Purchase date — only for quantity-based assets */}
      {hasUnits && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-400 shrink-0 w-16">Ngày mua</label>
          <input
            type="date"
            value={buyDate}
            onChange={e => setBuyDate(e.target.value)}
            className={`${INPUT} flex-1`}
          />
        </div>
      )}

      {/* Auto-fetch price note */}
      {isPriceable && hasUnits && (
        <p className="text-[11px] text-stone-400 px-1 -mt-1">
          Giá thị trường hiện tại sẽ tự động lấy khi lưu.
        </p>
      )}

      {error && <p className="text-xs text-red-500 px-1">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); resetForm() }}
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-500 hover:bg-stone-50 disabled:opacity-40"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-60 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          {phase === 'fetching-price' && <Loader2 size={14} className="animate-spin" />}
          {phase === 'fetching-price' ? 'Đang lấy giá...'
            : phase === 'saving'  ? 'Đang lưu...'
            : 'Thêm'}
        </button>
      </div>
      </form>
    </div>
  )
}
