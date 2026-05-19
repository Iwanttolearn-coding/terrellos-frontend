import { useState, useCallback, useRef, useEffect } from 'react';
import AvatarScene from './3d/AvatarScene';
import { Mic, MicOff, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

export default function AvatarStage() {
  const [voiceState, setVoiceState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.language = 'en-US';

      recognition.onstart = () => {
        setVoiceState('listening');
        setTranscript('');
      };

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i].transcript;
          if (event.results[i].isFinal) {
            setTranscript(text);
          } else {
            interim += text;
          }
        }
        if (interim) setTranscript(interim);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setVoiceState('idle');
      };

      recognition.onend = async () => {
        if (transcript) {
          await processVoiceInput(transcript);
        } else {
          setVoiceState('idle');
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const processVoiceInput = async (text) => {
    if (!text.trim()) {
      setVoiceState('idle');
      return;
    }

    setIsProcessing(true);
    setVoiceState('processing');

    try {
      // Send to chat backend
      const response = await safeInvoke('chat', {
        message: text,
        history: chatHistory,
      });

      const aiMessage = response.data?.reply || response.data?.message || 'I did not understand that.';

      // Update chat history
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: aiMessage },
      ]);

      // Speak the response
      await speakResponse(aiMessage);
    } catch (error) {
      console.error('Chat error:', error);
      const fallback = "I encountered an error. Please try again.";
      await speakResponse(fallback);
    } finally {
      setIsProcessing(false);
      setVoiceState('idle');
      setTranscript('');
    }
  };

  const speakResponse = (text) => {
    return new Promise((resolve) => {
      // Cancel any ongoing speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setVoiceState('speaking');
      };

      utterance.onend = () => {
        setVoiceState('idle');
        resolve();
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setVoiceState('idle');
        resolve();
      };

      synthRef.current.speak(utterance);
    });
  };

  const handleStartListening = useCallback(() => {
    if (recognitionRef.current && !isProcessing) {
      recognitionRef.current.start();
    }
  }, [isProcessing]);

  const handleStopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-4 p-6">
      {/* 3D Avatar Stage */}
      <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl" style={{ minHeight: '400px' }}>
        <AvatarScene voiceState={voiceState} isSpeaking={voiceState === 'speaking'} />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 justify-center flex-wrap">
          <Button
            onClick={handleStartListening}
            disabled={voiceState !== 'idle' || isProcessing}
            className="gap-2 bg-primary/80 hover:bg-primary"
          >
            <Mic className="w-4 h-4" />
            Start Listening
          </Button>
          <Button
            onClick={handleStopListening}
            disabled={voiceState !== 'listening'}
            variant="outline"
            className="gap-2"
          >
            <MicOff className="w-4 h-4" />
            Stop
          </Button>
        </div>

        {/* Transcript display */}
        {transcript && (
          <div className="bg-secondary/40 rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground font-mono mb-1">You said:</p>
            <p className="text-sm text-foreground">{transcript}</p>
          </div>
        )}

        {/* State indicator */}
        <div className="text-center text-xs font-mono text-muted-foreground">
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2 text-primary">
              <Loader className="w-3 h-3 animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              State: <span className="text-primary font-semibold capitalize">{voiceState}</span>
            </>
          )}
        </div>

        {/* Chat history */}
        {chatHistory.length > 0 && (
          <div className="bg-secondary/20 rounded-lg p-3 max-h-32 overflow-y-auto border border-border">
            <p className="text-xs font-mono text-muted-foreground mb-2">Recent:</p>
            <div className="space-y-2 text-xs">
              {chatHistory.slice(-4).map((msg, i) => (
                <div key={i} className={msg.role === 'user' ? 'text-blue-400' : 'text-emerald-400'}>
                  <span className="font-mono">{msg.role}:</span> {msg.content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}