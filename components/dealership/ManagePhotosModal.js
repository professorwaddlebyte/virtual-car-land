import { useState } from "react";

export default function ManagePhotosModal({ vehicle, onClose, onSave }) {
  const [photos, setPhotos] = useState(vehicle.photos || []);
  const [originalPhotos] = useState(vehicle.photos || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [validationStep, setValidationStep] = useState("idle");
  const [photosChanged, setPhotosChanged] = useState(false);

  const checkPhotosChanged = (newPhotos) => {
    if (newPhotos.length !== originalPhotos.length) return true;
    return JSON.stringify(newPhotos) !== JSON.stringify(originalPhotos);
  };

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    setUploading(true);
    const token = localStorage.getItem("token");

    for (const file of files) {
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = async (ev) => {
          try {
            const uploadRes = await fetch("/api/vehicles/upload-photo", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ image_base64: ev.target.result }),
            });
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              const newPhotos = [...photos, uploadData.url];
              setPhotos(newPhotos);
              setPhotosChanged(checkPhotosChanged(newPhotos));
              setValidationStep("idle");
              setValidationResult(null);
            }
          } catch (err) { console.error("Upload failed:", err); }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setUploading(false);
  }

  function promoteToMain(index) {
    const newPhotos = [photos[index], ...photos.filter((_, i) => i !== index)];
    setPhotos(newPhotos);
    setPhotosChanged(checkPhotosChanged(newPhotos));
    setValidationStep("idle");
    setValidationResult(null);
  }

  function removePhoto(index) {
    if (!confirm("Remove this photo?")) return;
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotosChanged(checkPhotosChanged(newPhotos));
    setValidationStep("idle");
    setValidationResult(null);
  }

  async function validatePhotos() {
    if (photos.length === 0) { alert("At least one photo is required."); return false; }
    setValidating(true);
    setValidationStep("validating");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/vehicles/validate-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          imageUrls: photos,
          vehicle: { make: vehicle.make, model: vehicle.model, year: vehicle.year, color: vehicle.specs?.color, body: vehicle.specs?.body, trim: vehicle.trim },
        }),
      });
      const result = await res.json();
      setValidationResult(result);
      if (result.valid) { setValidationStep("passed"); return true; }
      else { setValidationStep("failed"); return false; }
    } catch (err) {
      console.error("Validation error:", err);
      setValidationStep("failed");
      setValidationResult({ valid: false, match: "error", warning: "Could not validate photos. Please check manually.", discrepancies: [] });
      return false;
    } finally { setValidating(false); }
  }

  async function handleSave() {
    if (photosChanged) { const isValid = await validatePhotos(); if (!isValid) return; }
    setSaving(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/vehicles/${vehicle.id}/photos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ photos }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) { onSave(photos); onClose(); }
    else alert("Failed: " + data.error);
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical": return "text-red-700 bg-red-50 border-red-200";
      case "major": return "text-orange-700 bg-orange-50 border-orange-200";
      default: return "text-yellow-700 bg-yellow-50 border-yellow-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-xl">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">📷 Manage Photos</h2>
          <p className="text-sm text-gray-500 mt-0.5">{vehicle.year} {vehicle.make} {vehicle.model}</p>
          <p className="text-xs text-gray-400 mt-1">AI will re-verify photos when you make changes</p>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div><label className="text-xs font-semibold text-gray-500 uppercase">Add More Photos</label><input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} className="w-full mt-1 text-sm text-gray-500" />{uploading && (<p className="text-xs text-teal-600 mt-1">⬆️ Uploading to Cloudinary...</p>)}</div>

          {photos.length === 0 ? (<div className="text-center py-8 bg-gray-50 rounded-xl"><div className="text-3xl mb-2">📷</div><p className="text-sm text-gray-400">No photos yet. Upload some above.</p></div>) : (
            <div><label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Current Photos — first photo is the main display image</label><div className="space-y-2">{photos.map((photo, i) => (<div key={i} className="flex items-center gap-3 p-2 rounded-xl border-2" style={{ borderColor: i === 0 ? "#1A9988" : "#f3f4f6", background: i === 0 ? "#f0faf9" : "white" }}><img src={photo} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" /><div className="flex-1 min-w-0">{i === 0 && (<span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white mb-1" style={{ background: "#1A9988" }}>★ Main Photo</span>)}<p className="text-xs text-gray-400 truncate">{photo.split("/").pop()}</p></div><div className="flex gap-2 flex-shrink-0">{i !== 0 && (<button onClick={() => promoteToMain(i)} className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors" style={{ borderColor: "#1A9988", color: "#1A9988" }}>★ Set Main</button>)}<button onClick={() => removePhoto(i)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100">🗑️</button></div></div>))}</div></div>
          )}

          <div className="space-y-2">
            {validationStep === "validating" && (<div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3"><div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" /><div><p className="text-sm font-medium text-blue-700">AI is re-verifying your photos...</p><p className="text-xs text-blue-500">Checking consistency with {vehicle.year} {vehicle.make} {vehicle.model}</p></div></div>)}
            {validationStep === "failed" && validationResult && (<div className="bg-red-50 border border-red-200 rounded-xl p-3"><div className="flex items-center gap-2 mb-2"><span className="text-red-600 text-xl">⚠️</span><p className="text-sm font-bold text-red-700">Photo Validation Failed</p></div><p className="text-sm text-red-600 mb-2">{validationResult.warning || "The photos do not match the vehicle description."}</p>{validationResult.discrepancies?.length > 0 && (<div className="mt-2 space-y-1.5"><p className="text-xs font-semibold text-red-700 uppercase">Discrepancies Found:</p>{validationResult.discrepancies.map((d, idx) => (<div key={idx} className={`text-xs p-2 rounded border ${getSeverityColor(d.severity)}`}><span className="font-bold">Observed:</span> {d.observed}<br /><span className="font-bold">Expected:</span> {d.expected}</div>))}</div>)}{validationResult.inferred_make && validationResult.inferred_make !== vehicle.make && (<div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">🤔 AI detected: {validationResult.inferred_make} {validationResult.inferred_model} ({validationResult.inferred_year})</div>)}<button onClick={() => { setValidationStep("idle"); setValidationResult(null); }} className="mt-3 text-xs text-red-600 underline">I understand these are the correct photos, save anyway</button></div>)}
            {validationStep === "passed" && (<div className="bg-green-50 border border-green-200 rounded-xl p-3"><div className="flex items-center gap-2"><span className="text-green-600 text-xl">✓</span><div><p className="text-sm font-bold text-green-700">Photos Verified!</p><p className="text-xs text-green-600">AI confirms these photos match your {vehicle.year} {vehicle.make} {vehicle.model}</p></div></div></div>)}
            {photosChanged && validationStep === "idle" && photos.length > 0 && (<button onClick={validatePhotos} disabled={validating} className="w-full py-2 rounded-xl text-white font-bold text-sm" style={{ background: "#1A9988", opacity: validating ? 0.6 : 1 }}>{validating ? "Analyzing..." : "🔍 Re-verify Photos After Changes"}</button>)}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-gray-600 font-semibold bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={saving || uploading || (photosChanged && validationStep === "validating")} className="flex-1 py-2.5 rounded-xl text-white font-bold" style={{ background: "#1A9988", opacity: saving || uploading ? 0.7 : 1 }}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}



