import { Toaster } from "@/components/ui/toaster"
import ErrorBoundary from '@/components/ErrorBoundary'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import AIBuilder from '@/pages/AIBuilder';
import AIBuilderSplit from '@/pages/AIBuilderSplit';
import Templates from '@/pages/Templates';
import UploadVault from '@/pages/UploadVault';
import BuildLogs from '@/pages/BuildLogs';
import Settings from '@/pages/Settings';
import SuperAdmin from '@/pages/SuperAdmin';
import Diagnostics from '@/pages/Diagnostics';
import Tools from '@/pages/Tools';
import SystemStatus from '@/pages/tools/SystemStatus';
import AIBuilderTool from '@/pages/tools/AIBuilderTool';
import ProjectsTool from '@/pages/tools/ProjectsTool';
import UploadsTool from '@/pages/tools/UploadsTool';
import LogsTool from '@/pages/tools/LogsTool';
import AvatarLab from '@/pages/tools/AvatarLab';
import VoiceLab from '@/pages/tools/VoiceLab';
import MemoryVault from '@/pages/tools/MemoryVault';
import ChatEngine from '@/pages/tools/ChatEngine';
import DatabaseTool from '@/pages/tools/DatabaseTool';
import ApiManager from '@/pages/tools/ApiManager';
import WorkflowEditor from '@/pages/tools/WorkflowEditor';
import Admin from '@/pages/Admin';
import BibleWorkspace from '@/pages/BibleWorkspace';
import AppEcosystem from '@/pages/AppEcosystem.jsx';
import LiveConsole from '@/pages/admin/LiveConsole';
import CostManager from '@/pages/admin/CostManager';
import AutomationEngine from '@/pages/admin/AutomationEngine';
import Analytics from '@/pages/Analytics';
import LiveLogs from '@/pages/LiveLogs';
import BackendManifest from '@/pages/BackendManifest';
import ProjectPreview from '@/pages/tools/ProjectPreview';
import DatabaseView from '@/pages/tools/DatabaseView';
import DeploymentManager from '@/pages/tools/DeploymentManager';
import SupabaseAuth from '@/pages/tools/SupabaseAuth';
import SupabaseStatus from '@/pages/tools/SupabaseStatus';
import AccountDashboard from '@/pages/AccountDashboard';
import { SupabaseProvider } from '@/lib/SupabaseContext';
import EngineStatus from '@/pages/admin/EngineStatus';
import FounderAdmin from '@/pages/admin/FounderAdmin';
import LiveSandbox from '@/pages/LiveSandbox';
import Pricing from '@/pages/Pricing';
import ThankYou from '@/pages/ThankYou';
import Publish from '@/pages/Publish';
import Billing from '@/pages/Billing';
import ProjectLanding from '@/pages/ProjectLanding.jsx';
import FounderStory from '@/pages/FounderStory';
import CreditDashboard from '@/pages/CreditDashboard';
import WorkflowBuilder from '@/pages/WorkflowBuilder';
import DeploymentDashboard from '@/pages/DeploymentDashboard';
import IntegrationManager from '@/pages/IntegrationManager';
import AIModels from '@/pages/AIModels';
import Deployments from '@/pages/Deployments';
import SystemDiagnostics from '@/pages/SystemDiagnostics';
import FounderCenter from '@/pages/FounderCenter';
import FounderBuilder from '@/pages/founder/FounderBuilder';
import CodeDiagnostics from '@/pages/founder/CodeDiagnostics';
import PatchCenter from '@/pages/founder/PatchCenter';
import RollbackCenter from '@/pages/founder/RollbackCenter';
import TestRunner from '@/pages/founder/TestRunner';
import ReleaseGate from '@/pages/founder/ReleaseGate';
import DeploymentCenter from '@/pages/founder/DeploymentCenter';
import StabilizationCenter from '@/pages/founder/StabilizationCenter';
import StagingValidation from '@/pages/founder/StagingValidation';
import AppWorkspace from '@/pages/apps/AppWorkspace';
import EternalEcho from '@/pages/EternalEcho';
import BackendStatus from '@/pages/BackendStatus';
import SystemLogs from '@/pages/SystemLogs';
import Help from '@/pages/Help';
import Discipleship from './pages/Discipleship'
import Denominations from './pages/Denominations'
import ChurchHistory from './pages/ChurchHistory'
import Martyrs from './pages/Martyrs'
import ChristianHeroes from './pages/ChristianHeroes'
import Apologetics from './pages/Apologetics'
import TheologyLibrary from './pages/TheologyLibrary'
import BibleCollege from './pages/BibleCollege'
import LiveTranscribe from './pages/LiveTranscribe'
import LeadershipTraining from './pages/LeadershipTraining'
import ResearchFreemasonry from './pages/ResearchFreemasonry'
import SermonPrep from './pages/SermonPrep'

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-xs text-muted-foreground font-mono tracking-widest animate-pulse">TERRELLOS LOADING…</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Prevent double-redirect by checking if we're already on the login page
      if (!window.location.pathname.includes('login')) {
        navigateToLogin();
      }
      return null;
    } else if (authError.type === 'unknown') {
      // Unknown errors — show recoverable UI instead of white screen
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
          <div className="max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto">
              <span className="text-destructive text-xl">!</span>
            </div>
            <h2 className="text-lg font-bold text-foreground">Failed to load app</h2>
            <p className="text-xs text-muted-foreground font-mono">{authError.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg gradient-purple-blue hover:opacity-90 transition-opacity"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/ai-builder" element={<AIBuilder />} />
        <Route path="/ai-builder-split" element={<AIBuilderSplit />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/upload-vault" element={<UploadVault />} />
        <Route path="/build-logs" element={<BuildLogs />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="/diagnostics" element={<Diagnostics />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/tools/ai-builder" element={<AIBuilderTool />} />
        <Route path="/tools/projects" element={<ProjectsTool />} />
        <Route path="/tools/uploads" element={<UploadsTool />} />
        <Route path="/tools/logs" element={<LogsTool />} />
        <Route path="/tools/system-status" element={<SystemStatus />} />
        <Route path="/tools/avatar-lab" element={<AvatarLab />} />
        <Route path="/tools/voice-lab" element={<VoiceLab />} />
        <Route path="/tools/memory-vault" element={<MemoryVault />} />
        <Route path="/tools/chat-engine" element={<ChatEngine />} />
        <Route path="/tools/database" element={<DatabaseTool />} />
        <Route path="/tools/api-manager" element={<ApiManager />} />
        <Route path="/tools/workflow" element={<WorkflowEditor />} />
        <Route path="/tools/project-preview" element={<ProjectPreview />} />
        <Route path="/tools/database-view" element={<DatabaseView />} />
        <Route path="/tools/deploy" element={<DeploymentManager />} />
        <Route path="/tools/supabase-auth" element={<SupabaseAuth />} />
        <Route path="/tools/supabase-status" element={<SupabaseStatus />} />
        <Route path="/account" element={<AccountDashboard />} />
        <Route path="/admin/engine" element={<EngineStatus />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/live-logs" element={<LiveLogs />} />
        <Route path="/backend-manifest" element={<BackendManifest />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/bible" element={<BibleWorkspace />} />
        <Route path="/ecosystem" element={<AppEcosystem />} />
        <Route path="/admin/live-console" element={<LiveConsole />} />
        <Route path="/admin/cost-manager" element={<CostManager />} />
        <Route path="/admin/automation" element={<AutomationEngine />} />
        <Route path="/admin/founder" element={<FounderAdmin />} />
        <Route path="/sandbox" element={<LiveSandbox />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/publish" element={<Publish />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/project/:projectId" element={<ProjectLanding />} />
        <Route path="/founder-story" element={<FounderStory />} />
        <Route path="/credit-dashboard" element={<CreditDashboard />} />
        <Route path="/workflow-builder" element={<WorkflowBuilder />} />
        <Route path="/deployment-dashboard" element={<DeploymentDashboard />} />
        <Route path="/integrations" element={<IntegrationManager />} />
        <Route path="/ai-models" element={<AIModels />} />
        <Route path="/deployments" element={<Deployments />} />
        <Route path="/system-status" element={<SystemDiagnostics />} />
        <Route path="/founder" element={<FounderCenter />} />
        <Route path="/founder/builder" element={<FounderBuilder />} />
        <Route path="/founder/code-diagnostics" element={<CodeDiagnostics />} />
        <Route path="/founder/patch-center" element={<PatchCenter />} />
        <Route path="/founder/rollback-center" element={<RollbackCenter />} />
        <Route path="/founder/test-runner" element={<TestRunner />} />
        <Route path="/founder/release-gate" element={<ReleaseGate />} />
        <Route path="/founder/deployment-center" element={<DeploymentCenter />} />
        <Route path="/founder/stabilization-center" element={<StabilizationCenter />} />
        <Route path="/founder/staging-validation" element={<StagingValidation />} />
        <Route path="/apps/:appId" element={<AppWorkspace />} />
        <Route path="/eternal-echo" element={<EternalEcho />} />
        <Route path="/backend-status" element={<BackendStatus />} />
        <Route path="/system-logs" element={<SystemLogs />} />
        <Route path="/help" element={<Help />} />
      </Route>
      <Route path="/discipleship" element={<Discipleship />} />
          <Route path="/denominations" element={<Denominations />} />
          <Route path="/church-history" element={<ChurchHistory />} />
          <Route path="/martyrs" element={<Martyrs />} />
          <Route path="/christian-heroes" element={<ChristianHeroes />} />
          <Route path="/apologetics" element={<Apologetics />} />
          <Route path="/theology-library" element={<TheologyLibrary />} />
          <Route path="/bible-college" element={<BibleCollege />} />
          <Route path="/live-transcribe" element={<LiveTranscribe />} />
          <Route path="/leadership-training" element={<LeadershipTraining />} />
          <Route path="/research/freemasonry" element={<ResearchFreemasonry />} />
          <Route path="/sermon-prep" element={<SermonPrep />} />
          <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <SupabaseProvider>
            <Router>
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </SupabaseProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App