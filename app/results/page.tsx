import { Suspense } from 'react';
import ResultsPageClient from './ResultsClient';

export default function ResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultsPageClient />
    </Suspense>
  );
}
