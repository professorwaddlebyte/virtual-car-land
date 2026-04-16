// components/register-dealer/SuccessScreen.js
// Success screen after form submission

import DawirnyLogo from '../DawirnyLogo';
import Footer from '../Footer';
import { LIGHT_BG, DARK_TEAL, TEAL } from './constants';

export function SuccessScreen({ businessName, email }) {
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
            Your application for <strong>{businessName}</strong> has been received and is pending review.
          </p>
          <div className="rounded-xl p-4 text-left mb-6" style={{ backgroundColor: LIGHT_BG }}>
            <p className="text-sm font-semibold mb-2" style={{ color: DARK_TEAL }}>What happens next?</p>
            <ul className="text-sm space-y-1.5" style={{ color: DARK_TEAL }}>
              <li>• Our team will review your application and documents</li>
              <li>• You'll be contacted at <strong>{email}</strong> once approved</li>
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




