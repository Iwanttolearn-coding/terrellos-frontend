import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function TerrellOSSystemStatus() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/backend-status', { replace: true }); }, [navigate]);
  return null;
}
