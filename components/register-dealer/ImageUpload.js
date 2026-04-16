// components/register-dealer/ImageUpload.js
// Image upload component with preview and server upload

import { useState, useRef } from 'react';
import { TEAL, DARK_TEAL, LIGHT_BG } from './constants';

export function ImageUpload({ label, docType, value, onChange, error, hint, required = true }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const preview = value?.preview ?? null;
  const uploaded = !!value?.url;
  const pendingUpload = preview && !uploaded; // file read locally, not yet confirmed by server

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      // Pass preview immediately so user sees the image right away
      onChange({ url: null, preview: base64 });

      try {
        const res = await fetch('/api/upload-reg-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64, doc_type: docType }),
        });
        const data = await res.json();
        if (data.ok) {
          onChange({ url: data.url, preview: base64 });
        } else {
          onChange(null);
          setUploadError(`Upload failed: ${data.error}`);
        }
      } catch {
        onChange(null);
        setUploadError('Upload failed — please check your connection and try again.');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Could not read this file. Please try a different image.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-black mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs mb-1" style={{ color: TEAL }}>{hint}</p>}

      <div
        className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all"
        style={{
          borderColor: error ? '#f87171' : uploaded ? TEAL : pendingUpload ? '#f59e0b' : '#d1d5db',
          backgroundColor: error ? '#fef2f2' : uploaded ? LIGHT_BG : pendingUpload ? '#fffbeb' : '#f9fafb',
        }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-3">
            <div
              className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: TEAL, borderTopColor: 'transparent' }}
            />
            <span className="text-sm text-gray-500 font-medium">Uploading to server...</span>
          </div>
        ) : preview ? (
          <div className="flex flex-col items-center gap-2">
            <img src={preview} alt="Document preview" className="max-h-36 rounded-lg object-contain border border-gray-200 shadow-sm" />
            {uploaded ? (
              <span className="text-xs font-semibold" style={{ color: DARK_TEAL }}>✓ Uploaded — click to replace</span>
            ) : (
              <span className="text-xs font-semibold text-amber-600">⏳ Saving to server, please wait...</span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="text-4xl">📎</div>
            <span className="text-sm font-medium text-gray-600">Click to upload image</span>
            <span className="text-xs text-gray-400">JPG, PNG — max 10MB</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/jpg,image/webp"
          className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      {uploadError && <p className="text-xs mt-1 flex items-start gap-1" style={{ color: '#dc2626' }}><span>⚠</span>{uploadError}</p>}
      {error && !uploadError && <p className="text-xs mt-1 flex items-start gap-1" style={{ color: '#dc2626' }}><span>⚠</span>{error}</p>}
    </div>
  );
}




