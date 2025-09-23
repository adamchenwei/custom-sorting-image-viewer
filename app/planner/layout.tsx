import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monthly Rideshare Planner',
};

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
