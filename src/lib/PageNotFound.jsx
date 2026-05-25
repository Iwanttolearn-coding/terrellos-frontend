import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PageNotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh',
      background: '#020617',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      textAlign: 'center',
      padding: 20,
    }}>
      <div>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚡</div>
        <h1 style={{ color: '#f8fafc', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          404
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 16, marginBottom: 32 }}>
          Page not found
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 28px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back to TerrellOS
        </button>
      </div>
    </div>
  );
}
