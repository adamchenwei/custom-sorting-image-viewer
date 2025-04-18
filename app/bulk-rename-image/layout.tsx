import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Custom Sorting Image Viewer - Bulk Rename Images',
  description: 'Bulk rename your images using AI assistance',
};

export default function BulkRenameImageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
