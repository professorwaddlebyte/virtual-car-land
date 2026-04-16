// components/register-dealer/StepForms.js
// Individual step form components

import { Field } from './Field';
import { ImageUpload } from './ImageUpload';
import { inputCls, TEAL } from './constants';
import { ReviewCard, ReviewRow } from './ReviewComponents';

// Step 1: Business Information
export function Step1Business({ form, set, fieldErrors, clearError, fieldRefs, notRobot, setNotRobot, markets }) {
  return (
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
        style={{ borderColor: fieldErrors.not_robot ? '#f87171' : notRobot ? TEAL : '#d1d5db', backgroundColor: fieldErrors.not_robot ? '#fef2f2' : notRobot ? '#f0faf9' : '#f9fafb' }}
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
        <p className="text-xs mt-1 flex items-start gap-1" style={{ color: '#dc2626' }}><span>⚠</span>{fieldErrors.not_robot}</p>
      )}
    </>
  );
}

// Step 2: Showroom Information
export function Step2Showroom({ form, set, fieldErrors, clearError, fieldRefs, markets }) {
  return (
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
}

// Step 3: Contact Details
export function Step3Contact({ form, set, fieldErrors, clearError, fieldRefs }) {
  return (
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
}

// Step 4: Emirates ID
export function Step4EmiratesID({ form, set, fieldErrors, clearError, fieldRefs }) {
  return (
    <>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Emirates ID</h2>
      <p className="text-sm text-gray-500 mb-6">Upload the authorized signatory's Emirates ID — both sides of the card.</p>
      
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
}

// Step 5: Review
export function Step5Review({ form, markets, fieldErrors, globalError, skipAI, setSkipAI }) {
  return (
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
            {Object.values(fieldErrors).map((e, i) => <li key={i} style={{ color: '#b91c1c' }}>{e}</li>)}
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

      <div className="rounded-xl p-4 text-sm border" style={{ backgroundColor: '#f0faf9', borderColor: '#99d4ce', color: '#0d6b5e' }}>
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
}




