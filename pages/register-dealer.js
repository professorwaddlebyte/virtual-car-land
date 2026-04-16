// pages/register-dealer.js
// Public self-registration page for new dealerships
// 5 steps: Business Info → Showroom → Contact → Emirates ID → Review & Submit

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import DawirnyLogo from '../components/DawirnyLogo';
import Footer from '../components/Footer';
import { StepBar } from '../components/register-dealer/StepBar';
import { PrimaryBtn } from '../components/register-dealer/Buttons';
import { SuccessScreen } from '../components/register-dealer/SuccessScreen';
import { Step1Business, Step2Showroom, Step3Contact, Step4EmiratesID, Step5Review } from '../components/register-dealer/StepForms';
import { TEAL, LIGHT_BG } from '../components/register-dealer/constants';

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

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1Business form={form} set={set} fieldErrors={fieldErrors} clearError={clearError} fieldRefs={fieldRefs} notRobot={notRobot} setNotRobot={setNotRobot} markets={markets} />;
      case 2: return <Step2Showroom form={form} set={set} fieldErrors={fieldErrors} clearError={clearError} fieldRefs={fieldRefs} markets={markets} />;
      case 3: return <Step3Contact form={form} set={set} fieldErrors={fieldErrors} clearError={clearError} fieldRefs={fieldRefs} />;
      case 4: return <Step4EmiratesID form={form} set={set} fieldErrors={fieldErrors} clearError={clearError} fieldRefs={fieldRefs} />;
      case 5: return <Step5Review form={form} markets={markets} fieldErrors={fieldErrors} globalError={globalError} skipAI={skipAI} setSkipAI={setSkipAI} />;
      default: return null;
    }
  };

  // Show success screen if submitted
  if (submitted) {
    return <SuccessScreen businessName={form.business_name} email={form.email} />;
  }

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




