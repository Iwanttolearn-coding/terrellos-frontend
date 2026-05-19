/**
 * VoiceButton — animated press-to-talk button with live volume ring.
 */
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VoiceButton({ isRecording, isProcessing, volumeLevel, onStart, onStop, disabled }) {
  const ringScale = isRecording ? 1 + (volumeLevel / 100) * 0.6 : 1;

  return (
    <div className="relative flex items-center justify-center">
      {/* Volume ring */}
      {isRecording && (
        <div
          className="absolute rounded-full bg-destructive/20 transition-transform duration-75"
          style={{
            width: 56, height: 56,
            transform: `scale(${ringScale})`,
          }}
        />
      )}
      {/* Outer pulse ring */}
      {isRecording && (
        <div className="absolute w-14 h-14 rounded-full border-2 border-destructive/40 animate-ping" />
      )}

      <button
        onMouseDown={onStart}
        onMouseUp={onStop}
        onTouchStart={e => { e.preventDefault(); onStart(); }}
        onTouchEnd={e => { e.preventDefault(); onStop(); }}
        onMouseLeave={() => isRecording && onStop()}
        disabled={disabled || isProcessing}
        className={cn(
          'relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isProcessing
            ? 'bg-secondary cursor-not-allowed'
            : isRecording
            ? 'bg-destructive shadow-lg shadow-destructive/40 scale-110'
            : 'bg-primary/20 hover:bg-primary/30 border border-primary/40 hover:border-primary/70 active:scale-95',
        )}
        aria-label={isRecording ? 'Release to send' : 'Hold to talk'}
      >
        {isProcessing
          ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          : isRecording
          ? <MicOff className="w-5 h-5 text-white" />
          : <Mic className="w-5 h-5 text-primary" />}
      </button>
    </div>
  );
}