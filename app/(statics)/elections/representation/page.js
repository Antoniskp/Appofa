import Link from 'next/link';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';
const title = 'Ευρωβουλευτές & Βουλευτές Επικρατείας';
const description = 'Πόσους ευρωβουλευτές εκλέγει η Ελλάδα, πότε ψηφίζουμε, πώς λειτουργεί το ψηφοδέλτιο Επικρατείας και πώς αναδεικνύονται άλλα δημόσια αξιώματα.';

export const metadata = {
  title: title,
  description,
  openGraph: { title, description, url: `${SITE_URL}/elections/representation`, type: 'website' },
  twitter: { card: 'summary', title, description },
  alternates: { canonical: `${SITE_URL}/elections/representation` },
};

const sources = {
  voting: { href: 'https://elections.europa.eu/el/how-to-vote/gr/', label: 'Ευρωπαϊκό Κοινοβούλιο: πώς ψηφίζουμε στην Ελλάδα' },
  elections: { href: 'https://elections.europa.eu/el/how-elections-work/', label: 'Ευρωπαϊκό Κοινοβούλιο: πώς λειτουργούν οι ευρωεκλογές' },
  seats: { href: 'https://www.europarl.europa.eu/topics/en/article/20180126STO94114/2024-2029-european-parliament-how-many-meps-per-country', label: 'Ευρωπαϊκό Κοινοβούλιο: έδρες ανά χώρα, 2024–2029' },
  powers: { href: 'https://european-union.europa.eu/institutions-law-budget/institutions-and-bodies/search-all-eu-institutions-and-bodies/european-parliament_el', label: 'Ευρωπαϊκή Ένωση: αποστολή και αρμοδιότητες του Κοινοβουλίου' },
  circular: { href: 'https://www.ypes.gr/wp-content/uploads/2024/05/eggr43270-egk30-20240524.pdf', label: 'Υπουργείο Εσωτερικών: εγκύκλιος ευρωεκλογών 2024 και εκλογική νομοθεσία (PDF)' },
  parliament: { href: 'https://www.hellenicparliament.gr/Enimerosi/Sychnes-Erotiseis/', label: 'Βουλή των Ελλήνων: συχνές ερωτήσεις' },
  lists: { href: 'https://www.ypes.gr/odigos-askisis-tou-eklogikou-dikaiomatos-mesa-apo-20-erotiseis-apantiseis/', label: 'Υπουργείο Εσωτερικών: οδηγός βουλευτικών εκλογών Ιουνίου 2023' },
  diaspora: { href: 'https://www.hellenicparliament.gr/Nomothetiko-Ergo/Anazitisi-Nomothetikou-Ergou?law_id=85916BEB-F136-4905-9D69-B3F301618148', label: 'Βουλή των Ελλήνων: ν. 5285/2026 για τον Απόδημο Ελληνισμό' },
  commencement: { href: 'https://www.hellenicparliament.gr/UserFiles/bcc26661-143b-4f2d-8916-0e0e66ba4c50/13228587.pdf#page=6', label: 'Βουλή των Ελλήνων: ψηφισμένο κείμενο, άρθρα 4 και 12 (PDF)' },
  constitution: { href: 'https://www.hellenicparliament.gr/Vouli-ton-Ellinon/To-Politevma/Syntagma/', label: 'Βουλή των Ελλήνων: Σύνταγμα, άρθρα 30, 32, 37, 51–55 και 81' },
};

function SourceLink({ source }) {
  return <a href={source.href} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline underline-offset-2 hover:text-blue-900">{source.label}</a>;
}

const comparison = [
  ['Ευρωβουλευτές', '21 από την Ελλάδα, την περίοδο 2024–2029', 'Ευρωπαϊκό Κοινοβούλιο', 'Κόμμα και έως 4 σταυροί', '5 χρόνια'],
  ['Βουλευτές εκλογικών περιφερειών', '285 έδρες στις εκλογές του 2023', 'Βουλή των Ελλήνων', 'Κόμμα και συνήθως σταυροί· σε ορισμένες εκλογές λίστα', 'Έως 4 χρόνια'],
  ['Βουλευτές Επικρατείας', '15 έδρες στις εκλογές του 2023', 'Βουλή των Ελλήνων', 'Ψήφος στο κόμμα, χωρίς σταυρό στη λίστα Επικρατείας', 'Ίδια θητεία με την υπόλοιπη Βουλή'],
];

