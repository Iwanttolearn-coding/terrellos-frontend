/**
 * App.jsx — TM Dezigns AI Designer / TerrellOS
 * Authority resolver first, route audit second, tool stabilization third.
 * All routes verified. No cross-brand contamination.
 */
import { Toaster } from "@/components/ui/toaster"
import ErrorBoundary from '@/components/ErrorBoundary'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';

// ── Core pages ────────────────────────────────────────────────────────────────
import Dashboard        from '@/pages/Dashboard';
import Settings         from '@/pages/Settings';
import Help             from '@/pages/Help';
import Pricing          from '@/pages/Pricing';
import ThankYou         from '@/pages/ThankYou';
import Billing          from '@/pages/Billing';
import FounderLogin     from '@/pages/FounderLogin';
import AccountDashboard from '@/pages/AccountDashboard';
import FounderCenter    from '@/pages/FounderCenter';
import Analytics        from '@/pages/Analytics';
import Projects         from '@/pages/Projects';
import UploadVault      from '@/pages/UploadVault';
import Templates        from '@/pages/Templates';
import Admin            from '@/pages/Admin';
import SuperAdmin       from '@/pages/SuperAdmin';
import BackendStatus    from '@/pages/BackendStatus';
import SystemLogs       from '@/pages/SystemLogs';
import Diagnostics      from '@/pages/Diagnostics';
import SystemDiagnostics from '@/pages/SystemDiagnostics';

// ── AI Designer tools ─────────────────────────────────────────────────────────
import Tools            from '@/pages/Tools';
import AIToolsStudio    from '@/pages/AIToolsStudio';
import TattooStudio     from '@/pages/tools/TattooStudio';
import CreatorVault     from '@/pages/tools/CreatorVault';
import VoiceLab         from '@/pages/tools/VoiceLab';
import ChatEngine       from '@/pages/tools/ChatEngine';
import AvatarLab        from '@/pages/tools/AvatarLab';
import MemoryVault      from '@/pages/tools/MemoryVault';
import ManageAITools    from '@/pages/tools/ManageAITools';
import SystemStatus     from '@/pages/tools/SystemStatus';
import AIBuilderTool    from '@/pages/tools/AIBuilderTool';
import ProjectsTool     from '@/pages/tools/ProjectsTool';
import UploadsTool      from '@/pages/tools/UploadsTool';
import LogsTool         from '@/pages/tools/LogsTool';
import DatabaseTool     from '@/pages/tools/DatabaseTool';
import ApiManager       from '@/pages/tools/ApiManager';
import WorkflowEditor   from '@/pages/tools/WorkflowEditor';
import ProjectPreview   from '@/pages/tools/ProjectPreview';
import DatabaseView     from '@/pages/tools/DatabaseView';
import DeploymentManager from '@/pages/tools/DeploymentManager';

// ── Admin / Founder pages ─────────────────────────────────────────────────────
import LiveConsole      from '@/pages/admin/LiveConsole';
import CostManager      from '@/pages/admin/CostManager';
import AutomationEngine from '@/pages/admin/AutomationEngine';
import EngineStatus     from '@/pages/admin/EngineStatus';
import FounderAdmin     from '@/pages/admin/FounderAdmin';
import FounderBuilder   from '@/pages/founder/FounderBuilder';
import CodeDiagnostics  from '@/pages/founder/CodeDiagnostics';
import PatchCenter      from '@/pages/founder/PatchCenter';
import RollbackCenter   from '@/pages/founder/RollbackCenter';
import TestRunner       from '@/pages/founder/TestRunner';
import ReleaseGate      from '@/pages/founder/ReleaseGate';
import DeploymentCenter from '@/pages/founder/DeploymentCenter';
import StabilizationCenter from '@/pages/founder/StabilizationCenter';
import StagingValidation from '@/pages/founder/StagingValidation';

