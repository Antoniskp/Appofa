import PositionsPanel from '@/components/positions/PositionsPanel';
import { publicPageMetadata } from '@/lib/route-metadata';

export const generateMetadata = publicPageMetadata('positions.heading', 'positions.description', '/positions');

export default function PositionsPage() {
  return <div className="min-h-screen bg-gray-50 py-8"><div className="app-container"><PositionsPanel standalone /></div></div>;
}
