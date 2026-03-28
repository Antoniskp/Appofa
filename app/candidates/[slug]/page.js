'use client';
import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CandidateRedirectPage({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  useEffect(() => { router.replace(`/persons/${slug}`); }, [slug]);
  return null;
}
