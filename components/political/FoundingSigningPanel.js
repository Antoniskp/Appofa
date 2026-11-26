'use client';

import { useState } from 'react';
import FoundingInterestForm from './FoundingInterestForm';
import FoundingSignatureProgress from './FoundingSignatureProgress';

export default function FoundingSigningPanel({ children }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshProgress = () => setRefreshKey(key => key + 1);

  return (
    <div className="mt-4 grid items-start gap-6 lg:grid-cols-2">
      <FoundingInterestForm onInterestChange={refreshProgress} />
      <div className="space-y-5">
        <FoundingSignatureProgress refreshKey={refreshKey} onInterestChange={refreshProgress} headingLevel={3} />
        {children}
      </div>
    </div>
  );
}
