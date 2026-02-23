import { useRouter } from 'next/router';

export default function BackButton({ label = '← Back', className = '' }) {
  const router = useRouter();
  
  return (
    <button 
      onClick={() => router.back()}
      className={`text-sm text-black hover:text-[#0055A4] underline cursor-pointer ${className}`}
    >
      {label}
    </button>
  );
}
