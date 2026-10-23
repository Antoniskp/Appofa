'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import { issueFollowAPI } from '@/lib/api/issueFollows';
import IssueFollowButton from '@/components/IssueFollowButton';

function FollowedIssues() {
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useAsyncData(() => issueFollowAPI.list(page), [page]);
  if (loading) return <p role="status">Φόρτωση θεμάτων…</p>;
  if (error) return <div role="alert"><p>Δεν ήταν δυνατή η φόρτωση.</p><button onClick={refetch} className="min-h-11 underline">Δοκίμασε ξανά</button></div>;
  return <>
    {!data?.data?.length && <p className="rounded-xl border bg-white p-6">Δεν υπάρχουν διαθέσιμα θέματα σε αυτή τη σελίδα. Άνοιξε μια <Link href="/suggestions" className="underline">πρόταση</Link> ή <Link href="/polls" className="underline">ψηφοφορία</Link> και επίλεξε «Ακολούθησε το θέμα».</p>}
    <div className="space-y-5">{data?.data?.map(item => <article key={`${item.entityType}-${item.id}`} className="rounded-xl border bg-white p-5">
      <h2 className="text-xl font-semibold"><Link href={`/${item.entityType === 'poll' ? 'polls' : 'suggestions'}/${item.id}`} className="text-teal-800 underline">{item.title}</Link></h2>
      <p className="my-3 text-sm text-gray-600">Τελευταία αλλαγή: <time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleDateString('el-GR')}</time></p>
      {item.progress?.note ? <p className="mb-4 whitespace-pre-wrap">{item.progress.note}</p> : <p className="mb-4 text-gray-600">{item.entityType === 'suggestion' ? 'Δεν έχει δημοσιευτεί ακόμη ενημέρωση προόδου.' : item.status === 'closed' || (item.deadline && new Date(item.deadline) <= new Date()) ? 'Η ψηφοφορία έχει λήξει. Άνοιξέ τη για τα διαθέσιμα αποτελέσματα.' : 'Η ψηφοφορία είναι ανοιχτή. Άνοιξέ τη για συμμετοχή και διαθέσιμα αποτελέσματα.'}</p>}
      <IssueFollowButton entityType={item.entityType} entityId={item.id} onChanged={refetch} />
    </article>)}</div>
    <nav aria-label="Σελίδες θεμάτων" className="mt-6 flex gap-4"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="min-h-11 disabled:opacity-40">Προηγούμενη</button><span className="py-3">{page} / {data?.pagination?.totalPages || 1}</span><button disabled={page >= (data?.pagination?.totalPages || 1)} onClick={() => setPage(page + 1)} className="min-h-11 disabled:opacity-40">Επόμενη</button></nav>
  </>;
}
export default function FollowingPage() {
  const { user, loading } = useAuth();
  return <main className="app-container max-w-3xl py-8"><h1 className="mb-3 text-3xl font-bold">Θέματα που ακολουθείς</h1><p className="mb-6 text-gray-600">Εδώ βρίσκεις τις τελευταίες ενημερώσεις των προτάσεων και τις ψηφοφορίες που επέλεξες.</p>{loading ? <p>Φόρτωση…</p> : user ? <FollowedIssues key={user.id} /> : <Link href="/login" className="underline">Συνδέσου για να δεις τα θέματά σου</Link>}</main>;
}
