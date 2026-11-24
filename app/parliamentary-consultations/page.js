import { publicPageMetadata } from '@/lib/route-metadata';
import ParliamentaryConsultations from '@/components/civicQuestions/ParliamentaryConsultations';

export const generateMetadata = publicPageMetadata('consultations.title', 'consultations.intro', '/parliamentary-consultations');

export default function ParliamentaryConsultationsPage() {
  return <ParliamentaryConsultations />;
}
