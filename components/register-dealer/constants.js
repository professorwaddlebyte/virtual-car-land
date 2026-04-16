// components/register-dealer/constants.js
// Brand tokens and shared constants

export const TEAL = '#1A9988';
export const DARK_TEAL = '#0d6b5e';
export const LIGHT_BG = '#f0faf9';

export const inputCls = (err) =>
  `w-full border rounded-lg px-3 py-2.5 text-gray-900 bg-white text-sm transition focus:outline-none focus:ring-2 ${
    err ? 'border-red-400 bg-red-50 focus:ring-red-300' : 'border-gray-300 focus:ring-[#1A9988]'
  }`;



