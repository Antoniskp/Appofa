import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import BenefitsGuide from '@/components/benefits/BenefitsGuide';

export const metadata = {
  title: 'Επιδόματα — δικαιούχοι, αιτήσεις & ημερολόγιο',
  description: 'Οδηγός επιδομάτων στην Ελλάδα: οικογένεια, ανεργία, στέγαση, αναπηρία, ηλικιωμένοι και σπουδές. Προϋποθέσεις, δικαιολογητικά και επίσημες προθεσμίες.',
  alternates: { canonical: '/citizen-help/benefits' },
};

export default function BenefitsPage() {
  return <StaticPageLayout title="Επιδόματα & κοινωνικές παροχές" maxWidth="max-w-5xl" showHelpfulLinks={false}
    breadcrumb={<><Link href="/citizen-help" className="hover:underline">Βοήθεια Πολίτη</Link><span aria-hidden="true"> / </span><span>Επιδόματα</span></>}>
    <BenefitsGuide />
  </StaticPageLayout>;
}
