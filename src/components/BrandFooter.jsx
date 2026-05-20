/**
 * BrandFooter.jsx
 * "TerrellOS — Powered by TM Dezigns"
 * Drop this into Layout, Dashboard, FounderCenter, etc.
 */
import React from 'react'

export function BrandHeader({ minimal = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: minimal ? '0' : '0 0 4px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
        borderRadius: 8, padding: '6px 10px',
        fontWeight: 900, fontSize: minimal ? 13 : 15,
        color: '#fff', letterSpacing: '0.02em', whiteSpace: 'nowrap'
      }}>
        ✝️ TerrellOS
      </div>
      {!minimal && (
        <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
          <div style={{ color: '#9ca3af', fontWeight: 600 }}>Powered by</div>
          <div style={{ color: '#a78bfa', fontWeight: 800, letterSpacing: '0.05em' }}>TM DEZIGNS</div>
        </div>
      )}
    </div>
  )
}

export function BrandFooter() {
  return (
    <footer style={{
      borderTop: '1px solid #1f2937',
      padding: '20px 24px',
      textAlign: 'center',
      marginTop: 40
    }}>
      <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 2 }}>
        <span style={{ color: '#7c3aed', fontWeight: 800 }}>TerrellOS</span>
        {' '}·{' '}
        <span style={{ color: '#6b7280' }}>Powered by</span>
        {' '}
        <span style={{ color: '#a78bfa', fontWeight: 800 }}>TM DEZIGNS</span>
      </div>
      <div style={{ fontSize: 11, color: '#374151', marginTop: 4 }}>
        AI Seminary · Bible College · Sermon Factory · Discipleship Academy
      </div>
    </footer>
  )
}

export default BrandFooter
