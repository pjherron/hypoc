import { useState, useRef, useEffect } from 'react'

const TIER_COLOR = { 1: 'var(--tier1)', 2: 'var(--tier2)', 3: 'var(--tier3)', 4: 'var(--tier4)' }
const TIER_NAME = { 1: 'local', 2: 'self-hosted', 3: 'copilot', 4: 'premium' }
const COMPLEXITY = ['low', 'medium', 'high', 'max']

const s = {
  root: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
  messages: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  msg: (role) => ({
    maxWidth: '80%', padding: '10px 14px', borderRadius: '6px',
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    background: role === 'user' ? 'var(--accent)' : 'var(--surface)',
    border: role === 'user' ? 'none' : '1px solid var(--border)',
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  }),
  meta: { fontSize: '10px', color: 'var(--muted)', marginTop: '4px' },
  footer: {
    padding: '12px 16px', borderTop: '1px solid var(--border)',
    background: 'var(--surface)', display: 'flex', gap: '8px', alignItems: 'flex-end',
  },
  select: {
    background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)',
    borderRadius: '4px', padding: '6px 8px', font: 'inherit', fontSize: '12px',
  },
  textarea: {
    flex: 1, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)',
    borderRadius: '4px', padding: '8px', font: 'inherit', fontSize: '13px',
    resize: 'none', minHeight: '38px', maxHeight: '120px',
  },
  send: {
    background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px',
    padding: '8px 16px', cursor: 'pointer', font: 'inherit', fontSize: '13px', alignSelf: 'flex-end',
  },
  empty: { color: 'var(--muted)', textAlign: 'center', marginTop: '40px', fontSize: '12px' },
}

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [complexity, setComplexity] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => `ses_${Date.now()}`)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    const prompt = input.trim()
    if (!prompt || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content: prompt }])
    setLoading(true)
    try {
      const res = await fetch('/api/router/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, session_id: sessionId, complexity }),
      })
      const data = await res.json()
      setMessages(m => [...m, {
        role: 'assistant', content: data.content,
        tier: data.tier, tier_name: data.tier_name, model: data.model,
      }])
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: `Error: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={s.root}>
      <div style={s.messages}>
        {messages.length === 0 && <div style={s.empty}>describe what you want to do</div>}
        {messages.map((m, i) => (
          <div key={i}>
            <div style={s.msg(m.role)}>{m.content}</div>
            {m.tier && (
              <div style={{ ...s.meta, alignSelf: 'flex-start' }}>
                <span style={{ color: TIER_COLOR[m.tier] }}>● {TIER_NAME[m.tier]}</span>
                {' · '}{m.model}
              </div>
            )}
          </div>
        ))}
        {loading && <div style={s.msg('assistant')}>…</div>}
        <div ref={bottomRef} />
      </div>
      <div style={s.footer}>
        <select style={s.select} value={complexity} onChange={e => setComplexity(e.target.value)}>
          {COMPLEXITY.map(c => <option key={c}>{c}</option>)}
        </select>
        <textarea
          style={s.textarea} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={onKey} placeholder="message (enter to send, shift+enter for newline)"
          rows={1}
        />
        <button style={s.send} onClick={send} disabled={loading}>send</button>
      </div>
    </div>
  )
}
