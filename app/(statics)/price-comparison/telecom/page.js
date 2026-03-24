import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Σύγκριση Τιμών Τηλεπικοινωνιών - Απόφαση',
  description: 'Σύγκριση τιμών παρόχων τηλεπικοινωνιών στην Ελλάδα. Πακέτα κινητής, internet και σταθερής τηλεφωνίας για Cosmote, Vodafone, Nova, CYTA, INALAN και HCN.',
  openGraph: {
    title: 'Σύγκριση Τιμών Τηλεπικοινωνιών - Απόφαση',
    description: 'Σύγκριση τιμών παρόχων τηλεπικοινωνιών στην Ελλάδα. Πακέτα κινητής, internet και σταθερής τηλεφωνίας.',
    url: `${SITE_URL}/price-comparison/telecom`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Σύγκριση Τιμών Τηλεπικοινωνιών - Απόφαση',
    description: 'Σύγκριση τιμών παρόχων τηλεπικοινωνιών στην Ελλάδα.',
  },
  alternates: {
    canonical: `${SITE_URL}/price-comparison/telecom`,
  },
};

export default function TelecomPriceComparisonPage() {
  return (
    <StaticPageLayout
      title="Σύγκριση Τιμών Τηλεπικοινωνιών"
      maxWidth="max-w-5xl"
      breadcrumb={
        <span>
          <Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">Σελίδες</Link>
          {' → '}
          <Link href="/price-comparison" className="text-gray-500 hover:text-blue-600 transition-colors">Σύγκριση Τιμών</Link>
          {' → '}
          <span className="text-gray-700">Τηλεπικοινωνίες</span>
        </span>
      }
    >
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η ελληνική αγορά τηλεπικοινωνιών ανταγωνίζεται με τέσσερις μεγάλους παρόχους κινητής —
          Cosmote, Vodafone, Nova και CYTA — καθώς και εξειδικευμένους παρόχους internet όπως INALAN και HCN.
          Η σωστή επιλογή πακέτου κινητής, internet και σταθερής μπορεί να εξοικονομήσει δεκάδες ευρώ
          το μήνα για ένα νοικοκυριό.
        </p>
        <p className="mt-4 text-sm text-gray-500 italic">
          Τελευταία ενημέρωση: Μάρτιος 2026. Οι τιμές είναι ενδεικτικές και ενδέχεται να έχουν αλλάξει.
          Επαληθεύστε πάντα στον ιστότοπο του παρόχου πριν από οποιαδήποτε απόφαση.
        </p>
      </section>

      {/* Mobile Plans Table */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Σύγκριση Πακέτων Κινητής</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-indigo-700 text-white">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Πάροχος</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Πακέτο</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Data (GB)</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Λεπτά Ομιλίας</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Τιμή (€/μήνα)</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Σύμβαση</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Λεπτομέρειες</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Cosmote</td>
                <td className="px-4 py-3 text-gray-700">Smart S</td>
                <td className="px-4 py-3 text-gray-700">10 GB</td>
                <td className="px-4 py-3 text-gray-700">Απεριόριστα</td>
                <td className="px-4 py-3 font-semibold text-green-700">9,90</td>
                <td className="px-4 py-3 text-gray-700">24μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.cosmote.gr/consumer/services/mobile/prepaid-programs" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">cosmote.gr →</a>
                </td>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Cosmote</td>
                <td className="px-4 py-3 text-gray-700">Smart M</td>
                <td className="px-4 py-3 text-gray-700">30 GB</td>
                <td className="px-4 py-3 text-gray-700">Απεριόριστα</td>
                <td className="px-4 py-3 text-gray-700">14,90</td>
                <td className="px-4 py-3 text-gray-700">24μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.cosmote.gr/consumer/services/mobile/prepaid-programs" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">cosmote.gr →</a>
                </td>
              </tr>
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Vodafone</td>
                <td className="px-4 py-3 text-gray-700">Unlimited Lite</td>
                <td className="px-4 py-3 text-gray-700">15 GB</td>
                <td className="px-4 py-3 text-gray-700">Απεριόριστα</td>
                <td className="px-4 py-3 text-gray-700">12,90</td>
                <td className="px-4 py-3 text-gray-700">24μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.vodafone.gr/vodafone-gr/personal/mobile/tariffs/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">vodafone.gr →</a>
                </td>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Vodafone</td>
                <td className="px-4 py-3 text-gray-700">Unlimited Plus</td>
                <td className="px-4 py-3 text-gray-700">50 GB</td>
                <td className="px-4 py-3 text-gray-700">Απεριόριστα</td>
                <td className="px-4 py-3 text-gray-700">19,90</td>
                <td className="px-4 py-3 text-gray-700">24μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.vodafone.gr/vodafone-gr/personal/mobile/tariffs/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">vodafone.gr →</a>
                </td>
              </tr>
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Nova</td>
                <td className="px-4 py-3 text-gray-700">Nova Mobile S</td>
                <td className="px-4 py-3 text-gray-700">10 GB</td>
                <td className="px-4 py-3 text-gray-700">Απεριόριστα</td>
                <td className="px-4 py-3 text-gray-700">11,90</td>
                <td className="px-4 py-3 text-gray-700">24μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.nova.gr/kiniti/programmata/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">nova.gr →</a>
                </td>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Nova</td>
                <td className="px-4 py-3 text-gray-700">Nova Mobile M</td>
                <td className="px-4 py-3 text-gray-700">30 GB</td>
                <td className="px-4 py-3 text-gray-700">Απεριόριστα</td>
                <td className="px-4 py-3 text-gray-700">16,90</td>
                <td className="px-4 py-3 text-gray-700">24μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.nova.gr/kiniti/programmata/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">nova.gr →</a>
                </td>
              </tr>
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">CYTA</td>
                <td className="px-4 py-3 text-gray-700">CYTA Mobile Basic</td>
                <td className="px-4 py-3 text-gray-700">5 GB</td>
                <td className="px-4 py-3 text-gray-700">500</td>
                <td className="px-4 py-3 font-semibold text-green-700">7,90</td>
                <td className="px-4 py-3 text-gray-700">12μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.cyta.gr/kiniti/programmata" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">cyta.gr →</a>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">CYTA</td>
                <td className="px-4 py-3 text-gray-700">CYTA Mobile Plus</td>
                <td className="px-4 py-3 text-gray-700">20 GB</td>
                <td className="px-4 py-3 text-gray-700">Απεριόριστα</td>
                <td className="px-4 py-3 text-gray-700">13,90</td>
                <td className="px-4 py-3 text-gray-700">12μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.cyta.gr/kiniti/programmata" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">cyta.gr →</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          * Οι τιμές αφορούν συμβόλαια (postpaid) χωρίς συσκευή. Ο τελεστής 24μ σημαίνει δέσμευση
          24 μηνών. Επαληθεύστε τις τρέχουσες τιμές και τους όρους fair use στον ιστότοπο κάθε παρόχου.
        </p>
      </section>

      {/* Internet/Broadband Table */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Σύγκριση Πακέτων Internet</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-indigo-700 text-white">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Πάροχος</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Πακέτο</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Ταχύτητα</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Τιμή (€/μήνα)</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Τηλεφωνία</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Σύμβαση</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Λεπτομέρειες</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Cosmote</td>
                <td className="px-4 py-3 text-gray-700">Fiber 100</td>
                <td className="px-4 py-3 text-gray-700">100 Mbps</td>
                <td className="px-4 py-3 font-semibold text-green-700">19,90</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3 text-gray-700">24μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.cosmote.gr/consumer/services/internet/fiber" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">cosmote.gr →</a>
                </td>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Cosmote</td>
                <td className="px-4 py-3 text-gray-700">Fiber 1000</td>
                <td className="px-4 py-3 text-gray-700">1 Gbps</td>
                <td className="px-4 py-3 text-gray-700">34,90</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3 text-gray-700">24μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.cosmote.gr/consumer/services/internet/fiber" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">cosmote.gr →</a>
                </td>
              </tr>
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Cosmote</td>
                <td className="px-4 py-3 text-gray-700">VDSL 50</td>
                <td className="px-4 py-3 text-gray-700">50 Mbps</td>
                <td className="px-4 py-3 text-gray-700">17,90</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3 text-gray-700">24μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.cosmote.gr/consumer/services/internet/vdsl" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">cosmote.gr →</a>
                </td>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Vodafone</td>
                <td className="px-4 py-3 text-gray-700">Fiber 200</td>
                <td className="px-4 py-3 text-gray-700">200 Mbps</td>
                <td className="px-4 py-3 text-gray-700">24,90</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3 text-gray-700">24μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.vodafone.gr/vodafone-gr/personal/home/internet/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">vodafone.gr →</a>
                </td>
              </tr>
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Vodafone</td>
                <td className="px-4 py-3 text-gray-700">VDSL 50</td>
                <td className="px-4 py-3 text-gray-700">50 Mbps</td>
                <td className="px-4 py-3 text-gray-700">19,90</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3 text-gray-700">24μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.vodafone.gr/vodafone-gr/personal/home/internet/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">vodafone.gr →</a>
                </td>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Nova</td>
                <td className="px-4 py-3 text-gray-700">Nova Fiber 100</td>
                <td className="px-4 py-3 text-gray-700">100 Mbps</td>
                <td className="px-4 py-3 text-gray-700">21,90</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3 text-gray-700">24μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.nova.gr/internet/programmata/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">nova.gr →</a>
                </td>
              </tr>
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Nova</td>
                <td className="px-4 py-3 text-gray-700">Nova VDSL 50</td>
                <td className="px-4 py-3 text-gray-700">50 Mbps</td>
                <td className="px-4 py-3 text-gray-700">18,90</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3 text-gray-700">24μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.nova.gr/internet/programmata/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">nova.gr →</a>
                </td>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">INALAN</td>
                <td className="px-4 py-3 text-gray-700">Fiber 300</td>
                <td className="px-4 py-3 text-gray-700">300 Mbps</td>
                <td className="px-4 py-3 font-semibold text-green-700">18,00</td>
                <td className="px-4 py-3 text-gray-700">Όχι</td>
                <td className="px-4 py-3 text-gray-700">Χωρίς</td>
                <td className="px-4 py-3">
                  <a href="https://www.inalan.gr/programmata-internet" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">inalan.gr →</a>
                </td>
              </tr>
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">INALAN</td>
                <td className="px-4 py-3 text-gray-700">Fiber 1000</td>
                <td className="px-4 py-3 text-gray-700">1 Gbps</td>
                <td className="px-4 py-3 text-gray-700">28,00</td>
                <td className="px-4 py-3 text-gray-700">Όχι</td>
                <td className="px-4 py-3 text-gray-700">Χωρίς</td>
                <td className="px-4 py-3">
                  <a href="https://www.inalan.gr/programmata-internet" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">inalan.gr →</a>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">HCN</td>
                <td className="px-4 py-3 text-gray-700">HCN Fiber 200</td>
                <td className="px-4 py-3 text-gray-700">200 Mbps</td>
                <td className="px-4 py-3 text-gray-700">22,00</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3 text-gray-700">24μ</td>
                <td className="px-4 py-3">
                  <a href="https://www.hcn.gr/internet" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">hcn.gr →</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          * Η διαθεσιμότητα fiber εξαρτάται από την τοποθεσία σας. INALAN και HCN παρέχουν υπηρεσίες
          σε επιλεγμένες περιοχές. Ελέγξτε την κάλυψη στον ιστότοπο κάθε παρόχου. Οι τιμές δεν
          συμπεριλαμβάνουν ΦΠΑ 24%.
        </p>
      </section>

      {/* Bundle Packages Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Πακέτα Κινητής + Internet</h2>
        <p className="text-gray-700 mb-4">
          Οι τρεις μεγάλοι πάροχοι προσφέρουν συνδυαστικά πακέτα (bundle) κινητής και internet με
          έκπτωση σε σχέση με τις χωριστές συνδρομές.
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-indigo-700 text-white">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Πάροχος</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Πακέτο Bundle</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Internet</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Κινητή Data</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Τιμή (€/μήνα)</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Εξοικονόμηση</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Λεπτομέρειες</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Cosmote</td>
                <td className="px-4 py-3 text-gray-700">Fiber + Smart M</td>
                <td className="px-4 py-3 text-gray-700">100 Mbps</td>
                <td className="px-4 py-3 text-gray-700">30 GB</td>
                <td className="px-4 py-3 font-semibold text-green-700">29,80</td>
                <td className="px-4 py-3 text-gray-700">~5 €/μήνα</td>
                <td className="px-4 py-3">
                  <a href="https://www.cosmote.gr/consumer/services/bundles" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">cosmote.gr →</a>
                </td>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Vodafone</td>
                <td className="px-4 py-3 text-gray-700">Fiber + Unlimited Plus</td>
                <td className="px-4 py-3 text-gray-700">200 Mbps</td>
                <td className="px-4 py-3 text-gray-700">50 GB</td>
                <td className="px-4 py-3 text-gray-700">34,90</td>
                <td className="px-4 py-3 text-gray-700">~10 €/μήνα</td>
                <td className="px-4 py-3">
                  <a href="https://www.vodafone.gr/vodafone-gr/personal/bundles/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">vodafone.gr →</a>
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-medium text-gray-900">Nova</td>
                <td className="px-4 py-3 text-gray-700">Fiber + Mobile M</td>
                <td className="px-4 py-3 text-gray-700">100 Mbps</td>
                <td className="px-4 py-3 text-gray-700">30 GB</td>
                <td className="px-4 py-3 text-gray-700">31,90</td>
                <td className="px-4 py-3 text-gray-700">~7 €/μήνα</td>
                <td className="px-4 py-3">
                  <a href="https://www.nova.gr/paketa/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline whitespace-nowrap">nova.gr →</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          * Η εξοικονόμηση υπολογίζεται σε σχέση με τις ξεχωριστές συνδρομές. Οι τελικές τιμές
          εξαρτώνται από τα επιλεγμένα πακέτα και τις τρέχουσες προσφορές κάθε παρόχου.
        </p>
      </section>

      {/* Key Comparison Insights */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Ανάλυση & Σύγκριση Παρόχων</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            <strong>Κινητή τηλεφωνία — καλύτερη αξία:</strong> Η CYTA εμφανίζει τη χαμηλότερη τιμή
            εισόδου (από 7,90 €/μήνα) για βασικό πακέτο κινητής, ενώ η Cosmote προσφέρει ανταγωνιστική
            τιμή στα 9,90 € για 10 GB με απεριόριστα λεπτά. Vodafone και Nova έχουν ελαφρώς υψηλότερες
            τιμές αλλά συχνά προσφέρουν καλύτερες εισαγωγικές προσφορές για νέους συνδρομητές.
          </p>
          <p className="text-gray-700">
            <strong>Internet — fiber και ταχύτητα:</strong> Η Cosmote προσφέρει το φθηνότερο fiber 100 Mbps
            (19,90 €/μήνα με σταθερή). Η INALAN ξεχωρίζει για τις υψηλές ταχύτητες fiber χωρίς
            δέσμευση — ιδανική για χρήστες που δεν θέλουν σύμβαση. Η Vodafone προσφέρει fiber 200 Mbps
            σε ανταγωνιστική τιμή, αλλά η κάλυψη fiber ποικίλλει ανά περιοχή. HCN και INALAN είναι
            διαθέσιμα μόνο σε επιλεγμένες αστικές περιοχές.
          </p>
          <p className="text-gray-700">
            <strong>Bundle deals — πλεονεκτήματα συνδυασμού:</strong> Το Vodafone bundle αξίζει για
            χρήστες που θέλουν υψηλή ταχύτητα internet και μεγάλο πακέτο κινητής, με εξοικονόμηση
            ~10 €/μήνα. Το Cosmote bundle είναι ο πιο οικονομικός συνδυασμός για βασικές ανάγκες.
            Πάντα ελέγξτε τις τρέχουσες προσφορές, καθώς οι πάροχοι συχνά παρέχουν ειδικές τιμές
            εισαγωγής για τους πρώτους 12 μήνες.
          </p>
        </div>
      </section>

      {/* Tips Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Συμβουλές για Αλλαγή Παρόχου Τηλεπικοινωνιών</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Φορητότητα αριθμού (MNP)</h3>
            <p className="text-gray-700 text-sm">
              Μπορείτε να κρατήσετε τον αριθμό σας κινητής αλλάζοντας πάροχο — αυτό ονομάζεται
              φορητότητα αριθμού (Mobile Number Portability). Επικοινωνείτε με τον νέο πάροχο,
              παρέχετε τον αριθμό σας και τον κωδικό φορητότητας (που λαμβάνετε από τον τρέχοντα
              πάροχο), και η μεταφορά ολοκληρώνεται εντός 1 εργάσιμης ημέρας.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Ελέγξτε ποινές πρόωρης λύσης</h3>
            <p className="text-gray-700 text-sm">
              Αν βρίσκεστε σε δέσμευση (π.χ. 24μηνη σύμβαση), ελέγξτε το κόστος πρόωρης λύσης.
              Συνήθως αντιστοιχεί στα υπόλοιπα μηνιαία τέλη ή σε ένα σταθερό ποσό. Σε ορισμένες
              περιπτώσεις, ο νέος πάροχος καλύπτει το κόστος μεταφοράς ως προσφορά ευπρόσδεκτου.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Κάλυψη δικτύου και ποιότητα σύνδεσης</h3>
            <p className="text-gray-700 text-sm">
              Πριν αλλάξετε πάροχο κινητής, ελέγξτε τον χάρτη κάλυψης του νέου παρόχου για την
              περιοχή σας — ιδιαίτερα αν διαμένετε εκτός αστικού κέντρου. Για internet, ελέγξτε
              αν η διεύθυνσή σας καλύπτεται από fiber ή μόνο VDSL/ADSL, καθώς αυτό επηρεάζει
              σημαντικά τις διαθέσιμες ταχύτητες.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Κρυφές χρεώσεις και fair use</h3>
            <p className="text-gray-700 text-sm">
              Διαβάστε προσεκτικά τους όρους για όρια fair use, ιδιαίτερα σε πακέτα με "απεριόριστο"
              internet. Συχνά η ταχύτητα μειώνεται μετά από ένα όριο κατανάλωσης (throttling).
              Επίσης ελέγξτε χρεώσεις ρόμινγκ στο εξωτερικό αν ταξιδεύετε συχνά εντός ΕΕ.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Εισαγωγικές προσφορές — διαβάστε τα μικρά γράμματα</h3>
            <p className="text-gray-700 text-sm">
              Πολλοί πάροχοι προσφέρουν χαμηλή τιμή για τους πρώτους 6-12 μήνες. Βεβαιωθείτε ότι
              γνωρίζετε την τιμή μετά τη λήξη της προσφοράς και αν η σύμβαση ανανεώνεται αυτόματα
              με τη νέα τιμή. Σημειώστε την ημερομηνία λήξης της προσφοράς στο ημερολόγιό σας.
            </p>
          </div>
        </div>
      </section>

      {/* Useful Links */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Χρήσιμοι Σύνδεσμοι</h2>
        <ul className="space-y-3">
          <li>
            <a href="https://www.eett.gr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
              ΕΕΤΤ – Εθνική Επιτροπή Τηλεπικοινωνιών και Ταχυδρομείων
            </a>
            <span className="text-gray-600 text-sm"> — Ρυθμιστική αρχή τηλεπικοινωνιών. Καταγγελίες κατά παρόχων, στατιστικά αγοράς και νομοθεσία.</span>
          </li>
          <li>
            <a href="https://www.keyd.gov.gr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
              keyd.gov.gr – Κέντρο Εξυπηρέτησης Υποδομών Δικτύων
            </a>
            <span className="text-gray-600 text-sm"> — Πληροφορίες για τηλεπικοινωνιακές υποδομές, δίκτυα fiber και προγράμματα ψηφιακής ανάπτυξης.</span>
          </li>
          <li>
            <a href="https://www.synigoroskatanaloti.gr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
              Συνήγορος του Καταναλωτή
            </a>
            <span className="text-gray-600 text-sm"> — Για καταγγελίες και διαμεσολάβηση σε διαφορές με παρόχους τηλεπικοινωνιών.</span>
          </li>
          <li>
            <a href="https://www.ftthcouncil.eu/knowledge-centre/FTTHdashboard" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
              FTTH Council Europe – Fiber Coverage Maps
            </a>
            <span className="text-gray-600 text-sm"> — Χάρτες κάλυψης fiber οπτικής σε ευρωπαϊκό επίπεδο και στατιστικά για την Ελλάδα.</span>
          </li>
        </ul>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Ψήφισε & μοιράσου εμπειρίες κόστους τηλεπικοινωνιών</h2>
        <p className="text-gray-700 text-sm mb-4">
          Ποιον πάροχο χρησιμοποιείς για κινητή ή internet; Είσαι ικανοποιημένος με τις τιμές και
          την ποιότητα; Συμμετέχοντας στις ψηφοφορίες της κοινότητας, βοηθάς άλλους συνδρομητές
          να επιλέξουν τον καλύτερο πάροχο για τις ανάγκες τους.
        </p>
        <Link href="/polls" className="inline-block bg-indigo-600 text-white text-sm px-5 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Δες τις ψηφοφορίες →
        </Link>
      </section>
    </StaticPageLayout>
  );
}
