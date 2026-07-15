import { useState, useEffect } from 'react'

const TIER_COLOR = { 1: 'var(--tier1)', 2: 'var(--tier2)', 3: 'var(--tier3)', 4: 'var(--tier4)' }
const TIER_NAME = { 1: 'local', 2: 'self-hosted', 3: 'copilot', 4: 'premium' }

const s = {
  root: { padding: '20px', overflowY: 'auto', height: '100%' },
  heading: { color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' },
  card: (tier) => ({
    background: 'var(--surface)', border: `1px solid ${TIER_COLOR[tier]}33`,
    borderRadius: '6px', padding: '14px 16px',
  }),
  tierLabel: (tier) => ({ color: TIER_COLOR[tier], fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }),
  cost: { fontSize: '22px', fontWeight: 700, marginTop: '6px' },
  calls: { fontSize: '11px', color: 'var(--muted)', marginTop: '2px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  th: { textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 400 },
  td: { padding: '7px 10px', borderBottom: '1px solid var(--border)20' },
  empty: { color: 'var(--muted)', textAlign: 'center', padding: '40px', fontSize: '12px' },
  refresh: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
    borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', font: 'inherit', fontSize: '11px',
    float: 'right',
  },
}

function fmt(n) { return n == null ? '—' : `$${Number(n).toFixed(4)}` }

export default function CostDashboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/router/usage/session/all')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRows(data.rows || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const byTier = [1, 2, 3, 4].map(tier => ({
    tier,
    cost: rows.filter(r => r.tier === tier).reduce((a, r) => a + (r.cost_usd || 0), 0),
    calls: rows.filter(r => r.tier === tier).length,
  }))

  return (
    <div style={s.root}>
      <div style={s.heading}>
        model usage
        <button style={s.refresh} onClick={load}>↻ refresh</button>
      </div>

      <div style={s.cards}>
        {byTier.map(({ tier, cost, calls }) => (
          <div key={tier} style={s.card(tier)}>
            <div style={s.tierLabel(tier)}>tier {tier} · {TIER_NAME[tier]}</div>
            <div style={s.cost}>{fmt(cost)}</div>
            <div style={s.calls}>{calls} call{calls !== 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>

      {loading && <div style={s.empty}>loading…</div>}
      {error && <div style={{ ...s.empty, color: 'var(--tier4)' }}>backend offline: {error}</div>}
      {!loading && !error && rows.length === 0 && <div style={s.empty}>no usage recorded yet</div>}
      {!loading && !error && rows.length > 0 && (
        <table style={s.table}>
          <thead>
            <tr>
              {['time', 'session', 'tier', 'model', 'in', 'out', 'cost'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice().reverse().map((r, i) => (
              <tr key={i}>
                <td style={s.td}>{r.requested_at ? new Date(r.requested_at).toLocaleTimeString() : '—'}</td>
                <td style={{ ...s.td, color: 'var(--muted)' }}>{r.session_id?.slice(0, 12)}…</td>
                <td style={{ ...s.td, color: TIER_COLOR[r.tier] }}>{r.tier} · {TIER_NAME[r.tier]}</td>
                <td style={s.td}>{r.model}</td>
                <td style={{ ...s.td, color: 'var(--muted)' }}>{r.tokens_in ?? '—'}</td>
                <td style={{ ...s.td, color: 'var(--muted)' }}>{r.tokens_out ?? '—'}</td>
                <td style={s.td}>{fmt(r.cost_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
