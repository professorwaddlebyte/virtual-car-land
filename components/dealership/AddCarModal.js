import { useState } from "react";
import FeaturesSelector from "./FeaturesSelector";

const bodies = ["SUV", "Sedan", "Pickup", "Coupe", "Hatchback", "Van", "Truck"];

export default function AddCarModal({ onClose, onSave, makes, colors, featureGroups }) {
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    price_aed: "",
    mileage_km: "",
    color: "",
    transmission: "automatic",
    fuel: "petrol",
    body: "",
    cylinders: "",
    gcc: true,
    description: "",
    trim: "",
  });
  const [features, setFeatures] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [validationStep, setValidationStep] = useState("idle");

  function handlePhotoUpload(e) {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotos((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
    setValidationResult(null);
    setValidationStep("idle");
  }

  async function validatePhotos() {
    if (photos.length === 0) {
      alert("Please upload at least one photo first.");
      return false;
    }

    if (!form.make || !form.model || !form.year) {
      alert("Please fill in Make, Model, and Year before validating photos.");
      return false;
    }

    setValidating(true);
    setValidationStep("validating");

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/vehicles/validate-photos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          images: photos,
          vehicle: {
            make: form.make,
            model: form.model,
            year: parseInt(form.year),
            color: form.color,
            body: form.body,
            trim: form.trim,
          },
        }),
      });

      const result = await res.json();
      setValidationResult(result);

      if (result.valid) {
        setValidationStep("passed");
        return true;
      } else {
        setValidationStep("failed");
        return false;
      }
    } catch (err) {
      console.error("Validation error:", err);
      setValidationStep("failed");
      setValidationResult({
        valid: false,
        match: "error",
        warning: "Could not validate photos. Please check manually.",
        discrepancies: [],
      });
      return false;
    } finally {
      setValidating(false);
    }
  }

  async function uploadPhotosToCloudinary() {
    const token = localStorage.getItem("token");
    const uploadedPhotos = [];

    for (const photo of photos) {
      const res = await fetch("/api/vehicles/upload-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image_base64: photo }),
      });
      const data = await res.json();
      if (data.url) uploadedPhotos.push(data.url);
      else console.error("Cloudinary upload failed:", data.error);
    }
    return uploadedPhotos;
  }

  async function handleSave() {
    if (!form.make || !form.model || !form.year || !form.price_aed) {
      alert("Make, Model, Year and Price are required.");
      return;
    }

    if (photos.length === 0) {
      alert("Please upload at least one photo.");
      return;
    }

    if (validationStep !== "passed") {
      const isValid = await validatePhotos();
      if (!isValid) return;
    }

    setSaving(true);

    try {
      const uploadedPhotos = await uploadPhotosToCloudinary();

      if (uploadedPhotos.length === 0 && photos.length > 0) {
        alert("Photo upload failed. Please try again.");
        setSaving(false);
        return;
      }

      const token = localStorage.getItem("token");
      const res = await fetch("/api/vehicles/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          price_aed: parseInt(form.price_aed),
          mileage_km: form.mileage_km ? parseInt(form.mileage_km) : null,
          cylinders: form.cylinders ? parseInt(form.cylinders) : null,
          specs: {
            color: form.color,
            transmission: form.transmission,
            fuel: form.fuel,
            body: form.body,
            cylinders: form.cylinders,
            gcc: form.gcc,
            features,
          },
          photos: uploadedPhotos,
          ai_validation_passed: validationStep === "passed",
          ai_validation_report: validationResult,
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (data.ok) {
        onSave();
        onClose();
      } else {
        alert("Failed to save vehicle: " + data.error);
      }
    } catch (err) {
      setSaving(false);
      alert("Network error while adding vehicle.");
      console.error(err);
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "text-red-700 bg-red-50 border-red-200";
      case "major":
        return "text-orange-700 bg-orange-50 border-orange-200";
      default:
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-xl">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            🚗 Add New Listing
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            AI will verify photos match your car details
          </p>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Make *</label>
              <select
                value={form.make}
                onChange={(e) => { setForm({ ...form, make: e.target.value }); setValidationStep("idle"); }}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select Make</option>
                {makes.map((m) => (<option key={m} value={m}>{m}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Model *</label>
              <input
                value={form.model}
                onChange={(e) => { setForm({ ...form, model: e.target.value }); setValidationStep("idle"); }}
                placeholder="e.g. Camry"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Year *</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => { setForm({ ...form, year: e.target.value }); setValidationStep("idle"); }}
                placeholder="2020"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Trim (Optional)</label>
              <input
                value={form.trim}
                onChange={(e) => setForm({ ...form, trim: e.target.value })}
                placeholder="LE, SE, XLE, etc."
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Price (AED) *</label>
              <input
                type="number"
                value={form.price_aed}
                onChange={(e) => setForm({ ...form, price_aed: e.target.value })}
                placeholder="85000"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Mileage (km)</label>
              <input
                type="number"
                value={form.mileage_km}
                onChange={(e) => setForm({ ...form, mileage_km: e.target.value })}
                placeholder="45000"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Color</label>
              <select
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select Color</option>
                {colors.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Transmission</label>
              <select
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: e.target.value })}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Fuel</label>
              <select
                value={form.fuel}
                onChange={(e) => setForm({ ...form, fuel: e.target.value })}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Body Type</label>
              <select
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select Body</option>
                {bodies.map((b) => (<option key={b} value={b.toLowerCase()}>{b}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Cylinders</label>
              <select
                value={form.cylinders}
                onChange={(e) => setForm({ ...form, cylinders: e.target.value })}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select</option>
                {["4", "6", "8", "12"].map((c) => (<option key={c} value={c}>{c} cylinders</option>))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <label className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">Specs Type</label>
            <div className="flex gap-2">
              <button onClick={() => setForm({ ...form, gcc: true })} className="px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors" style={{ background: form.gcc ? "#1A9988" : "white", color: form.gcc ? "white" : "#6b7280", borderColor: form.gcc ? "#1A9988" : "#e5e7eb" }}>GCC</button>
              <button onClick={() => setForm({ ...form, gcc: false })} className="px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors" style={{ background: !form.gcc ? "#1A9988" : "white", color: !form.gcc ? "white" : "#6b7280", borderColor: !form.gcc ? "#1A9988" : "#e5e7eb" }}>Non-GCC</button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Features & Options {features.length > 0 && (<span className="normal-case text-teal-600 font-normal">({features.length} selected)</span>)}</label>
            <div className="border border-gray-200 rounded-xl p-3 max-h-56 overflow-y-auto bg-gray-50">
              {featureGroups.length > 0 ? (<FeaturesSelector selected={features} onChange={setFeatures} featureGroups={featureGroups} />) : (<p className="text-xs text-gray-400 text-center py-4">Loading features...</p>)}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Seller's Notes</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="e.g. Excellent condition, single owner, company maintained..." className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Photos *</label>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="w-full mt-1 text-sm text-gray-500" />
            <p className="text-xs text-gray-400 mt-1">Upload front, back, side, and interior views for best AI verification</p>
            {photos.length > 0 && (<div className="flex gap-2 mt-2 flex-wrap">{photos.map((p, i) => (<div key={i} className="relative"><img src={p} className="w-16 h-16 object-cover rounded-lg" /><button onClick={() => { setPhotos((prev) => prev.filter((_, j) => j !== i)); setValidationStep("idle"); setValidationResult(null); }} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button></div>))}</div>)}
          </div>

          <div className="space-y-2">
            {validationStep === "validating" && (<div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3"><div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" /><div><p className="text-sm font-medium text-blue-700">AI is analyzing your photos...</p><p className="text-xs text-blue-500">Checking make, model, year, and visual consistency</p></div></div>)}
            {validationStep === "failed" && validationResult && (<div className="bg-red-50 border border-red-200 rounded-xl p-3"><div className="flex items-center gap-2 mb-2"><span className="text-red-600 text-xl">⚠️</span><p className="text-sm font-bold text-red-700">Photo Validation Failed</p></div><p className="text-sm text-red-600 mb-2">{validationResult.warning || "The photos do not match the vehicle description."}</p>{validationResult.discrepancies?.length > 0 && (<div className="mt-2 space-y-1.5"><p className="text-xs font-semibold text-red-700 uppercase">Discrepancies Found:</p>{validationResult.discrepancies.map((d, idx) => (<div key={idx} className={`text-xs p-2 rounded border ${getSeverityColor(d.severity)}`}><span className="font-bold">Observed:</span> {d.observed}<br /><span className="font-bold">Expected:</span> {d.expected}</div>))}</div>)}{validationResult.inferred_make && validationResult.inferred_make !== form.make && (<div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">🤔 AI detected: {validationResult.inferred_make} {validationResult.inferred_model} ({validationResult.inferred_year})</div>)}<button onClick={() => { setValidationStep("idle"); setValidationResult(null); }} className="mt-3 text-xs text-red-600 underline">I understand, let me review my photos</button></div>)}
            {validationStep === "passed" && (<div className="bg-green-50 border border-green-200 rounded-xl p-3"><div className="flex items-center gap-2"><span className="text-green-600 text-xl">✓</span><div><p className="text-sm font-bold text-green-700">Photos Verified!</p><p className="text-xs text-green-600">AI confirms these photos match your {form.year} {form.make} {form.model}</p></div></div></div>)}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-gray-600 font-semibold bg-gray-100">Cancel</button>
          {validationStep === "idle" && photos.length > 0 && (<button onClick={validatePhotos} disabled={validating || !form.make || !form.model} className="py-2.5 px-4 rounded-xl text-white font-bold" style={{ background: "#1A9988", opacity: validating || !form.make || !form.model ? 0.6 : 1 }}>{validating ? "Analyzing..." : "🔍 Verify Photos"}</button>)}
          <button onClick={handleSave} disabled={saving || validationStep !== "passed"} className="flex-1 py-2.5 rounded-xl text-white font-bold" style={{ background: "#1A9988", opacity: saving || validationStep !== "passed" ? 0.5 : 1 }}>{saving ? "Saving..." : validationStep === "passed" ? "✓ Save Listing" : "Verify Photos First"}</button>
        </div>
      </div>
    </div>
  );
}




