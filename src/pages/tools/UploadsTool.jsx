import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { HardDrive, Upload, Loader2, File, Image, Music, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { sbData } from '@/lib/supabaseData';
import { supabaseSession } from '@/lib/supabaseSession';
import { logActivity } from '@/lib/activityLog';
import { notify } from '@/components/NotificationCenter';

const ACCEPT = 'image/*,audio/mp3,audio/wav,.pdf,video/mp4,.mp4';

function FileIcon({ mimeType }) {
  if (mimeType?.startsWith('image')) return <Image className="w-4 h-4 text-blue-400" />;
  if (mimeType?.startsWith('audio')) return <Music className="w-4 h-4 text-green-400" />;
  if (mimeType === 'application/pdf') return <FileText className="w-4 h-4 text-red-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

export default function UploadsTool() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    base44.entities.Upload.list('-created_date', 30).then(data => { setUploads(data); setLoading(false); });
  }, []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const uploadData = {
        file_name: file.name,
        file_url,
        file_size_kb: Math.round(file.size / 1024),
        mime_type: file.type,
        file_type: file.type.startsWith('image') ? 'photo' : file.type.startsWith('audio') ? 'other' : 'document',
      };
      // Save to Base44 entity
      const record = await base44.entities.Upload.create(uploadData);
      setUploads(prev => [record, ...prev]);
      // Also persist to Supabase if logged in
      if (supabaseSession.getToken()) {
        sbData.saveUpload(uploadData).catch(() => {});
        logActivity('upload', `File uploaded: ${file.name}`, { size_kb: uploadData.file_size_kb });
      }
      notify.success(`${file.name} uploaded`);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) { const dt = new DataTransfer(); dt.items.add(file); fileRef.current.files = dt.files; handleFile({ target: fileRef.current }); }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-800 flex items-center justify-center">
          <HardDrive className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold gradient-text">Upload Files</h1>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        className="rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-card p-8 text-center mb-5 transition-colors cursor-pointer"
        onClick={() => fileRef.current.click()}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <div className="text-sm text-muted-foreground mb-1">
          {uploading ? 'Uploading…' : 'Drop a file here or tap to pick one'}
        </div>
        <div className="text-xs text-muted-foreground">Images · MP3 · WAV · PDF · MP4</div>
        <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFile} />
      </div>

      {uploading && (
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Uploading to storage…
        </div>
      )}

      {uploadError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {uploadError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : uploads.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <File className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <div className="text-sm">No uploads yet.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {uploads.map(u => (
            <div key={u.id} className="card-glass rounded-xl p-3 flex items-center gap-3">
              <FileIcon mimeType={u.mime_type} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{u.file_name}</div>
                <div className="text-xs text-muted-foreground">
                  {u.file_size_kb ? `${u.file_size_kb} KB · ` : ''}{u.created_date ? formatDistanceToNow(new Date(u.created_date), { addSuffix: true }) : ''}
                </div>
              </div>
              {u.file_url && <a href={u.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex-shrink-0">View</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}