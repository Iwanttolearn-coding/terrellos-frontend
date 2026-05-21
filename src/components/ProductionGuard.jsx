/**
 * ProductionGuard.jsx — TM Dezigns AI Designer
 * Always renders children. No environment lock. No Vercel references.
 * Founder is never blocked by environment checks.
 */
export default function ProductionGuard({ children }) {
  // No-op wrapper — always render children.
  // Environment-based locking was removed because it blocked the founder
  // on production (app.tm-dezigns.com) and referenced a dead Vercel URL.
  return children;
}
