'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { candidateRegistrationAPI } from '@/lib/api/candidateRegistrations';

export default function CandidateConsultationEditor({ registration, onSaved }) {
  const t = useTranslations('politicalWidget');
  const [plan, setPlan] = useState(registration.consultationCommitment || '');
  const [state, setState] = useState('');
  const save = async event => {
    event.preventDefault(); setState('savingPlan');
    try {
      const response = await candidateRegistrationAPI.update(registration.id, { consultationCommitment: plan });
      if (!response?.success) throw new Error('Save unavailable');
      setState('planSaved'); onSaved?.();
    } catch { setState('planError'); }
  };
  return <form onSubmit={save} className="mt-4 rounded-xl border border-brand-border p-4">
    <label htmlFor="candidate-consultation-edit" className="block text-sm font-semibold text-charcoal">{t('editPlan')}</label>
    <p id="candidate-consultation-note" className="mt-2 text-xs leading-relaxed text-gray-500">{t('reviewNote')}</p>
    <textarea id="candidate-consultation-edit" aria-describedby="candidate-consultation-note" value={plan} onChange={event => { setPlan(event.target.value); setState(''); }} maxLength={1500} rows={4} className="mt-3 w-full rounded-xl border border-brand-border p-3 text-sm" />
    <button type="submit" disabled={state === 'savingPlan'} className="mt-2 min-h-11 rounded-xl bg-charcoal px-4 text-sm font-semibold text-white disabled:opacity-50">{t(state === 'savingPlan' ? 'savingPlan' : 'savePlan')}</button>
    {state && state !== 'savingPlan' && <p role={state === 'planError' ? 'alert' : 'status'} className="mt-2 text-xs text-gray-600">{t(state)}</p>}
  </form>;
}