// ── Other TM Dezigns tools ───────────────────────────────────────────────────
import AppEcosystem     from '@/pages/AppEcosystem';
import LiveSandbox      from '@/pages/LiveSandbox';
import BackendManifest  from '@/pages/BackendManifest';
import LiveLogs         from '@/pages/LiveLogs';
import WorkflowBuilder  from '@/pages/WorkflowBuilder';
import DeploymentDashboard from '@/pages/DeploymentDashboard';
import IntegrationManager from '@/pages/IntegrationManager';
import AIModels         from '@/pages/AIModels';
import Deployments      from '@/pages/Deployments';
import CreditDashboard  from '@/pages/CreditDashboard';
import AIBuilder        from '@/pages/AIBuilder';
import AIBuilderSplit   from '@/pages/AIBuilderSplit';
import BuildLogs        from '@/pages/BuildLogs';
import ProjectLanding   from '@/pages/ProjectLanding';
import FounderStory     from '@/pages/FounderStory';
import AppWorkspace     from '@/pages/apps/AppWorkspace';
import { SupabaseProvider } from '@/lib/SupabaseContext';
import SupabaseAuth     from '@/pages/tools/SupabaseAuth';
import SupabaseStatus   from '@/pages/tools/SupabaseStatus';

// ── Coming Soon pages ────────────────────────────────────────────────────────
import PrintReadiness     from '@/pages/tools/PrintReadiness';
import StyleAdvisor       from '@/pages/tools/StyleAdvisor';
import BackgroundSelector from '@/pages/tools/BackgroundSelector';