export default function RepresentationPage() {
  return (
    <StaticPageLayout
      title={title}
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
      breadcrumb={<Link href="/elections" className="text-gray-500 hover:text-blue-600 transition-colors">← Εκλογές &amp; Πολιτική</Link>}
    >
      <div className="space-y-4">
        <p className="text-lg text-gray-700 leading-relaxed">
          Ποιον εκπροσωπεί κάθε βουλευτής και τι επιλέγουμε στην κάλπη; Ένας οδηγός για
          την ευρωπαϊκή και την εθνική εκπροσώπηση, τις κομματικές λίστες και άλλα δημόσια αξιώματα.
        </p>
        <p className="text-sm text-gray-500">Τελευταίος έλεγχος πηγών: <time dateTime="2026-11-15">15 Νοεμβρίου 2026</time>.</p>
        <div className="grid gap-3 sm:grid-cols-3" aria-label="Η εκπροσώπηση με αριθμούς">
          {[
            ['21', 'ευρωβουλευτές από την Ελλάδα', 'Περίοδος 2024–2029'],
            ['5 χρόνια', 'μεταξύ ευρωεκλογών', 'Επόμενες: το 2029'],
            ['15 από 300', 'βουλευτές Επικρατείας', 'Κατανομή εκλογών 2023'],
          ].map(([value, label, note]) => (
            <div key={label} className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-2xl font-semibold text-blue-900">{value}</p>
              <p className="mt-1 font-medium text-gray-800">{label}</p>
              <p className="mt-1 text-sm text-gray-600">{note}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="space-y-4">
        <h2 id="eurovouleftes" className="text-2xl font-semibold">Ευρωβουλευτές: πόσοι είναι και τι κάνουν;</h2>
        <p>
          Οι ευρωβουλευτές εκπροσωπούν τους πολίτες στο <strong>Ευρωπαϊκό Κοινοβούλιο</strong>.
          Για τη θητεία <strong>2024–2029</strong>, η Ελλάδα εκλέγει <strong>21</strong> από τα
          συνολικά <strong>720 μέλη</strong>. Οι έδρες ανά χώρα καθορίζονται σε ευρωπαϊκό επίπεδο
          και μπορούν να αλλάξουν σε επόμενη θητεία.
        </p>
        <p>
          Το Κοινοβούλιο συνδιαμορφώνει την ευρωπαϊκή νομοθεσία και τον προϋπολογισμό με
          το Συμβούλιο της ΕΕ. Ελέγχει την Ευρωπαϊκή Επιτροπή, εκλέγει τον πρόεδρό της και
          εγκρίνει την Επιτροπή ως σώμα. Οι ευρωβουλευτές εργάζονται σε επιτροπές και
          πολιτικές ομάδες που συγκροτούνται με βάση τις πολιτικές τους θέσεις.
        </p>
        <p className="text-sm"><SourceLink source={sources.seats} /> · <SourceLink source={sources.powers} /></p>
      </section>

      <section className="space-y-4">
        <h2 id="euroekloges" className="text-2xl font-semibold">Πότε και πώς εκλέγονται;</h2>
        <p>
          Οι ευρωεκλογές γίνονται <strong>κάθε πέντε χρόνια</strong>. Στην Ελλάδα, η τελευταία
          ψηφοφορία έγινε στις <strong>9 Ιουνίου 2024</strong>. Οι επόμενες ευρωεκλογές
          προβλέπονται για το <strong>2029</strong>· η ακριβής ημέρα θα οριστεί επίσημα.
        </p>
        <ol className="list-decimal space-y-3 pl-6">
          <li><strong>Μία περιφέρεια για όλη τη χώρα.</strong> Οι ψηφοφόροι επιλέγουν από τα ίδια ψηφοδέλτια σε όλη την Ελλάδα.</li>
          <li><strong>Ένα κόμμα και έως τέσσερις σταυροί.</strong> Επιλέγουμε ένα ψηφοδέλτιο και μπορούμε να σημειώσουμε έως 4 υποψηφίους του. Η σειρά εκτύπωσης των ονομάτων δεν καθορίζει ποιος εκλέγεται.</li>
          <li><strong>Αναλογική κατανομή και όριο 3%.</strong> Για να συμμετάσχει στην κατανομή εδρών, ένας συνδυασμός χρειάζεται τουλάχιστον 3% των έγκυρων ψήφων πανελλαδικά. Από κάθε συνδυασμό εκλέγονται οι υποψήφιοι με τους περισσότερους σταυρούς, μέχρι να καλυφθούν οι έδρες του.</li>
        </ol>
        <p>
          Δικαίωμα ψήφου στην Ελλάδα έχουν οι Έλληνες πολίτες από το έτος που συμπληρώνουν
          τα 17, εφόσον είναι εγγεγραμμένοι στους εκλογικούς καταλόγους. Πολίτες άλλων χωρών
          της ΕΕ που κατοικούν στην Ελλάδα μπορούν επίσης να ψηφίσουν εδώ, με τις προβλεπόμενες
          προϋποθέσεις εγγραφής. Κάθε πολίτης ψηφίζει <strong>μόνο μία φορά</strong> στις ίδιες ευρωεκλογές.
        </p>
        <p>
          Το 2024 υπήρχε και δυνατότητα επιστολικής ψήφου, μετά από αίτηση.
          Για τις προθεσμίες και τη διαδικασία της επόμενης αναμέτρησης χρειάζονται οι νέες
          οδηγίες του Υπουργείου Εσωτερικών.
        </p>
        <p className="text-sm"><SourceLink source={sources.elections} /> · <SourceLink source={sources.voting} /></p>
      </section>

      <section className="space-y-4">
        <h2 id="epikrateias" className="text-2xl font-semibold">Τι σημαίνει «βουλευτής Επικρατείας»;</h2>
        <p>
          «Επικράτεια» σημαίνει ολόκληρη τη χώρα. Οι βουλευτές Επικρατείας εκλέγονται με
          βάση την πανελλαδική εκλογική δύναμη των κομμάτων, σε προκαθορισμένη κομματική λίστα.
          Είναι μέλη της <strong>Βουλής των Ελλήνων</strong>, με τις ίδιες αρμοδιότητες με τους
          υπόλοιπους βουλευτές.
        </p>
        <p>
          Στις βουλευτικές εκλογές του <strong>2023</strong>, από τις <strong>300 έδρες</strong>,
          οι <strong>285</strong> κατανεμήθηκαν στις εκλογικές περιφέρειες και οι <strong>15</strong> στο
          ψηφοδέλτιο Επικρατείας. Οι 15 περιλαμβάνονται στις 300· δεν προστίθενται σε αυτές.
        </p>
        <p>
          Το κόμμα καθορίζει τη σειρά των υποψηφίων Επικρατείας πριν από τις εκλογές.
          <strong> Δεν βάζουμε σταυρό και δεν ρίχνουμε δεύτερο ψηφοδέλτιο Επικρατείας.</strong>{' '}
          Η ψήφος μας στο κόμμα μετρά και για αυτή την κατανομή. Αν ένα κόμμα δικαιούται,
          για παράδειγμα, 3 έδρες Επικρατείας, εκλέγονται οι πρώτοι 3 της λίστας του.
        </p>
        <p>
          Η θητεία τους ακολουθεί τη βουλευτική περίοδο: κανονικά τέσσερα χρόνια, με
          δυνατότητα πρόωρων εκλογών. Η πανελλαδική εκλογή τους είναι διαφορετική από την
          εκλογή ευρωβουλευτών, παρότι και στις δύο περιπτώσεις η χώρα αντιμετωπίζεται ενιαία.
        </p>
        <p className="text-sm"><SourceLink source={sources.circular} /> · <SourceLink source={sources.parliament} /> · <SourceLink source={sources.constitution} /></p>
      </section>

      <section className="space-y-4">
        <h2 id="comparison" className="text-2xl font-semibold">Οι βασικές διαφορές με μια ματιά</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200" role="region" aria-label="Σύγκριση τρόπων εκλογής" tabIndex={0}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="p-4 text-left text-gray-600">Ευρωπαϊκή θητεία 2024–2029 και κατανομή ελληνικών βουλευτικών εκλογών 2023.</caption>
            <thead className="bg-gray-50">
              <tr>{['Κατηγορία', 'Πόσοι', 'Πού υπηρετούν', 'Τι επιλέγουμε', 'Θητεία'].map(label => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comparison.map(([label, ...cells]) => (
                <tr key={label}>
                  <th scope="row" className="px-4 py-4 font-semibold text-gray-900">{label}</th>
                  {cells.map((cell, index) => <td key={index} className="px-4 py-4 align-top text-gray-700">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-600">
          Οι σταυροί στις βουλευτικές εκλογές εξαρτώνται από την περιφέρεια. Στις εκλογές
          της 25ης Ιουνίου 2023 χρησιμοποιήθηκε λίστα και στις περιφέρειες, επειδή
          επρόκειτο για νέα αναμέτρηση μέσα στο προβλεπόμενο διάστημα από τις προηγούμενες.
          <br /><SourceLink source={sources.lists} />
        </p>
      </section>

      <section className="space-y-4">
        <h2 id="other-positions" className="text-2xl font-semibold">Υπάρχουν άλλες παρόμοιες θέσεις;</h2>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 space-y-3">
          <h3 className="text-lg font-semibold">Η νέα περιφέρεια Απόδημου Ελληνισμού</h3>
          <p>
            Ο <strong>ν. 5285/2026</strong> προβλέπει <strong>3 έδρες Απόδημου Ελληνισμού</strong> και
            μείωση των εδρών Επικρατείας από 15 σε <strong>12</strong>. Οι 285 έδρες των
            περιφερειών παραμένουν και το σύνολο εξακολουθεί να είναι 300.
          </p>
          <p>
            Η αλλαγή δεν μεταβάλλει αναδρομικά τη Βουλή που εξελέγη το 2023. Το άρθρο 12
            συνδέει την εφαρμογή της με την απαιτούμενη συνταγματική πλειοψηφία· διαφορετικά,
            προβλέπει εφαρμογή από τις μεθεπόμενες εκλογές και όχι πριν περάσουν 18 μήνες
            από τις επόμενες. Γι’ αυτό η νέα κατανομή πρέπει να διαβάζεται μαζί με τον χρόνο εφαρμογής της.
          </p>
          <p className="text-sm"><SourceLink source={sources.diaspora} /> · <SourceLink source={sources.commencement} /></p>
        </div>
        <p>Άλλα αξιώματα έχουν διαφορετικό τρόπο ανάδειξης:</p>
        <dl className="space-y-4">
          <div><dt className="font-semibold">Πρόεδρος της Δημοκρατίας</dt><dd className="mt-1">Εκλέγεται από τη Βουλή για πενταετή θητεία, με τη διαδικασία του άρθρου 32 του Συντάγματος.</dd></div>
          <div><dt className="font-semibold">Πρωθυπουργός</dt><dd className="mt-1">Διορίζεται από τον Πρόεδρο της Δημοκρατίας σύμφωνα με το άρθρο 37, ώστε να σχηματιστεί κυβέρνηση που απολαμβάνει την εμπιστοσύνη της Βουλής.</dd></div>
          <div><dt className="font-semibold">Υπουργοί και εξωκοινοβουλευτικοί υπουργοί</dt><dd className="mt-1">Διορίζονται από τον Πρόεδρο της Δημοκρατίας με πρόταση του Πρωθυπουργού. Ένας υπουργός μπορεί να μην έχει εκλεγεί βουλευτής· ο διορισμός του δεν του δίνει βουλευτική έδρα.</dd></div>
        </dl>
        <p className="text-sm"><SourceLink source={sources.constitution} /> · <SourceLink source={sources.parliament} /></p>
        <Link href="/citizen-help/government-positions" className="inline-block font-medium text-blue-700 hover:underline">Δείτε περισσότερα για τις κυβερνητικές θέσεις →</Link>
      </section>

      <section className="space-y-4 border-t border-gray-200 pt-6">
        <h2 id="sources" className="text-2xl font-semibold">Πηγές &amp; χρήσιμοι σύνδεσμοι</h2>
        <p className="text-sm text-gray-600">
          Οι αριθμοί συνοδεύονται από τη θητεία ή την εκλογική αναμέτρηση στην οποία αναφέρονται.
          Οι πρακτικές οδηγίες του ευρωπαϊκού οδηγού αφορούν το 2024. Για κάθε νέα εκλογή,
          ελέγχουμε τις επίσημες ανακοινώσεις για τυχόν αλλαγές και προθεσμίες.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          {Object.entries(sources).map(([key, source]) => <li key={key}><SourceLink source={source} /></li>)}
        </ul>
        <Link href="/elections/political-parties" className="inline-block font-medium text-blue-700 hover:underline">Γνωρίστε τα πολιτικά κόμματα →</Link>
      </section>
    </StaticPageLayout>
  );
}
