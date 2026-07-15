import { useState } from 'react'

const MOCK = [
  { ts: Date.now() - 120000, skill: 'bootstrap', action: 'session-recruitment + skill-recruitment', decision: 'accepted' },
  { ts: Date.now() - 90000,  skill: 'git-workflow', action: 'stage and commit staged changes', decision: 'accepted' },
  { ts: Date.now() - 60000,  skill: 'sas-migration', action: 'inventory DATA step in program_01.sas', decision: 'accepted' },
  { ts: Date.now() - 30000,  skill: 'cost-aware-llm-pipeline', action: 'route request to tier 1 (low complexity)', decision: 'accepted' },
]

const DECISION_COLOR = { accepted: 'var(--tier1)', revised: 'var(--tier3)', declined: 'var(--tier4)' }

const s = {
  root: { padding: '20px', overflowY: 'auto', height: '100%' },
  heading: { color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' },
  note: { fontSize: '11px', color: 'var(--muted)', marginBottom: '16px', padding: '8px 12px', background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  th: { textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 400 },
  td: { padding: '7px 10px', borderBottom: '1px solid var(--border)20' },
}

function reltime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export default function SkillLog() {
  const [rows] = useState(MOCK)

  return (
    <div style={s.root}>
      <div style={s.heading}>skill invocations</div>
      <div style={s.note}>
        Live skill data requires PostgreSQL to be running with the shadow_profile schema loaded.
        Showing sample data for layout preview.
      </div>
      <table style={s.table}>
        <thead>
          <tr>
            {['time', 'skill', 'action', 'decision'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ ...s.td, color: 'var(--muted)' }}>{reltime(r.ts)}</td>
              <td style={{ ...s.td, color: 'var(--accent)' }}>{r.skill}</td>
              <td style={s.td}>{r.action}</td>
              <td style={{ ...s.td, color: DECISION_COLOR[r.decision] }}>{r.decision}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