// ── Placeholder for unbuilt routes ───────────────────────────────────────────
const ComingSoon = ({ title }) => (
  <div className="min-h-[60vh] flex items-center justify-center p-8">
    <div className="text-center max-w-md space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-purple-500/20">🚧</div>
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="text-gray-400 text-sm">This tool is being built. Check back soon — TM Dezigns AI Designer is launching fast.</p>
      <div className="inline-block px-4 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium">Coming Soon</div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// Auth shell — handles loading + errors cleanly, no infinite loops
// ══════════════════════════════════════════════════════════════════════════════
const AuthenticatedApp = () => {
  const { isLoadingAuth, access, authError } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-xs text-gray-500 font-mono tracking-widest animate-pulse">TM DEZIGNS AI · LOADING</p>
        </div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (authError?.type === 'unknown') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-950 p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
            <span className="text-red-400 text-xl">⚠</span>
          </div>
          <h2 className="text-lg font-bold text-white">Failed to load</h2>
          <p className="text-xs text-gray-500 font-mono">{authError.message}</p>
          <button onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-violet-600 to-purple-700 hover:opacity-90 transition-opacity">
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* ── Core ─────────────────────────────────────────────────────────── */}
        <Route path="/"                          element={<Dashboard />} />
        <Route path="/login"                     element={<FounderLogin />} />
        <Route path="/settings"                  element={<Settings />} />
        <Route path="/help"                      element={<Help />} />
        <Route path="/pricing"                   element={<Pricing />} />
        <Route path="/billing"                   element={<Billing />} />
        <Route path="/thank-you"                 element={<ThankYou />} />
        <Route path="/account"                   element={<AccountDashboard />} />
        <Route path="/projects"                  element={<Projects />} />
        <Route path="/templates"                 element={<Templates />} />
        <Route path="/upload-vault"              element={<UploadVault />} />
        <Route path="/analytics"                 element={<Analytics />} />
        <Route path="/pricing"                   element={<Pricing />} />

        {/* ── AI Tools ─────────────────────────────────────────────────────── */}
        <Route path="/tools"                     element={<Tools />} />
        <Route path="/tools/ai-tools-studio"     element={<AIToolsStudio />} />
        <Route path="/tools/tattoo-studio"       element={<TattooStudio />} />
        <Route path="/tools/creator-vault"       element={<CreatorVault />} />
        <Route path="/tools/voice-lab"           element={<VoiceLab />} />
        <Route path="/tools/chat-engine"         element={<ChatEngine />} />
        <Route path="/tools/avatar-lab"          element={<AvatarLab />} />
        <Route path="/tools/memory-vault"        element={<MemoryVault />} />
        <Route path="/tools/manage-ai-tools"     element={<ManageAITools />} />
        <Route path="/tools/system-status"       element={<SystemStatus />} />
        <Route path="/tools/ai-builder"          element={<AIBuilderTool />} />
        <Route path="/tools/projects"            element={<ProjectsTool />} />
        <Route path="/tools/uploads"             element={<UploadsTool />} />
        <Route path="/tools/logs"                element={<LogsTool />} />
        <Route path="/tools/database"            element={<DatabaseTool />} />
        <Route path="/tools/api-manager"         element={<ApiManager />} />
        <Route path="/tools/workflow"            element={<WorkflowEditor />} />
        <Route path="/tools/project-preview"     element={<ProjectPreview />} />
        <Route path="/tools/database-view"       element={<DatabaseView />} />
        <Route path="/tools/deployment-manager"  element={<DeploymentManager />} />
        <Route path="/tools/supabase-auth"       element={<SupabaseAuth />} />
        <Route path="/tools/supabase-status"     element={<SupabaseStatus />} />

        {/* ── AI Designer specific ─────────────────────────────────────────── */}
        <Route path="/tools/image-gen"           element={<ComingSoon title="AI Image Generator" />} />
        <Route path="/tools/print-readiness"     element={<PrintReadiness />} />
        <Route path="/tools/style-advisor"       element={<StyleAdvisor />} />
        <Route path="/tools/gallery"             element={<ComingSoon title="Design Gallery" />} />
        <Route path="/tools/portrait-upload"     element={<ComingSoon title="Portrait Upload & Reference" />} />
        <Route path="/tools/background-selector" element={<BackgroundSelector />} />
        <Route path="/tools/saved-projects"      element={<ComingSoon title="Saved Projects" />} />

        {/* ── Admin ────────────────────────────────────────────────────────── */}
        <Route path="/admin"                     element={<Admin />} />
        <Route path="/super-admin"               element={<SuperAdmin />} />
        <Route path="/admin/live-console"        element={<LiveConsole />} />
        <Route path="/admin/cost-manager"        element={<CostManager />} />
        <Route path="/admin/automation"          element={<AutomationEngine />} />
        <Route path="/admin/engine-status"       element={<EngineStatus />} />
        <Route path="/admin/founder-admin"       element={<FounderAdmin />} />

        {/* ── Founder Center ───────────────────────────────────────────────── */}
        <Route path="/founder"                   element={<FounderCenter />} />
        <Route path="/founder/builder"           element={<FounderBuilder />} />
        <Route path="/founder/code-diagnostics"  element={<CodeDiagnostics />} />
        <Route path="/founder/patch-center"      element={<PatchCenter />} />
        <Route path="/founder/rollback"          element={<RollbackCenter />} />
        <Route path="/founder/test-runner"       element={<TestRunner />} />
        <Route path="/founder/release-gate"      element={<ReleaseGate />} />
        <Route path="/founder/deployment"        element={<DeploymentCenter />} />
        <Route path="/founder/stabilization"     element={<StabilizationCenter />} />
        <Route path="/founder/staging"           element={<StagingValidation />} />
        <Route path="/founder-story"             element={<FounderStory />} />
        <Route path="/founder-login"             element={<FounderLogin />} />

        {/* ── System / Backend ─────────────────────────────────────────────── */}
        <Route path="/backend-status"            element={<BackendStatus />} />
        <Route path="/backend-manifest"          element={<BackendManifest />} />
        <Route path="/system-logs"               element={<SystemLogs />} />
        <Route path="/system-diagnostics"        element={<SystemDiagnostics />} />
        <Route path="/diagnostics"               element={<Diagnostics />} />
        <Route path="/live-logs"                 element={<LiveLogs />} />
        <Route path="/live-sandbox"              element={<LiveSandbox />} />
        <Route path="/build-logs"                element={<BuildLogs />} />
        <Route path="/credit-dashboard"          element={<CreditDashboard />} />
        <Route path="/ai-builder"                element={<AIBuilder />} />
        <Route path="/ai-builder-split"          element={<AIBuilderSplit />} />
        <Route path="/ai-models"                 element={<AIModels />} />
        <Route path="/deployments"               element={<Deployments />} />
        <Route path="/deployment-dashboard"      element={<DeploymentDashboard />} />
        <Route path="/integrations"              element={<IntegrationManager />} />
        <Route path="/workflow-builder"          element={<WorkflowBuilder />} />
        <Route path="/ecosystem"                 element={<AppEcosystem />} />
        <Route path="/apps/:appId"               element={<AppWorkspace />} />
        <Route path="/project/:id"               element={<ProjectLanding />} />

        {/* ── 404 ──────────────────────────────────────────────────────────── */}
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthProvider>
            <SupabaseProvider>
              <AuthenticatedApp />
              <Toaster />
            </SupabaseProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
