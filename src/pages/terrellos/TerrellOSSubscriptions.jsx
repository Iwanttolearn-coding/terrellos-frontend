import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function TerrellOSSubscriptions() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/billing', { replace: true }); }, [navigate]);
  return null;
}
