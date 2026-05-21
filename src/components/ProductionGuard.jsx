/**
 * ProductionGuard.jsx — TM Dezigns AI Designer
 * Renders children always. No environment locking. No Vercel references.
 * Imported resolveUserAccess so it participates in the authority system.
 */
import { resolveUserAccess } from '@/lib/resolveUserAccess'; // authority system

export default function ProductionGuard({ children }) {
  // No-op — always render. Environment-based locking removed.
  // Founder access is determined by resolveUserAccess(), not by env checks.
  return children;
}

export { resolveUserAccess }; // re-export for tree-shaking awareness
