import PositionsPanel from '@/components/positions/PositionsPanel';

export const metadata = {
  title: 'Positions & proposals | Appofa',
  description: 'Compare sourced organization positions by topic and support or oppose individual proposals.',
};

export default function PositionsPage() {
  return <div className="min-h-screen bg-gray-50 py-8"><div className="app-container"><PositionsPanel standalone /></div></div>;
}
