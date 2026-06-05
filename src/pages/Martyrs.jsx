/**
 * Martyrs.jsx — TerrellOS redirect stub
 * This content lives on https://pastoraiconnect.com
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function Martyrs() {
  const navigate = useNavigate();
  useEffect(() => {
    // This content lives on its own dedicated platform
    window.open('https://pastoraiconnect.com', '_blank');
    navigate('/', { replace: true });
  }, [navigate]);
  return (
    <div style={{ minHeight:'80vh', background:'#030007', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:20 }}>
        <div style={{ fontSize:40, marginBottom:12 }}>✝️</div>
        <p style={{ color:'white', fontWeight:700, margin:0 }}>Martyrs</p>
        <p style={{ color:'#4b5563', fontSize:13, margin:'8px 0 0' }}>Christian heritage content lives on Pastor AI Connect.</p>
        <p style={{ color:'#374151', fontSize:12, marginTop:8 }}>Opening https://pastoraiconnect.com…</p>
      </div>
    </div>
  );
}