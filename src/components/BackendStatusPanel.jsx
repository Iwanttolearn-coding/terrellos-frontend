import React, { useState, useEffect } from 'react'
import { healthCheck } from '../lib/terrellOS'

export default function BackendStatusPanel() {
  const [status, setStatus] = useState('checking')
  const [data, setData] = useState(null)
  const [lastChecked, setLastChecked] = useState(null)

  const check = async () => {
    setStatus('checking')
    try {
      const d = await healthCheck()
      setData(d)
      setStatus(d.error ? 'offline' : 'online')
    } catch {
      setStatus('offline')
    }
    setLastChecked(new Date().toLocaleTimeString())
  }

  useEffect(() => { check() }, [])

  const colors = { online:'#22c55e', offline:'#ef4444', checking:'#f59e0b', waking:'#f59e0b' }
  const labels = { online:'🟢 Online', offline:'🔴 Offline', checking:'🟡 Checking...', waking:'🟡 Waking Up' }

  return (
    <div style={{background:'#111827',border:'1px solid #1f2937',borderRadius:12,padding:20,marginBottom:16}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <h3 style={{margin:0,color:'#f9fafb',fontSize:15,fontWeight:700}}>⚡ Backend Status</h3>
        <span style={{color:colors[status]||'#9ca3af',fontSize:13,fontWeight:600}}>{labels[status]||status}</span>
      </div>
      <div style={{fontSize:12,color:'#6b7280',marginBottom:8}}>
        <div>URL: <span style={{color:'#60a5fa'}}>https://terrellos-backend.fly.dev</span></div>
        {data?.version && <div>Version: <span style={{color:'#a3e635'}}>{data.version}</span></div>}
        {data?.openai_configured !== undefined && (
          <div>OpenAI: <span style={{color: data.openai_configured ? '#22c55e' : '#ef4444'}}>
            {data.openai_configured ? '✅ Ready' : '❌ Missing Key'}
          </span></div>
        )}
        {data?.voice_synthesis && (
          <div>Voice: <span style={{color: data.voice_synthesis === 'ready' ? '#22c55e' : '#f59e0b'}}>
            {data.voice_synthesis === 'ready' ? '✅ Ready' : '⚠ ' + data.voice_synthesis}
          </span></div>
        )}
        {lastChecked && <div style={{marginTop:4}}>Last checked: {lastChecked}</div>}
      </div>
      <div style={{display:'flex',gap:8,marginTop:12}}>
        <button onClick={check}
          style={{background:'#1d4ed8',color:'#fff',border:'none',borderRadius:6,
            padding:'6px 14px',fontSize:12,cursor:'pointer',fontWeight:600}}>
          🔄 Retry
        </button>
        <a href="https://terrellos-backend.fly.dev/docs" target="_blank" rel="noreferrer"
          style={{background:'#374151',color:'#d1d5db',border:'none',borderRadius:6,
            padding:'6px 14px',fontSize:12,cursor:'pointer',fontWeight:600,textDecoration:'none'}}>
          📖 API Docs
        </a>
        <a href="https://fly.io/apps/terrellos-backend" target="_blank" rel="noreferrer"
          style={{background:'#374151',color:'#d1d5db',border:'none',borderRadius:6,
            padding:'6px 14px',fontSize:12,cursor:'pointer',fontWeight:600,textDecoration:'none'}}>
          🚀 Fly.io
        </a>
      </div>
    </div>
  )
}
