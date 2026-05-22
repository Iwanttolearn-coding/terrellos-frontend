import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function TerrellOSFounder() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/founder', { replace: true }); }, [navigate]);
  return null;
}
