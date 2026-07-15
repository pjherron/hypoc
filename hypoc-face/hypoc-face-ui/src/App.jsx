import { useState } from 'react'
import Chat from './components/Chat.jsx'
import CostDashboard from './components/CostDashboard.jsx'
import SkillLog from './components/SkillLog.jsx'

const TABS = ['chat', 'cost', 'skills']

const styles = {
  header: {
    display: 'flex', alignItems: 'center', gap: '24px',
    padding: '10px 16px', borderBottom: '1px solid var(--border)',
    background: 'var(--surface)', flexShrink: 0,
  },
  logo: { color: 'var(--accent)', fontWeight: 700, fontSize: '15px', letterSpacing: '0.05em' },
  nav: { display: 'flex', gap: '4px' },
  tab: (active) => ({
    padding: '4px 12px', borderRadius: '4px', border: 'none',
    background: active ? 'var(--border)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--muted)',
    cursor: 'pointer', font: 'inherit', fontSize: '12px',
  }),
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
}

export default function App() {
  const [tab, setTab] = useState('chat')

  return (
    <>
      <header style={styles.header}>
        <span style={styles.logo}>hypoc</span>
        <nav style={styles.nav}>
          {TABS.map(t => (
            <button key={t} style={styles.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
          ))}
        </nav>
      </header>
      <main style={styles.content}>
        {tab === 'chat'   && <Chat />}
        {tab === 'cost'   && <CostDashboard />}
        {tab === 'skills' && <SkillLog />}
      </main>
    </>
  )
}
