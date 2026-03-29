import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function AdminMenu() {
  const [stats, setStats] = useState({});

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [vehicles, cultural, features, quiz] = await Promise.all([
        fetch('/api/admin/vehicles').then(r => r.json()),
        fetch('/api/admin/cultural').then(r => r.json()),
        fetch('/api/admin/features').then(r => r.json()),
        fetch('/api/admin/quiz-answers').then(r => r.json())
      ]);
      setStats({
        vehicles: vehicles.vehicles?.length || 0,
        cultural: cultural.preferences?.length || 0,
        features: features.features?.length || 0,
        quiz: quiz.answers?.length || 0
      });
    } catch (err) {}
  };

  const tables = [
    { name: 'Vehicles', href: '/admin/vehicles', count: stats.vehicles, icon: '🚗', desc: 'Manage car inventory' },
    { name: 'Cultural Preferences', href: '/admin/cultural', count: stats.cultural, icon: '🌍', desc: 'Nationality preferences' },
    { name: 'Vehicle Features', href: '/admin/features', count: stats.features, icon: '⚙️', desc: 'Feature assignments' },
    { name: 'Quiz Answers', href: '/admin/quiz-answers', count: stats.quiz, icon: '📝', desc: 'User submissions (read-only)' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Admin Menu - UAE Car Marketplace</title></Head>
      
      <header className="bg-[#0055A4] text-black font-bold p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Link href="/" className="text-white hover:underline">Back to Site</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-6">Select Table to Manage</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tables.map((table) => (
            <Link key={table.name} href={table.href}>
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-[#0055A4]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-3xl mr-4">{table.icon}</span>
                    <div>
                      <h3 className="font-bold text-lg">{table.name}</h3>
                      <p className="text-gray-500 text-sm">{table.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#0055A4]">{table.count ?? '-'}</span>
                    <p className="text-xs text-gray-400">records</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
