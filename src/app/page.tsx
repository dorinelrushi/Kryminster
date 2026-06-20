"use client";
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

export default function Home() {
  const [counts, setCounts] = useState({ yes: 0, no: 0 });
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);

  const QUESTION = "A duhet të kthehen të gjithë emigrantët shqiptarë në Shqipëri?";

  const fetchCounts = async () => {
    try {
      const res = await fetch('/api/vote');
      const data = await res.json();
      if (data.success) {
        let yesCount = 0;
        let noCount = 0;
        Object.entries(data.counts).forEach(([key, value]) => {
          const [candidate, vote] = key.split('|');
          if (candidate === QUESTION) {
            if (vote === 'yes') yesCount = Number(value);
            if (vote === 'no') noCount = Number(value);
          }
        });
        setCounts({ yes: yesCount, no: noCount });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/comments');
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCounts();
    fetchComments();
    
    // Polling for real-time updates
    const interval = setInterval(() => {
      fetchCounts();
      fetchComments();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleVote = async (vote: 'yes' | 'no') => {
    if (hasVoted) return;
    setLoading(true);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate: QUESTION, vote }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCounts();
        setHasVoted(true);
      } else {
        alert(data.error || 'Votimi dështoi');
      }
    } catch (e) {
      console.error(e);
      alert('Gabim në rrjet');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommenting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText }),
      });
      const data = await res.json();
      if (data.success) {
        setCommentText("");
        await fetchComments();
      } else {
        alert(data.error || 'Dërgimi i komentit dështoi');
      }
    } catch (e) {
      console.error(e);
      alert('Gabim në rrjet');
    } finally {
      setCommenting(false);
    }
  };

  const totalVotes = counts.yes + counts.no;

  return (
    <div className="flex min-h-screen flex-col items-center py-12 px-4 bg-gradient-to-b from-red-900 to-black font-sans text-gray-100">
      
      <div className="w-full max-w-3xl flex flex-col items-center">
        <h1 className="mb-4 text-center text-4xl md:text-5xl font-extrabold text-white tracking-wide uppercase drop-shadow-lg">
          Votimi Kombëtar
        </h1>
        <span className="mb-8">
          <Link className='text-red-400 hover:text-red-300 transition-colors underline decoration-red-400 font-semibold' href='https://www.youtube.com/watch?v=s0BaVjhbNB4' target="_blank">
            Rama Ik - Rama Ik - Muzikë Shqiptare
          </Link>
        </span>

        {/* Voting Section */}
        <div className="w-full relative flex flex-col items-center overflow-hidden rounded-2xl bg-black/60 border-2 border-red-600 p-8 backdrop-blur-md shadow-[0_0_20px_rgba(220,38,38,0.4)] mb-12">
          
          <h2 className="mb-8 text-3xl md:text-4xl font-bold text-center text-white leading-tight">
            {QUESTION}
          </h2>
          
          <div className="flex gap-6 w-full justify-center">
            <button 
              disabled={hasVoted || loading} 
              onClick={() => handleVote('yes')} 
              className="flex-1 max-w-[200px] rounded-xl bg-red-600 px-6 py-4 text-2xl font-bold text-white transition-all hover:bg-red-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-red-900/50"
            >
              Po
            </button>
            <button 
              disabled={hasVoted || loading} 
              onClick={() => handleVote('no')} 
              className="flex-1 max-w-[200px] rounded-xl bg-gray-800 px-6 py-4 text-2xl font-bold text-white border border-gray-600 transition-all hover:bg-gray-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-black/50"
            >
              Jo
            </button>
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-2">
             <p className="text-xl font-medium text-gray-300">
               Numri Total i Votave: <span className="font-bold text-red-500">{totalVotes}</span>
             </p>
             <div className="flex gap-8 text-lg font-semibold text-gray-200 bg-black/50 px-6 py-3 rounded-lg border border-red-900/50">
               <span className="text-red-500">Po: {counts.yes}</span>
               <span className="text-gray-400">Jo: {counts.no}</span>
             </div>
          </div>

          {hasVoted && (
            <p className="mt-6 text-lg font-medium text-red-400 bg-red-950/40 px-4 py-2 rounded-lg border border-red-900">
              Faleminderit për votën tuaj! (Mund të votoni vetëm një herë)
            </p>
          )}
        </div>

        {/* Comment Section */}
        <div className="w-full flex flex-col rounded-2xl bg-black/60 border border-gray-800 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-2xl font-bold text-white border-b border-red-900/50 pb-2">
            Komentoni mendimin tuaj
          </h3>
          
          <form onSubmit={handleCommentSubmit} className="mb-6 flex flex-col gap-3">
            <textarea
              className="w-full rounded-xl bg-gray-900 border border-gray-700 p-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none min-h-[100px]"
              placeholder="Shkruani komentin tuaj këtu (Anonim)..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={commenting}
            />
            <button 
              type="submit" 
              disabled={commenting || !commentText.trim()}
              className="self-end rounded-lg bg-red-600 px-6 py-2 font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              Dërgo Komentin
            </button>
          </form>

          <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {comments.length === 0 ? (
              <p className="text-gray-500 italic text-center py-4">Nuk ka ende komente. Bëhuni i pari!</p>
            ) : (
              comments.map((c: any, i) => (
                <div key={c._id || i} className="rounded-lg bg-gray-900/80 border border-gray-800 p-4 shadow-sm break-words">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center text-red-500 font-bold border border-red-800">
                      A
                    </div>
                    <span className="font-semibold text-gray-300">Anonim</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(c.createdAt).toLocaleDateString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-200 ml-10 whitespace-pre-wrap">{c.text}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      
      {/* Add some global styles for custom scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(220, 38, 38, 0.4);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(220, 38, 38, 0.6);
        }
      `}} />
    </div>
  );
}
