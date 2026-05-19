import React, { useState } from 'react'
import { generateSermon } from '../lib/terrellOS'

const LOADING_STAGES = [
  'Analyzing scripture…',
  'Researching historical context…',
  'Building sermon structure…',
  'Writing key points…',
  'Creating discipleship application…',
  'Finalizing prayer…',
]

export default function SermonPrep() {
  const [form, setForm] = useState({ scripture:'', topic:'', sermonType:'expository', denomination:'' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState(0)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!form.scripture && !form.topic) { setError('Enter a scripture or topic'); return }
    setLoading(true); setError(null); setResult(null); setStage(0)
    const interval = setInterval(() => setStage(s => s < LOADING_STAGES.length - 1 ? s + 1 : s), 4000)
    try {
      const data = await generateSermon(form)
      setResult(data)
    } catch(e) {
      setError(e.message || 'Generation failed — backend may be waking up. Try again.')
    } finally {
      clearInterval(interval); setLoading(false)
    }
  }

  const Section = ({ title, content }) => {
    if (!content || (Array.isArray(content) && !content.length)) return null
    return (
      <div style={{background:'#111827',border:'1px solid #1f2937',borderRadius:10,padding:16,marginBottom:12}}>
        <h4 style={{color:'#a78bfa',margin:'0 0 8px',fontSize:14,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>{title}</h4>
        {Array.isArray(content)
          ? content.map((item,i) => (
              <div key={i} style={{marginBottom:10}}>
                {typeof item === 'object'
                  ? <div>
                      {item.title && <div style={{color:'#f9fafb',fontWeight:600,marginBottom:4}}>• {item.title}</div>}
                      {item.content && <div style={{color:'#9ca3af',fontSize:13,lineHeight:1.6,marginLeft:12}}>{item.content}</div>}
                      {item.scripture && <div style={{color:'#60a5fa',fontSize:12,marginLeft:12,marginTop:4}}>📖 {item.scripture}</div>}
                    </div>
                  : <div style={{color:'#9ca3af',fontSize:13,lineHeight:1.6}}>• {item}</div>}
              </div>
            ))
          : <p style={{color:'#9ca3af',fontSize:13,lineHeight:1.7,margin:0}}>{content}</p>}
      </div>
    )
  }

  return (
    <div style={{maxWidth:860,margin:'0 auto',padding:'24px 16px'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{color:'#f9fafb',fontSize:28,fontWeight:800,margin:'0 0 6px'}}>✝️ Sermon Preparation</h1>
        <p style={{color:'#6b7280',margin:0}}>AI-powered sermon engine — deep, structured, biblically grounded</p>
      </div>

      {/* Form */}
      <div style={{background:'#111827',border:'1px solid #1f2937',borderRadius:12,padding:20,marginBottom:20}}>
        <div style={{display:'grid',gap:14}}>
          <div>
            <label style={{color:'#9ca3af',fontSize:12,fontWeight:600,display:'block',marginBottom:6}}>SCRIPTURE / PASSAGE</label>
            <input value={form.scripture} onChange={e=>setForm({...form,scripture:e.target.value})}
              placeholder="e.g. John 3:16, Romans 8:28-39"
              style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,
                padding:'10px 14px',color:'#f9fafb',fontSize:14,outline:'none'}} />
          </div>
          <div>
            <label style={{color:'#9ca3af',fontSize:12,fontWeight:600,display:'block',marginBottom:6}}>SERMON TOPIC (optional)</label>
            <input value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})}
              placeholder="e.g. The Power of Redemption"
              style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,
                padding:'10px 14px',color:'#f9fafb',fontSize:14,outline:'none'}} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={{color:'#9ca3af',fontSize:12,fontWeight:600,display:'block',marginBottom:6}}>SERMON TYPE</label>
              <select value={form.sermonType} onChange={e=>setForm({...form,sermonType:e.target.value})}
                style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,
                  padding:'10px 14px',color:'#f9fafb',fontSize:14,outline:'none'}}>
                <option value="expository">Expository</option>
                <option value="topical">Topical</option>
                <option value="narrative">Narrative</option>
                <option value="evangelistic">Evangelistic</option>
                <option value="devotional">Devotional</option>
              </select>
            </div>
            <div>
              <label style={{color:'#9ca3af',fontSize:12,fontWeight:600,display:'block',marginBottom:6}}>DENOMINATION</label>
              <input value={form.denomination} onChange={e=>setForm({...form,denomination:e.target.value})}
                placeholder="e.g. Baptist, Pentecostal"
                style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,
                  padding:'10px 14px',color:'#f9fafb',fontSize:14,outline:'none'}} />
            </div>
          </div>
          <button onClick={handleGenerate} disabled={loading}
            style={{background: loading?'#374151':'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color:'#fff',border:'none',borderRadius:10,padding:'14px 24px',
              fontSize:16,fontWeight:700,cursor: loading?'not-allowed':'pointer',width:'100%'}}>
            {loading ? '⏳ Generating...' : '✨ Generate Sermon'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{background:'#111827',border:'1px solid #4f46e5',borderRadius:10,padding:20,marginBottom:16,textAlign:'center'}}>
          <div style={{fontSize:32,marginBottom:8}}>✝️</div>
          <div style={{color:'#a78bfa',fontSize:15,fontWeight:600}}>{LOADING_STAGES[stage]}</div>
          <div style={{color:'#6b7280',fontSize:12,marginTop:6}}>This may take 20–40 seconds for deep content</div>
        </div>
      )}

      {error && (
        <div style={{background:'#1f0a0a',border:'1px solid #ef4444',borderRadius:10,padding:16,marginBottom:16,color:'#fca5a5'}}>
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          <div style={{background:'linear-gradient(135deg,#1e1b4b,#0f172a)',border:'1px solid #4f46e5',borderRadius:12,padding:20,marginBottom:16}}>
            <h2 style={{color:'#f9fafb',fontSize:22,fontWeight:800,margin:'0 0 4px'}}>{result.title || 'Sermon'}</h2>
            {result.subtitle && <p style={{color:'#a78bfa',margin:'0 0 8px',fontSize:15}}>{result.subtitle}</p>}
            {result.scripture && <p style={{color:'#60a5fa',margin:0,fontSize:14}}>📖 {result.scripture}</p>}
          </div>
          <Section title="Introduction" content={result.introduction} />
          <Section title="Historical Context" content={result.historicalContext} />
          <Section title="Key Points" content={result.keyPoints} />
          <Section title="Verse by Verse" content={result.verseByVerse} />
          <Section title="Practical Applications" content={result.applications} />
          <Section title="Apologetics" content={result.apologetics} />
          <Section title="Discipleship Challenge" content={result.discipleshipChallenge} />
          <Section title="Reflection Questions" content={result.reflectionQuestions} />
          <Section title="Small Group Questions" content={result.smallGroupQuestions} />
          <Section title="Denominational Perspectives" content={result.denominationalPerspectives} />
          <Section title="Church History Connections" content={result.churchHistoryConnections} />
          <Section title="Youth Summary" content={result.youthSummary} />
          <Section title="Children Summary" content={result.childrenSummary} />
          <Section title="Altar Call" content={result.altarCall} />
          <Section title="Closing Prayer" content={result.closingPrayer} />
        </div>
      )}
    </div>
  )
}
