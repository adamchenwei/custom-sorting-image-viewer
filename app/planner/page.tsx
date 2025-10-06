import { Suspense } from 'react';
import PlannerPageClient from './PlannerClient';

export default function PlannerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlannerPageClient />
    </Suspense>
  );
}
