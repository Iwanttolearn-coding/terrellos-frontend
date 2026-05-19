import { Brain, Mic, BookOpen, GitBranch, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NODE_TYPES = [
  { type: 'memory_vault', label: 'Memory Vault', icon: Brain, color: 'bg-amber-500/20' },
  { type: 'voice_lab', label: 'Voice Lab', icon: Mic, color: 'bg-cyan-500/20' },
  { type: 'bible_engine', label: 'Bible Engine', icon: BookOpen, color: 'bg-blue-500/20' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'bg-purple-500/20' },
  { type: 'delay', label: 'Delay', icon: Clock, color: 'bg-yellow-500/20' },
  { type: 'error_handler', label: 'Error Handler', icon: AlertCircle, color: 'bg-red-500/20' },
];

export default function NodePalette({ onAddNode }) {
  return (
    <div className="p-4 space-y-2 overflow-y-auto flex-1">
      <div className="text-xs font-mono text-muted-foreground uppercase mb-3">Available Nodes</div>
      {NODE_TYPES.map(({ type, label, icon: Icon, color }) => (
        <Button
          key={type}
          onClick={() => onAddNode(type)}
          variant="outline"
          className="w-full justify-start gap-2 h-9"
        >
          <Icon className="w-3.5 h-3.5" /> {label}
        </Button>
      ))}
    </div>
  );
}