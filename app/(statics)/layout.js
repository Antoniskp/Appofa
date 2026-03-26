import { StaticsSubNav } from '@/components/layout';

export default function StaticsLayout({ children }) {
  return (
    <>
      <StaticsSubNav />
      {children}
    </>
  );
}
