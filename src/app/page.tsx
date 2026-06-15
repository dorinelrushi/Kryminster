"use client";
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface CountMap {
  [candidate: string]: { yes: number; no: number };
}

const candidates = [
  {
    name: 'Marin Memaj',
    img: '/marin.jpg',
  },
  {
    name: 'Agron Shehaj',
    img: '/agron.jpg',
  },
];

export default function Home() {
  const [counts, setCounts] = useState<CountMap>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCounts = async () => {
    const res = await fetch('/api/vote');
    const data = await res.json();
    if (data.success) {
      const organized: CountMap = {};
      Object.entries(data.counts).forEach(([key, value]) => {
        const [candidate, vote] = key.split('|');
        if (!organized[candidate]) organized[candidate] = { yes: 0, no: 0 };
        if (vote === 'yes') organized[candidate].yes = Number(value);
        if (vote === 'no') organized[candidate].no = Number(value);
      });
      setCounts(organized);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleVote = async (candidate: string, vote: 'yes' | 'no') => {
    if (hasVoted) return;
    setLoading(true);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate, vote }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCounts();
        setHasVoted(true);
      } else {
        alert(data.error || 'Vote failed');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = Object.values(counts).reduce(
    (acc, curr) => acc + curr.yes + curr.no,
    0
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-100 to-purple-200 p-8 dark:from-gray-900 dark:to-gray-800">
      <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">Votoni për kandidatin tuaj të preferuar</h1>
      <p className="mb-8 text-xl font-medium text-gray-700 dark:text-gray-300">
        Numri Total: <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalVotes}</span>
      </p>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        {candidates.map((c) => (
          <div key={c.name} className="relative flex flex-col items-center overflow-hidden rounded-xl bg-[#1b2437] border-[1px] border-[#2e3852] p-6 backdrop-blur-lg transition-shadow hover:shadow-xl">
            <Image src={c.img} alt={c.name} width={300} height={200} className="mb-4 rounded-md object-cover" />
            <h2 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-gray-200">{c.name}</h2>
            <div className="flex gap-4">
              <button disabled={hasVoted || loading} onClick={() => handleVote(c.name, 'yes')} className="rounded bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50">Yes</button>
              <button disabled={hasVoted || loading} onClick={() => handleVote(c.name, 'no')} className="rounded bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50">No</button>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-700 dark:text-gray-300">Yes: {counts[c.name]?.yes ?? 0} | No: {counts[c.name]?.no ?? 0}</p>
            </div>
          </div>
        ))}
      </div>
      {hasVoted && (
        <p className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-200">Thank you for voting! You may only vote once.</p>
      )}
    </div>
  );
}
