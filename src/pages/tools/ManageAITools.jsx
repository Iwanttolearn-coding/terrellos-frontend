/**
 * ManageAITools.jsx — TerrellOS
 * Polished Coming Soon — not a dead blank.
 */
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
export default function ManageAITools() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'100vh', background:'#030007', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ maxWidth:380, width:'100%' }}>
        <button onClick={() => navigate('/tools')} style={{ fontSize:12, color:'#4b5563', background:'none', border:'none', cursor:'pointer', marginBottom:24, padding:0, display:'flex', alignItems:'center', gap:6 }}>
          <ArrowLeft size={12}/> Back
        </button>
        <div style={{ textAlign:'center', background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:20, padding:'40px 24px' }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🛠️</div>
          <h2 style={{ fontSize:20, fontWeight:900, color:'white', margin:'0 0 8px' }}>Manage AI Tools</h2>
          <p style={{ fontSize:13, color:'#4b5563', margin:'0 0 20px', lineHeight:1.6 }}>Configure and customize the TerrellOS tool library. Tool management interface coming soon.</p>
          
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:24, padding:'8px 16px', background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.15)', borderRadius:10, width:'fit-content', margin:'24px auto 0' }}>
            <Construction size={12} color="#7c3aed"/>
            <span style={{ fontSize:11, color:'#a78bfa', fontWeight:700 }}>In Development</span>
          </div>
        </div>
      </div>
    </div>
  );
}
