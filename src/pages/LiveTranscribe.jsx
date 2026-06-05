import { useNavigate } from 'react-router-dom';
export default function LiveTranscribe() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'80vh', background:'#030007', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:20 }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🎙️</div>
        <p style={{ color:'white', fontWeight:700, margin:0 }}>Live Transcribe</p>
        <p style={{ color:'#4b5563', fontSize:13, margin:'8px 0 0' }}>Live transcription is integrated in the Voice Lab.</p>
        <button onClick={() => navigate('/tools/voice-lab')} style={{ marginTop:16, padding:'8px 20px', borderRadius:8, background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)', color:'#a78bfa', cursor:'pointer', fontSize:13 }}>
          Open Voice Lab
        </button>
      </div>
    </div>
  );
}