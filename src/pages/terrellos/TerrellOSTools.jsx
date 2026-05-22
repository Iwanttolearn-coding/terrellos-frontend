import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function TerrellOSTools() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/tools', { replace: true }); }, [navigate]);
  return null;
}
