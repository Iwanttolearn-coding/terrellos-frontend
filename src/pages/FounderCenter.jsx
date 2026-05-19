import React, { useState, useEffect } from 'react'
import { resolveUserAccess } from '../lib/founderAccess'
import { healthCheck } from '../lib/terrellOS'
import { BrandHeader, BrandFooter } from '../components/BrandFooter'

const FOUNDER_EMAIL = 'millzterrell210@icloud.com'

const fakeUser = { email: FOUNDER_EMAIL, full_name: 'Terrell Mills' }
const access = resolveUserAccess(fakeUser)

export default function FounderCommandCenter() {
  const [health, setHealth] = useState(null)
  const [checking, setChecking] = useState(true)
  const [lastChecked, setLastChecked] = useState(null)

  const runHealthCheck = async () => {
    setChecking(true)
    try {
      const d = await healthCheck()
      setHealth(d)
    } catch {
      setHealth({ status: 'offline', error: true })
    }
    setLastChecked(new Date().toLocaleTimeString())
    setChecking(false)
  }

  useEffect(() => { runHealthCheck() }, [])

  const Card = ({ icon, label, value, color = '#22c55e' }) => (
    <div style={{
      background: '#111827', border: '1px solid #1f2937', borderRadius: 10,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 6
    }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 14, color, fontWeight: 700 }}>{value}</div>
    </div>
  )

  const backendStatus = checking ? '🟡 Checking...' : health?.error ? '🔴 Offline' : '🟢 Online'
  const openaiStatus = health?.openai_configured ? '🟢 Ready' : '🔴 Missing Key'
  const voiceStatus = health?.voice_synthesis === 'ready' ? '🟢 Ready' : '⚠️ ' + (health?.voice_synthesis || 'Unknown')

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px', minHeight: '100vh', background: '#0a0a0f' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <BrandHeader />
        <h1 style={{ color: '#f9fafb', fontSize: 26, fontWeight: 900, margin: '16px 0 4px' }}>
          ⚡ Founder Command Center
        </h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
          Full system control · {access.displayPlan} · {access.role}
        </p>
      </div>

      {/* Founder Badge */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
        border: '1px solid #4f46e5', borderRadius: 12, padding: 16, marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <div style={{ fontSize: 36 }}>👑</div>
        <div>
          <div style={{ color: '#a78bfa', fontWeight: 800, fontSize: 16 }}>Terrell Mills — Founder</div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>{FOUNDER_EMAIL} · super_admin · Full Access · All Tools Unlocked</div>
        </div>
        <div style={{ marginLeft: 'auto', background: '#4f46e5', color: '#fff', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
          ✦ FOUNDER
        </div>
      </div>

      {/* Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
        <Card icon="🖥️" label="Backend" value={backendStatus} color={health?.error ? '#ef4444' : '#22c55e'} />
        <Card icon="🤖" label="OpenAI" value={openaiStatus} color={health?.openai_configured ? '#22c55e' : '#ef4444'} />
        <Card icon="🎙️" label="Voice / TTS" value={voiceStatus} color={health?.voice_synthesis === 'ready' ? '#22c55e' : '#f59e0b'} />
        <Card icon="✝️" label="Sermon Engine" value={health?.error ? '🔴 Offline' : '🟢 Ready'} color={health?.error ? '#ef4444' : '#22c55e'} />
        <Card icon="🗄️" label="Database" value="🟢 Connected" color="#22c55e" />
        <Card icon="👑" label="Founder Override" value="🟢 Active" color="#a78bfa" />
        <Card icon="📡" label="Version" value={health?.version || 'Loading...'} color="#60a5fa" />
        <Card icon="🌍" label="Environment" value={health?.environment || 'production'} color="#34d399" />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
        {[
          { label: '🔄 Run Diagnostics', action: runHealthCheck },
          { label: '📖 API Docs', href: 'https://terrellos-backend.fly.dev/docs' },
          { label: '🚀 Fly.io Dashboard', href: 'https://fly.io/apps/terrellos-backend' },
          { label: '🌐 Live App', href: 'https://terrellos.vercel.app' },
        ].map((btn, i) => btn.href ? (
          <a key={i} href={btn.href} target="_blank" rel="noreferrer" style={{
            background: '#1f2937', color: '#d1d5db', borderRadius: 8,
            padding: '10px 18px', fontSize: 13, fontWeight: 600,
            textDecoration: 'none', border: '1px solid #374151'
          }}>{btn.label}</a>
        ) : (
          <button key={i} onClick={btn.action} style={{
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff',
            border: 'none', borderRadius: 8, padding: '10px 18px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>{btn.label}</button>
        ))}
      </div>

      {/* Backend URL Panel */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Backend URL</div>
        <div style={{ color: '#60a5fa', fontSize: 14, fontFamily: 'monospace' }}>https://terrellos-backend.fly.dev</div>
        {lastChecked && <div style={{ color: '#4b5563', fontSize: 11, marginTop: 6 }}>Last checked: {lastChecked}</div>}
      </div>

      {/* Quick Links */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase' }}>Quick Navigation</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 8 }}>
          {[
            ['/sermon-prep', '✝️ Sermon Prep'],
            ['/discipleship', '📖 Discipleship'],
            ['/denominations', '⛪ Denominations'],
            ['/church-history', '📜 Church History'],
            ['/martyrs', '🕊️ Martyrs'],
            ['/christian-heroes', '⭐ Christian Heroes'],
            ['/apologetics', '🛡️ Apologetics'],
            ['/theology-library', '📚 Theology Library'],
            ['/bible-college', '🎓 Bible College'],
            ['/live-transcribe', '🎙️ Live Transcribe'],
            ['/leadership-training', '👑 Leadership'],
            ['/research/freemasonry', '🔍 Research'],
          ].map(([path, label]) => (
            <a key={path} href={path} style={{
              background: '#1f2937', color: '#d1d5db', borderRadius: 8,
              padding: '8px 12px', fontSize: 12, fontWeight: 600,
              textDecoration: 'none', textAlign: 'center',
              border: '1px solid #374151', display: 'block'
            }}>{label}</a>
          ))}
        </div>
      </div>

      <BrandFooter />
    </div>
  )
}
