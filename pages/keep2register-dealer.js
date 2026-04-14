// pages/register-dealer.js
// Public self-registration page for new dealerships
// 5 steps: Business Info → Showroom → Contact → Emirates ID → Review & Submit

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import DawirnyLogo from '../components/DawirnyLogo';
import Footer from '../components/Footer';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL = '#1A9988';
const DARK_TEAL = '#0d6b5e';
const LIGHT_BG = '#f0faf9';

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ current, total }) {
  const labels = ['Business', 'Showroom', 'Contact', 'Emirates ID', 'Review'];
  return (
    <>
      {/* Desktop step bar */}
      <div className="hidden sm:flex items-center justify-center mb-8">
        {labels.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all"
                  style={{
                    backgroundColor: done ? '#16a34a' : active ? TEAL : 'white',
                    borderColor: done ? '#16a34a' : active ? TEAL : '#d1d5db',
                    color: done || active ? 'white' : '#9ca3af',
                  }}
                >
                  {done ? '✓' : step}
                </div>
                <span className="text-xs mt-1 font-medium" style={{ color: active ? TEAL : done ? '#16a34a' : '#9ca3af' }}>
                  {label}
                </span>
              </div>
              {i < total - 1 && (
                <div className="w-10 h-0.5 mx-1 mb-5" style={{ backgroundColor: done ? '#16a34a' : '#e5e7eb' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile step bar — compact dots + active label */}
      <div className="flex sm:hidden flex-col items-center mb-6 gap-2">
        <div className="flex items-center gap-1.5">
          {labels.map((label, i) => {
            const step = i + 1;
            const done = step < current;
            const active = step === current;
            return (
              <div key={step} className="flex items-center gap-1.5">
                <div
                  className="rounded-full flex items-center justify-center font-bold border-2 transition-all"
                  style={{
                    width: active ? 32 : 22,
                    height: active ? 32 : 22,
                    fontSize: active ? 13 : 11,
                    backgroundColor: done ? '#16a34a' : active ? TEAL : 'white',
                    borderColor: done ? '#16a34a' : active ? TEAL : '#d1d5db',
                    color: done || active ? 'white' : '#9ca3af',
                  }}
                >
                  {done ? '✓' : step}
                </div>
                {i < total - 1 && (
                  <div className="w-5 h-0.5" style={{ backgroundColor: done ? '#16a34a' : '#e5e7eb' }} />
                )}
              </div>
            );
          })}
        </div>
        <span className="text-sm font-semibold" style={{ color: TEAL }}>
          Step {current} of {total}: {labels[current - 1]}
        </span>
      </div>
    </>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, error, hint, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-black mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs mb-1" style={{ color: TEAL }}>{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-600 mt-1 flex items-start gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

// ─── Input class ──────────────────────────────────────────────────────────────
const inputCls = (err) =>
  `w-full border rounded-lg px-3 py-2.5 text-gray-900 bg-white text-sm transition focus:outline-none focus:ring-2 ${
    err ? 'border-red-400 bg-red-50 focus:ring-red-300' : 'border-gray-300 focus:ring-[#1A9988]'
  }`;

// ─── Image upload ─────────────────────────────────────────────────────────────
// FIX: parent form holds the full {url, preview} object.
// We derive ALL display state from the `value` prop — no local preview state.
// This prevents the "image shows but upload failed" confusion.
function ImageUpload({ label, docType, value, onChange, error, hint, required = true }) {
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

      {uploadError && <p className="text-xs text-red-600 mt-1 flex items-start gap-1"><span>⚠</span>{uploadError}</p>}
      {error && !uploadError && <p className="text-xs text-red-600 mt-1 flex items-start gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

// ─── Review helpers ───────────────────────────────────────────────────────────
function ReviewRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-44 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-semibold">{value}</span>
    </div>
  );
}

function ReviewCard({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden mb-4">
      <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: LIGHT_BG, color: DARK_TEAL }}>
        {title}
      </div>
      <div className="px-4 py-1 bg-white">{children}</div>
    </div>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────
function PrimaryBtn({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      style={{ backgroundColor: disabled ? '#9ca3af' : TEAL }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = DARK_TEAL; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = TEAL; }}
    >
      {children}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RegisterDealer() {
  const [step, setStep] = useState(1);
  const [markets, setMarkets] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [notRobot, setNotRobot] = useState(false);
  const [skipAI, setSkipAI] = useState(false);

  // Refs for focusing first error field
  const fieldRefs = useRef({});

  const [form, setForm] = useState({
    business_name: '', trade_license_number: '', trade_license_expiry: '', trade_license_img: null,
    market_id: '', showroom_number: '', section: '', location_hint: '', map_x: '', map_y: '',
    contact_person: '', authorized_signatory: '', phone: '', whatsapp_number: '', email: '',
    emirates_id_number: '', emirates_id_expiry: '', emirates_id_front_img: null, emirates_id_back_img: null,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const clearError = (key) => setFieldErrors(e => { const n = { ...e }; delete n[key]; return n; });

  useEffect(() => {
    fetch('/api/markets-public').then(r => r.json()).then(d => setMarkets(d.markets || [])).catch(() => {});
  }, []);

  const validate = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.business_name.trim()) errs.business_name = 'Business name is required';
      if (!form.trade_license_number.trim()) errs.trade_license_number = 'License number is required';
      if (!form.trade_license_expiry) errs.trade_license_expiry = 'License expiry date is required';
      if (!form.trade_license_img?.url) errs.trade_license = form.trade_license_img?.preview
        ? 'Image is still uploading — please wait a moment before continuing'
        : 'Please upload your trade license image';
      if (!notRobot) errs.not_robot = 'Please confirm you are not a robot';
    }
    if (s === 2) {
      if (!form.market_id) errs.market_id = 'Please select a market';
      if (!form.showroom_number.trim()) errs.showroom_number = 'Showroom number is required';
      if (!form.section.trim()) errs.section = 'Section is required';
    }
    if (s === 3) {
      if (!form.contact_person.trim()) errs.contact_person = 'Contact person name is required';
      if (!form.authorized_signatory.trim()) errs.authorized_signatory = 'Authorized signatory name is required';
      if (!form.phone.trim()) errs.phone = 'Phone number is required';
      if (!form.email.trim()) errs.email = 'Email address is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email address';
    }
    if (s === 4) {
      if (!form.emirates_id_number.trim()) errs.emirates_id_number = 'Emirates ID number is required';
      else if (!/^784-\d{4}-\d{7}-\d$/.test(form.emirates_id_number)) errs.emirates_id_number = 'Format must be: 784-YYYY-XXXXXXX-X (e.g. 784-1990-1234567-8)';
      if (!form.emirates_id_expiry) errs.emirates_id_expiry = 'Emirates ID expiry date is required';
      if (!form.emirates_id_front_img?.url) errs.emirates_id_front = form.emirates_id_front_img?.preview
        ? 'Front image is still uploading — please wait'
        : 'Please upload the front of your Emirates ID';
      if (!form.emirates_id_back_img?.url) errs.emirates_id_back = form.emirates_id_back_img?.preview
        ? 'Back image is still uploading — please wait'
        : 'Please upload the back of your Emirates ID';
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validate(step);
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      // Focus the first error field
      const firstKey = Object.keys(errs)[0];
      setTimeout(() => {
        const el = fieldRefs.current[firstKey];
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus?.(); }
      }, 50);
      return;
    }
    setFieldErrors({}); setGlobalError('');
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setFieldErrors({}); setGlobalError('');
    setStep(s => s - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setValidating(true); setGlobalError(''); setFieldErrors({});
    try {
      // Skip AI document verification if bypass checkbox is checked
      if (!skipAI) {
        const validRes = await fetch('/api/validate-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trade_license_url: form.trade_license_img.url,
            emirates_id_front_url: form.emirates_id_front_img.url,
            business_name: form.business_name,
            trade_license_number: form.trade_license_number,
            trade_license_expiry: form.trade_license_expiry,
            emirates_id_number: form.emirates_id_number,
            emirates_id_expiry: form.emirates_id_expiry,
          }),
        });
        const validData = await validRes.json();

        if (!validData.ok) {
          const errs = {};
          const general = [];
          for (const e of validData.errors || []) {
            if (e.field) errs[e.field] = e.message;
            else general.push(e.message);
          }
          setFieldErrors(errs);
          if (general.length) setGlobalError(general.join(' '));
          setValidating(false);
          const licenseFields = ['trade_license', 'business_name', 'trade_license_number', 'trade_license_expiry'];
          const idFields = ['emirates_id_front', 'emirates_id_number', 'emirates_id_expiry'];
          if (Object.keys(errs).some(k => licenseFields.includes(k))) setStep(1);
          else if (Object.keys(errs).some(k => idFields.includes(k))) setStep(4);
          return;
        }
      }
      setValidating(false); setSubmitting(true);
      const regRes = await fetch('/api/register-dealer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: form.business_name, trade_license_number: form.trade_license_number,
          trade_license_expiry: form.trade_license_expiry, trade_license_url: form.trade_license_img.url,
          market_id: form.market_id, showroom_number: form.showroom_number, section: form.section,
          location_hint: form.location_hint, map_x: form.map_x, map_y: form.map_y,
          contact_person: form.contact_person, authorized_signatory: form.authorized_signatory,
          phone: form.phone, whatsapp_number: form.whatsapp_number, email: form.email,
          emirates_id_number: form.emirates_id_number, emirates_id_expiry: form.emirates_id_expiry,
          emirates_id_front_url: form.emirates_id_front_img.url, emirates_id_back_url: form.emirates_id_back_img.url,
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) { setGlobalError(regData.error || 'Registration failed. Please try again.'); setSubmitting(false); return; }
      setSubmitted(true);
    } catch {
      setGlobalError('Something went wrong. Please check your connection and try again.');
    } finally {
      setValidating(false); setSubmitting(false);
    }
  };

  // ── Success ───────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: LIGHT_BG }}>
        <header className="bg-white border-b border-gray-100 px-6 py-4 shadow-sm">
          <div className="max-w-2xl mx-auto"><DawirnyLogo /></div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-5xl"
              style={{ backgroundColor: LIGHT_BG }}>🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
            <p className="text-gray-600 mb-6">
              Your application for <strong>{form.business_name}</strong> has been received and is pending review.
            </p>
            <div className="rounded-xl p-4 text-left mb-6" style={{ backgroundColor: LIGHT_BG }}>
              <p className="text-sm font-semibold mb-2" style={{ color: DARK_TEAL }}>What happens next?</p>
              <ul className="text-sm space-y-1.5" style={{ color: DARK_TEAL }}>
                <li>• Our team will review your application and documents</li>
                <li>• You'll be contacted at <strong>{form.email}</strong> once approved</li>
                <li>• Approval typically takes 1–2 business days</li>
              </ul>
            </div>
            <a href="/" className="text-sm font-medium hover:underline" style={{ color: TEAL }}>← Back to marketplace</a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Step content ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 1: return (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Business Information</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your details exactly as they appear on your DED trade license.</p>
          <Field label="Dealership / Business Name" required error={fieldErrors.business_name}
            hint="Enter the trade name exactly as written on your DED license — including LLC, Trading, etc.">
            <input ref={el => fieldRefs.current.business_name = el}
              value={form.business_name} onChange={e => { set('business_name', e.target.value); clearError('business_name'); }}
              className={inputCls(fieldErrors.business_name)} placeholder="e.g. Al Mansouri Motors LLC" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Trade License Number" required error={fieldErrors.trade_license_number}>
              <input ref={el => fieldRefs.current.trade_license_number = el}
                value={form.trade_license_number} onChange={e => { set('trade_license_number', e.target.value); clearError('trade_license_number'); }}
                className={inputCls(fieldErrors.trade_license_number)} placeholder="e.g. 819234" />
            </Field>
            <Field label="License Expiry Date" required error={fieldErrors.trade_license_expiry}>
              <input ref={el => fieldRefs.current.trade_license_expiry = el}
                type="date" value={form.trade_license_expiry} onChange={e => { set('trade_license_expiry', e.target.value); clearError('trade_license_expiry'); }}
                className={inputCls(fieldErrors.trade_license_expiry)} />
            </Field>
          </div>
          <ImageUpload label="Trade License Image" docType="trade_license"
            value={form.trade_license_img} onChange={v => { set('trade_license_img', v); clearError('trade_license'); }}
            error={fieldErrors.trade_license}
            hint="Upload a clear photo or scan of your Dubai DED-issued Trade License. The full document must be visible." />

          {/* Not a robot checkbox */}
          <div
            ref={el => fieldRefs.current.not_robot = el}
            className="flex items-center gap-3 mt-2 p-3 rounded-xl border cursor-pointer select-none"
            style={{ borderColor: fieldErrors.not_robot ? '#f87171' : notRobot ? TEAL : '#d1d5db', backgroundColor: fieldErrors.not_robot ? '#fef2f2' : notRobot ? LIGHT_BG : '#f9fafb' }}
            onClick={() => { setNotRobot(v => !v); clearError('not_robot'); }}
          >
            <div
              className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
              style={{ borderColor: notRobot ? TEAL : '#9ca3af', backgroundColor: notRobot ? TEAL : 'white' }}
            >
              {notRobot && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <span className="text-sm font-medium text-black">I am not a robot</span>
          </div>
          {fieldErrors.not_robot && (
            <p className="text-xs text-red-600 mt-1 flex items-start gap-1"><span>⚠</span>{fieldErrors.not_robot}</p>
          )}
        </>
      );

      case 2: return (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Showroom Information</h2>
          <p className="text-sm text-gray-500 mb-6">Tell us where your showroom is located in the market.</p>
          <Field label="Market Location" required error={fieldErrors.market_id}>
            <select ref={el => fieldRefs.current.market_id = el}
              value={form.market_id} onChange={e => { set('market_id', e.target.value); clearError('market_id'); }}
              className={inputCls(fieldErrors.market_id)}>
              <option value="">— Select a market —</option>
              {markets.map(m => <option key={m.id} value={m.id}>{m.name} — {m.city}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Showroom Number" required error={fieldErrors.showroom_number} hint="e.g. A-14, B-07">
              <input ref={el => fieldRefs.current.showroom_number = el}
                value={form.showroom_number} onChange={e => { set('showroom_number', e.target.value); clearError('showroom_number'); }}
                className={inputCls(fieldErrors.showroom_number)} placeholder="e.g. A-14" />
            </Field>
            <Field label="Section" required error={fieldErrors.section} hint="Single letter — A, B, C...">
              <input ref={el => fieldRefs.current.section = el}
                value={form.section} onChange={e => { set('section', e.target.value.toUpperCase()); clearError('section'); }}
                className={inputCls(fieldErrors.section)} placeholder="e.g. A" maxLength={2} />
            </Field>
          </div>
          <Field label="Location Hint" hint="Help customers find you, e.g. Gate 1, Row A, Unit 14">
            <input value={form.location_hint} onChange={e => set('location_hint', e.target.value)}
              className={inputCls()} placeholder="e.g. Near Gate 1, first unit on the right" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Map Position X %" hint="Optional — horizontal % on market map (0–100)">
              <input type="number" min="0" max="100" value={form.map_x} onChange={e => set('map_x', e.target.value)}
                className={inputCls()} placeholder="e.g. 22.5" />
            </Field>
            <Field label="Map Position Y %" hint="Optional — vertical % on market map (0–100)">
              <input type="number" min="0" max="100" value={form.map_y} onChange={e => set('map_y', e.target.value)}
                className={inputCls()} placeholder="e.g. 35.0" />
            </Field>
          </div>
        </>
      );

      case 3: return (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Contact Details</h2>
          <p className="text-sm text-gray-500 mb-6">Who should we contact about this dealership?</p>
          <Field label="Contact Person" required error={fieldErrors.contact_person} hint="Day-to-day point of contact">
            <input ref={el => fieldRefs.current.contact_person = el}
              value={form.contact_person} onChange={e => { set('contact_person', e.target.value); clearError('contact_person'); }}
              className={inputCls(fieldErrors.contact_person)} placeholder="Full name" />
          </Field>
          <Field label="Authorized Signatory Name" required error={fieldErrors.authorized_signatory}
            hint="Person legally authorized to sign on behalf of the business — must match the Emirates ID in the next step">
            <input ref={el => fieldRefs.current.authorized_signatory = el}
              value={form.authorized_signatory} onChange={e => { set('authorized_signatory', e.target.value); clearError('authorized_signatory'); }}
              className={inputCls(fieldErrors.authorized_signatory)} placeholder="Full legal name" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mobile Number" required error={fieldErrors.phone}>
              <input ref={el => fieldRefs.current.phone = el}
                value={form.phone} onChange={e => { set('phone', e.target.value); clearError('phone'); }}
                className={inputCls(fieldErrors.phone)} placeholder="+971 50 XXX XXXX" />
            </Field>
            <Field label="WhatsApp Number" hint="Leave blank if same as mobile">
              <input value={form.whatsapp_number} onChange={e => set('whatsapp_number', e.target.value)}
                className={inputCls()} placeholder="+971 50 XXX XXXX" />
            </Field>
          </div>
          <Field label="Email Address" required error={fieldErrors.email}>
            <input ref={el => fieldRefs.current.email = el}
              type="email" value={form.email} onChange={e => { set('email', e.target.value); clearError('email'); }}
              className={inputCls(fieldErrors.email)} placeholder="business@example.com" />
          </Field>
        </>
      );

      case 4: return (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Emirates ID</h2>
          <p className="text-sm text-gray-500 mb-6">Upload the authorized signatory's Emirates ID — both sides of the card.</p>
          <div className="rounded-xl p-4 mb-5 text-sm border" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
            <strong>📋 What to upload:</strong> The front and back of the <strong>Emirates ID card</strong> (blue ICA-issued card). Not a passport. Ensure the full card is visible and in focus.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Emirates ID Number" required error={fieldErrors.emirates_id_number} hint="Format: 784-YYYY-XXXXXXX-X">
              <input
                ref={el => fieldRefs.current.emirates_id_number = el}
                value={form.emirates_id_number}
                onChange={e => {
                  let v = e.target.value.replace(/[^\d]/g, '');
                  if (v.length > 3) v = v.slice(0, 3) + '-' + v.slice(3);
                  if (v.length > 8) v = v.slice(0, 8) + '-' + v.slice(8);
                  if (v.length > 16) v = v.slice(0, 16) + '-' + v.slice(16);
                  if (v.length > 18) v = v.slice(0, 18);
                  set('emirates_id_number', v); clearError('emirates_id_number');
                }}
                className={inputCls(fieldErrors.emirates_id_number)} placeholder="784-1990-1234567-8" maxLength={18} />
            </Field>
            <Field label="Emirates ID Expiry" required error={fieldErrors.emirates_id_expiry}>
              <input ref={el => fieldRefs.current.emirates_id_expiry = el}
                type="date" value={form.emirates_id_expiry} onChange={e => { set('emirates_id_expiry', e.target.value); clearError('emirates_id_expiry'); }}
                className={inputCls(fieldErrors.emirates_id_expiry)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ImageUpload label="Emirates ID — Front" docType="emirates_id_front"
              value={form.emirates_id_front_img} onChange={v => { set('emirates_id_front_img', v); clearError('emirates_id_front'); }}
              error={fieldErrors.emirates_id_front} hint="Side with photo, name, ID number and expiry" />
            <ImageUpload label="Emirates ID — Back" docType="emirates_id_back"
              value={form.emirates_id_back_img} onChange={v => { set('emirates_id_back_img', v); clearError('emirates_id_back'); }}
              error={fieldErrors.emirates_id_back} hint="Side with signature and MRZ lines" />
          </div>
        </>
      );

      case 5: return (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Review & Submit</h2>
          <p className="text-sm text-gray-500 mb-5">Check your details below. Documents will be verified automatically on submit.</p>

          {globalError && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-4 text-sm" style={{ color: '#b91c1c' }}>
              <strong>⚠ Error:</strong> {globalError}
            </div>
          )}
          {Object.keys(fieldErrors).length > 0 && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-4 text-sm" style={{ color: '#b91c1c' }}>
              <strong>⚠ Document verification failed. Please go back and fix:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                {Object.values(fieldErrors).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <ReviewCard title="Business">
            <ReviewRow label="Business Name" value={form.business_name} />
            <ReviewRow label="License Number" value={form.trade_license_number} />
            <ReviewRow label="License Expiry" value={form.trade_license_expiry} />
          </ReviewCard>
          <ReviewCard title="Showroom">
            <ReviewRow label="Market" value={markets.find(m => m.id === form.market_id)?.name} />
            <ReviewRow label="Showroom #" value={form.showroom_number} />
            <ReviewRow label="Section" value={form.section} />
            <ReviewRow label="Location Hint" value={form.location_hint} />
          </ReviewCard>
          <ReviewCard title="Contact">
            <ReviewRow label="Contact Person" value={form.contact_person} />
            <ReviewRow label="Authorized Signatory" value={form.authorized_signatory} />
            <ReviewRow label="Mobile" value={form.phone} />
            <ReviewRow label="WhatsApp" value={form.whatsapp_number} />
            <ReviewRow label="Email" value={form.email} />
          </ReviewCard>
          <ReviewCard title="Emirates ID">
            <ReviewRow label="ID Number" value={form.emirates_id_number} />
            <ReviewRow label="ID Expiry" value={form.emirates_id_expiry} />
            <div className="flex gap-3 py-3">
              {form.emirates_id_front_img?.preview && (
                <div className="text-center">
                  <img src={form.emirates_id_front_img.preview} className="w-32 rounded-lg border object-cover" alt="ID Front" />
                  <span className="text-xs text-gray-400 mt-1 block">Front</span>
                </div>
              )}
              {form.emirates_id_back_img?.preview && (
                <div className="text-center">
                  <img src={form.emirates_id_back_img.preview} className="w-32 rounded-lg border object-cover" alt="ID Back" />
                  <span className="text-xs text-gray-400 mt-1 block">Back</span>
                </div>
              )}
            </div>
          </ReviewCard>

          <div className="rounded-xl p-4 text-sm border" style={{ backgroundColor: LIGHT_BG, borderColor: '#99d4ce', color: DARK_TEAL }}>
            🔍 <strong>Automatic verification</strong> — our AI will read your trade license and Emirates ID images and confirm they match the details you entered. This takes about 10 seconds.
          </div>

          {/* Skip AI — test/dev bypass */}
          <div
            className="flex items-center gap-3 mt-4 p-3 rounded-xl border cursor-pointer select-none"
            style={{ borderColor: skipAI ? '#f59e0b' : '#e5e7eb', backgroundColor: skipAI ? '#fffbeb' : '#f9fafb' }}
            onClick={() => setSkipAI(v => !v)}
          >
            <div
              className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
              style={{ borderColor: skipAI ? '#f59e0b' : '#9ca3af', backgroundColor: skipAI ? '#f59e0b' : 'white' }}
            >
              {skipAI && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <div>
              <span className="text-sm font-medium text-black">Skip AI document check</span>
              <span className="text-xs ml-2" style={{ color: '#92400e' }}>(test/dev only)</span>
            </div>
          </div>
        </>
      );

      default: return null;
    }
  };

  return (
    <>
      <Head><title>Register Your Dealership | dawirny</title></Head>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: LIGHT_BG }}>

        <header className="bg-white border-b border-gray-100 shadow-sm px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <DawirnyLogo />
            <a href="/" className="text-sm font-medium hover:underline" style={{ color: TEAL }}>← Back to marketplace</a>
          </div>
        </header>

        <div className="flex-1 py-14 px-4">
          <div className="max-w-2xl mx-auto">

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Register Your Dealership</h1>
              <p className="text-gray-500 mt-2">Join dawirny — complete the form below to apply for a listing account</p>
            </div>

            <StepBar current={step} total={5} />

            <div className="bg-white rounded-2xl shadow-md p-8">
              {renderStep()}

              <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                {step > 1 ? (
                  <button onClick={handleBack}
                    className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
                    ← Back
                  </button>
                ) : (
                  <a href="/" className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
                    ← Back to site
                  </a>
                )}

                {step < 5 ? (
                  <PrimaryBtn onClick={handleNext}>Continue →</PrimaryBtn>
                ) : (
                  <PrimaryBtn onClick={handleSubmit} disabled={submitting || validating}>
                    {validating ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying documents...</>
                    ) : submitting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</>
                    ) : '✓ Submit Application'}
                  </PrimaryBtn>
                )}
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              Already registered? Contact admin for your login details.
            </p>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}



