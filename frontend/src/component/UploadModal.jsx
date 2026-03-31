import React, { useState, useRef } from 'react';
import { X, Upload, FileText, File, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const API = 'http://localhost:8000';

const ACCEPTED = '.pdf,.txt,.docx';
const TYPE_ICONS = {
  pdf: { icon: <FileText size={18} />, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  txt: { icon: <File size={18} />, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
  docx: { icon: <FileText size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
};

function getExt(name) {
  return (name.split('.').pop() || '').toLowerCase();
}

export default function UploadModal({ room, token, onClose, onUploaded }) {
  const [files, setFiles] = useState([]); // [{file, status: 'pending'|'uploading'|'done'|'error', message}]
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles).map(f => ({ file: f, status: 'pending', message: '' }));
    setFiles(prev => [...prev, ...arr]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const uploadFile = async (index) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'uploading' } : f));

    const formData = new FormData();
    formData.append('file', files[index].file);

    try {
      const res = await fetch(`${API}/rooms/${room.name}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setFiles(prev => prev.map((f, i) =>
          i === index ? { ...f, status: 'done', message: data.message } : f
        ));
        onUploaded?.({ name: files[index].file.name });
      } else {
        setFiles(prev => prev.map((f, i) =>
          i === index ? { ...f, status: 'error', message: data.detail || 'Upload failed.' } : f
        ));
      }
    } catch {
      setFiles(prev => prev.map((f, i) =>
        i === index ? { ...f, status: 'error', message: 'Network error.' } : f
      ));
    }
  };

  const uploadAll = () => {
    files.forEach((f, i) => { if (f.status === 'pending') uploadFile(i); });
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const hasPending = files.some(f => f.status === 'pending');
  const allDone = files.length > 0 && files.every(f => f.status === 'done');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white">Upload Research Documents</h2>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Index files into <span className="text-indigo-400">{room.name}</span>'s knowledge base
            </p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Supported types */}
        <div className="flex items-center gap-2 mb-5">
          {['PDF', 'TXT', 'DOCX'].map(t => (
            <span key={t} className="text-[11px] text-slate-600 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
              {t}
            </span>
          ))}
          <span className="text-[11px] text-slate-700 ml-1">supported formats</span>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all ${
            dragging
              ? 'border-indigo-500/60 bg-indigo-500/5'
              : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/20'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${dragging ? 'bg-indigo-500/15' : 'bg-slate-800'}`}>
            <Upload size={22} className={dragging ? 'text-indigo-400' : 'text-slate-600'} />
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-400 font-medium">
              {dragging ? 'Drop files here' : 'Drag & drop or click to browse'}
            </p>
            <p className="text-xs text-slate-700 mt-0.5">PDF, TXT, DOCX up to 50 MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            onChange={e => addFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2 max-h-52 overflow-y-auto">
            {files.map((item, i) => {
              const ext = getExt(item.file.name);
              const style = TYPE_ICONS[ext] || TYPE_ICONS.txt;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    item.status === 'done' ? 'bg-emerald-500/5 border-emerald-500/20' :
                    item.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                    'bg-slate-800/50 border-slate-800'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${style.bg} ${style.color}`}>
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate font-medium">{item.file.name}</p>
                    <p className="text-[11px] text-slate-600">
                      {item.status === 'pending' && `${(item.file.size / 1024).toFixed(1)} KB`}
                      {item.status === 'uploading' && 'Processing…'}
                      {item.status === 'done' && <span className="text-emerald-400">{item.message || 'Indexed successfully'}</span>}
                      {item.status === 'error' && <span className="text-red-400">{item.message}</span>}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {item.status === 'uploading' && <Loader2 size={16} className="animate-spin text-indigo-400" />}
                    {item.status === 'done' && <CheckCircle2 size={16} className="text-emerald-400" />}
                    {item.status === 'error' && <AlertCircle size={16} className="text-red-400" />}
                    {item.status === 'pending' && (
                      <button onClick={() => removeFile(i)} className="text-slate-700 hover:text-slate-400 transition-colors">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          {hasPending && (
            <button
              onClick={uploadAll}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-semibold py-3 rounded-xl transition-all"
            >
              <Upload size={15} /> Index {files.filter(f => f.status === 'pending').length} File{files.filter(f => f.status === 'pending').length !== 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={onClose}
            className={`${hasPending ? '' : 'flex-1'} px-5 py-3 text-sm font-medium text-slate-500 hover:text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all`}
          >
            {allDone ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
