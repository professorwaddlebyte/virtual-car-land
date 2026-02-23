import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function QuizAnswers() {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnswers(); }, []);

  const fetchAnswers = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/quiz-answers');
    const data = await res.json();
    if (data.success) setAnswers(data.answers);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Quiz Answers - Admin</title></Head>
      <header className="bg-[#0055A4] text-black font-bold p-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="text-white hover:underline">← Admin</Link>
          <h1 className="text-2xl font-bold">Quiz Answers (Read-Only)</h1>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        {loading ? <p>Loading...</p> : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr><th className="p-3 text-left">ID</th><th className="p-3 text-left">Session</th><th className="p-3 text-left">Submitted</th><th className="p-3 text-left">Answers</th></tr>
              </thead>
              <tbody>
                {answers.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3 font-mono text-xs">{a.id?.slice(0,8)}...</td>
                    <td className="p-3 font-mono text-xs">{a.sessionId?.slice(0,12)}...</td>
                    <td className="p-3 text-sm">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="p-3">
                      <details>
                        <summary className="cursor-pointer text-blue-600 text-sm">View Answers</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">{JSON.stringify(a.answers, null, 2)}</pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-gray-500 text-sm">* This table is read-only for data integrity</p>
      </main>
    </div>
  );
}