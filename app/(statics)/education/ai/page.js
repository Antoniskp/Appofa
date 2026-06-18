import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Τεχνητή Νοημοσύνη (AI) — Δωρεάν Εργαλεία & Λύσεις | Απόφαση',
  description:
    'Δωρεάν εργαλεία AI για γραφή, έρευνα, κώδικα, εικόνες, μετάφραση και μάθηση — συν πρακτικοί οδηγοί για κάθε χρήση.',
  openGraph: {
    title: 'Τεχνητή Νοημοσύνη (AI) — Δωρεάν Εργαλεία & Λύσεις | Απόφαση',
    description:
      'Δωρεάν εργαλεία AI για γραφή, έρευνα, κώδικα, εικόνες, μετάφραση και μάθηση — συν πρακτικοί οδηγοί για κάθε χρήση.',
    url: `${SITE_URL}/education/ai`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Τεχνητή Νοημοσύνη (AI) — Δωρεάν Εργαλεία & Λύσεις | Απόφαση',
    description:
      'Δωρεάν εργαλεία AI για γραφή, έρευνα, κώδικα, εικόνες, μετάφραση και μάθηση — συν πρακτικοί οδηγοί για κάθε χρήση.',
  },
  alternates: {
    canonical: `${SITE_URL}/education/ai`,
  },
};

/* ─── Category data ─── */

const FREE_WRITING_TOOLS = [
  { emoji: '✍️', name: 'ChatGPT (free tier)', desc: 'Γραφή κειμένων, emails, περιλήψεων και ιδεών.', href: 'https://chat.openai.com/' },
  { emoji: '🤖', name: 'Claude (free tier)', desc: 'Ανάλυση κειμένου, γραφή δοκιμίων, brainstorming.', href: 'https://claude.ai/' },
  { emoji: '💎', name: 'Gemini (Google, free)', desc: 'Συνεργατική γραφή με σύνδεση στο Google Docs.', href: 'https://gemini.google.com/' },
  { emoji: '🌐', name: 'Copilot (Microsoft, free)', desc: 'Αναζήτηση + γραφή απευθείας στον browser.', href: 'https://copilot.microsoft.com/' },
  { emoji: '📝', name: 'Notion AI (free για νέους χρήστες)', desc: 'Σύνθεση σημειώσεων και βελτίωση κειμένου.', href: 'https://www.notion.so/product/ai' },
];

const FREE_RESEARCH_TOOLS = [
  { emoji: '🔬', name: 'Perplexity AI (free)', desc: 'Έξυπνη αναζήτηση με αναφορές σε πηγές.', href: 'https://www.perplexity.ai/' },
  { emoji: '📚', name: 'Consensus (free tier)', desc: 'Αναζήτηση επιστημονικών papers με AI περίληψη.', href: 'https://consensus.app/' },
  { emoji: '🧠', name: 'Elicit (free)', desc: 'Εξαγωγή δεδομένων από ακαδημαϊκά άρθρα.', href: 'https://elicit.com/' },
  { emoji: '🗂️', name: 'Connected Papers (free)', desc: 'Χάρτης σχέσεων μεταξύ ερευνητικών εργασιών.', href: 'https://www.connectedpapers.com/' },
  { emoji: '📖', name: 'Open Alex (free)', desc: 'Βάση ανοιχτής πρόσβασης για ακαδημαϊκά έργα.', href: 'https://openalex.org/' },
];

const FREE_CODING_TOOLS = [
  { emoji: '💻', name: 'GitHub Copilot (δωρεάν για φοιτητές)', desc: 'Αυτόματη συμπλήρωση κώδικα στον editor σου.', href: 'https://github.com/features/copilot' },
  { emoji: '🛠️', name: 'Google Colab (δωρεάν)', desc: 'Jupyter notebooks με GPU/TPU στο cloud.', href: 'https://colab.research.google.com/' },
  { emoji: '🤗', name: 'Hugging Face (δωρεάν tier)', desc: 'Δοκιμή χιλιάδων AI μοντέλων δωρεάν.', href: 'https://huggingface.co/' },
  { emoji: '🌊', name: 'Replit (δωρεάν tier)', desc: 'Online coding περιβάλλον με AI βοηθό.', href: 'https://replit.com/' },
  { emoji: '⚡', name: 'Codeium (δωρεάν)', desc: 'AI autocomplete για 70+ γλώσσες προγραμματισμού.', href: 'https://codeium.com/' },
];

const FREE_IMAGE_TOOLS = [
  { emoji: '🎨', name: 'Adobe Firefly (δωρεάν credits)', desc: 'Δημιουργία εικόνων από κείμενο, ασφαλές για εμπορική χρήση.', href: 'https://www.adobe.com/products/firefly.html' },
  { emoji: '🖼️', name: 'Stable Diffusion (open source)', desc: 'Τοπικό ή web-based image generation εντελώς δωρεάν.', href: 'https://stability.ai/' },
  { emoji: '✂️', name: 'Remove.bg (5 δωρεάν/μήνα)', desc: 'Αφαίρεση background από εικόνες με ένα κλικ.', href: 'https://www.remove.bg/' },
  { emoji: '🎭', name: 'Canva AI (δωρεάν tier)', desc: 'Δημιουργία γραφικών και παρουσιάσεων με AI.', href: 'https://www.canva.com/' },
  { emoji: '🌄', name: 'Bing Image Creator (δωρεάν)', desc: 'Δωρεάν εικόνες από κείμενο μέσω DALL-E.', href: 'https://www.bing.com/images/create' },
];

const FREE_TRANSLATION_TOOLS = [
  { emoji: '🗣️', name: 'DeepL (δωρεάν tier)', desc: 'Υψηλής ποιότητας μετάφραση για 31 γλώσσες.', href: 'https://www.deepl.com/' },
  { emoji: '🌍', name: 'Google Translate (δωρεάν)', desc: 'Γρήγορη μετάφραση κειμένου, εγγράφων και εικόνων.', href: 'https://translate.google.com/' },
  { emoji: '📄', name: 'DeepL Document (δωρεάν)', desc: 'Ανέβασε έγγραφο Word/PDF και πάρε άμεσα μετάφραση.', href: 'https://www.deepl.com/translator' },
  { emoji: '🔤', name: 'LibreTranslate (open source)', desc: 'Self-hosted μετάφραση, χωρίς αποστολή δεδομένων.', href: 'https://libretranslate.com/' },
];

const FREE_AUDIO_TOOLS = [
  { emoji: '🎙️', name: 'Whisper (OpenAI, open source)', desc: 'Αναγνώριση ομιλίας και μεταγραφή σε 100 γλώσσες.', href: 'https://openai.com/research/whisper' },
  { emoji: '🎵', name: 'ElevenLabs (δωρεάν tier)', desc: '10 000 χαρακτήρες/μήνα text-to-speech δωρεάν.', href: 'https://elevenlabs.io/' },
  { emoji: '📝', name: 'Otter.ai (δωρεάν 300 min/μήνα)', desc: 'Αυτόματη μεταγραφή συναντήσεων και σημειώσεων.', href: 'https://otter.ai/' },
  { emoji: '🎤', name: 'Whisper.cpp (open source)', desc: 'Offline μεταγραφή στον υπολογιστή σου.', href: 'https://github.com/ggerganov/whisper.cpp' },
];

const FREE_LEARNING_TOOLS = [
  { emoji: '🌟', name: 'Khan Academy (Khanmigo, δωρεάν)', desc: 'AI δάσκαλος για μαθηματικά, επιστήμες και ιστορία.', href: 'https://www.khanacademy.org/' },
  { emoji: '📊', name: 'Coursera (δωρεάν audit)', desc: 'Παρακολούθηση δωρεάν μαθημάτων χωρίς πιστοποιητικό.', href: 'https://www.coursera.org/' },
  { emoji: '🏫', name: 'edX (δωρεάν audit)', desc: 'Μαθήματα από MIT, Harvard και άλλα πανεπιστήμια.', href: 'https://www.edx.org/' },
  { emoji: '🌐', name: 'MIT OpenCourseWare (δωρεάν)', desc: 'Πλήρες εκπαιδευτικό υλικό ΜΙΤ, ελεύθερα διαθέσιμο.', href: 'https://ocw.mit.edu/' },
  { emoji: '🎮', name: 'Duolingo (δωρεάν)', desc: 'Εκμάθηση ξένων γλωσσών με AI-powered προσαρμογή.', href: 'https://www.duolingo.com/' },
];

const FREE_PRODUCTIVITY_TOOLS = [
  { emoji: '🗓️', name: 'Notion (δωρεάν tier)', desc: 'Σημειώσεις, tasks και wiki με ενσωματωμένο AI.', href: 'https://www.notion.so/' },
  { emoji: '🔍', name: 'ChatPDF (δωρεάν tier)', desc: 'Ανέβασε PDF και κάνε ερωτήσεις στο περιεχόμενό του.', href: 'https://www.chatpdf.com/' },
  { emoji: '📋', name: 'Gamma (δωρεάν tier)', desc: 'Δημιουργία παρουσιάσεων και reports από κείμενο.', href: 'https://gamma.app/' },
  { emoji: '⏱️', name: 'Reclaim.ai (δωρεάν tier)', desc: 'AI scheduler που οργανώνει αυτόματα τη μέρα σου.', href: 'https://reclaim.ai/' },
];

const FREE_ACCESSIBILITY_TOOLS = [
  { emoji: '👁️', name: 'Be My AI (δωρεάν)', desc: 'Περιγραφή εικόνων για άτομα με προβλήματα όρασης.', href: 'https://www.bemyeyes.com/' },
  { emoji: '📢', name: 'Natural Reader (δωρεάν tier)', desc: 'Text-to-speech για εύκολη ανάγνωση περιεχομένου.', href: 'https://www.naturalreaders.com/' },
  { emoji: '🎯', name: 'Speechify (δωρεάν tier)', desc: 'Ανάγνωση άρθρων, PDF και βιβλίων δυνατά.', href: 'https://speechify.com/' },
  { emoji: '🌈', name: 'Grammarly (δωρεάν tier)', desc: 'Ορθογραφικός/γραμματικός έλεγχος και βελτίωση ύφους.', href: 'https://www.grammarly.com/' },
];

/* ─── Practical solution guides ─── */

const PRACTICAL_GUIDES = [
  {
    emoji: '🎓',
    title: 'Σπουδές & Επανάληψη',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'text-blue-700',
    steps: [
      'Άνοιξε το ChatGPT ή το Claude (δωρεάν tier).',
      'Γράψε: «Εξήγησέ μου [θέμα] σαν να είμαι μαθητής γυμνασίου.»',
      'Ζήτα flash-cards: «Φτιάξε 10 ερωτήσεις πολλαπλής επιλογής για [θέμα].»',
      'Για βαθύτερη κατανόηση: «Δώσε μου αναλογία από την καθημερινή ζωή.»',
      'Αποθήκευσε τις απαντήσεις στο Notion ή σε ένα Google Doc.',
    ],
  },
  {
    emoji: '📄',
    title: 'Περίληψη Κειμένου / PDF',
    color: 'bg-green-50 border-green-200',
    headerColor: 'text-green-700',
    steps: [
      'Για PDF: Ανέβασε το αρχείο στο ChatPDF.com (δωρεάν).',
      'Γράψε: «Δώσε μου περίληψη 5 σημείων.»',
      'Εναλλακτικά: Αντέγραψε κείμενο στο Perplexity ή Claude.',
      'Για επιστημονικά άρθρα: Χρησιμοποίησε Consensus ή Elicit.',
      'Αποθήκευσε την περίληψη ως σημείωση για μελλοντική αναφορά.',
    ],
  },
  {
    emoji: '🌍',
    title: 'Εκμάθηση Ξένης Γλώσσας',
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'text-yellow-700',
    steps: [
      'Ξεκίνα με Duolingo για καθημερινή πρακτική (δωρεάν).',
      'Χρησιμοποίησε DeepL για ακριβείς μεταφράσεις κειμένων.',
      'Εξάσκησε συνομιλία με ChatGPT: «Μίλα μου μόνο στα αγγλικά/ισπανικά.»',
      'Ζήτα διόρθωση: «Διόρθωσε τη φράση μου και εξήγησε το λάθος.»',
      'Ακου podcasts + μεταγραφή με Otter.ai για ακουστική εξάσκηση.',
    ],
  },
  {
    emoji: '📝',
    title: 'Σύνταξη Βιογραφικού (CV)',
    color: 'bg-purple-50 border-purple-200',
    headerColor: 'text-purple-700',
    steps: [
      'Γράψε στο ChatGPT τη δουλειά που αναζητάς και την εμπειρία σου.',
      'Prompt: «Βοήθησέ με να γράψω επαγγελματικό βιογραφικό για [θέση].»',
      'Ζήτα βελτιώσεις: «Κάνε το πιο επαγγελματικό» ή «Πρόσθεσε action verbs.»',
      'Για cover letter: «Γράψε motivation letter για [εταιρεία] βασισμένο στο CV μου.»',
      'Χρησιμοποίησε Grammarly (δωρεάν) για τελικό έλεγχο γλώσσας.',
    ],
  },
  {
    emoji: '🏫',
    title: 'Προετοιμασία Μαθήματος (για Εκπαιδευτικούς)',
    color: 'bg-orange-50 border-orange-200',
    headerColor: 'text-orange-700',
    steps: [
      'Prompt: «Φτιάξε πλάνο 45λεπτου μαθήματος για [θέμα] σε μαθητές [ηλικία].»',
      'Ζήτα δραστηριότητες: «Πρόσθεσε 2 ομαδικές δραστηριότητες 10 λεπτών.»',
      'Δημιούργησε quiz: «Φτιάξε 5 ερωτήσεις αξιολόγησης.»',
      'Φτιάξε παρουσίαση με Gamma.app (δωρεάν) από τη σύνοψη.',
      'Εκτύπωσε ή μοιράσου ψηφιακά — χωρίς κόστος.',
    ],
  },
  {
    emoji: '🔎',
    title: 'Έρευνα & Εργασία',
    color: 'bg-teal-50 border-teal-200',
    headerColor: 'text-teal-700',
    steps: [
      'Αναζήτα με Perplexity.ai για πηγές που μπορείς να επαληθεύσεις.',
      'Βρες ακαδημαϊκές πηγές με Consensus.app ή Elicit.',
      'Ανέβασε PDF εργασιών στο ChatPDF για γρήγορη ανάλυση.',
      'Prompt: «Γράψε εισαγωγή 200 λέξεων για εργασία με θέμα [X].»',
      'Πάντα επαλήθευε τις πηγές — το AI μπορεί να κάνει λάθη.',
    ],
  },
];

/* ─── Reusable components ─── */

function ToolCard({ emoji, name, desc, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
    >
      <span className="text-2xl flex-shrink-0" aria-hidden="true">{emoji}</span>
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm leading-snug">{name}</p>
        <p className="text-gray-500 text-xs mt-0.5 leading-snug">{desc}</p>
      </div>
    </a>
  );
}

function CategorySection({ emoji, title, bgColor, borderColor, textColor, tools }) {
  return (
    <section aria-labelledby={`section-${title.replace(/\s/g, '-')}`}>
      <div className={`${bgColor} ${borderColor} border rounded-2xl p-5`}>
        <h2
          id={`section-${title.replace(/\s/g, '-')}`}
          className={`text-xl font-bold mb-4 flex items-center gap-2 ${textColor}`}
        >
          <span aria-hidden="true">{emoji}</span> {title}
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {tools.map((t) => (
            <ToolCard key={t.name} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function GuideCard({ emoji, title, color, headerColor, steps }) {
  return (
    <div className={`${color} border rounded-2xl p-5`}>
      <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${headerColor}`}>
        <span aria-hidden="true">{emoji}</span> {title}
      </h3>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white border border-current flex items-center justify-center text-xs font-bold">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function EducationAIPage() {
  return (
    <StaticPageLayout
      title="🤖 Τεχνητή Νοημοσύνη (AI) — Δωρεάν Εργαλεία & Λύσεις"
      maxWidth="max-w-5xl"
      breadcrumb={
        <Link href="/education" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Εκπαίδευση
        </Link>
      }
    >
      {/* Hero intro */}
      <section className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6 space-y-3">
        <p className="text-lg text-gray-800 leading-relaxed font-medium">
          Η τεχνητή νοημοσύνη δεν είναι πλέον πολυτέλεια — τα καλύτερα εργαλεία προσφέρουν ισχυρές
          δωρεάν επιλογές για μάθηση, δημιουργία και παραγωγικότητα. Εδώ θα βρεις{' '}
          <strong>δωρεάν εργαλεία ανά κατηγορία</strong> και{' '}
          <strong>πρακτικούς οδηγούς</strong> για να τα χρησιμοποιείς αποτελεσματικά.
        </p>
        <p className="text-sm text-gray-500">Τελευταία ενημέρωση: Ιούνιος 2026 · Κανένα εργαλείο δεν απαιτεί πληρωμή για βασική χρήση</p>
      </section>

      {/* Tool categories */}
      <div className="space-y-6">
        <CategorySection
          emoji="✍️"
          title="Γραφή & Δημιουργία Κειμένου"
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
          textColor="text-blue-800"
          tools={FREE_WRITING_TOOLS}
        />

        <CategorySection
          emoji="🔬"
          title="Έρευνα & Αναζήτηση Πληροφοριών"
          bgColor="bg-green-50"
          borderColor="border-green-200"
          textColor="text-green-800"
          tools={FREE_RESEARCH_TOOLS}
        />

        <CategorySection
          emoji="💻"
          title="Κώδικας & Ανάπτυξη"
          bgColor="bg-cyan-50"
          borderColor="border-cyan-200"
          textColor="text-cyan-800"
          tools={FREE_CODING_TOOLS}
        />

        <CategorySection
          emoji="🎨"
          title="Εικόνες & Γραφικά"
          bgColor="bg-pink-50"
          borderColor="border-pink-200"
          textColor="text-pink-800"
          tools={FREE_IMAGE_TOOLS}
        />

        <CategorySection
          emoji="🌍"
          title="Μετάφραση & Γλώσσες"
          bgColor="bg-yellow-50"
          borderColor="border-yellow-200"
          textColor="text-yellow-800"
          tools={FREE_TRANSLATION_TOOLS}
        />

        <CategorySection
          emoji="🎙️"
          title="Ήχος, Φωνή & Μεταγραφή"
          bgColor="bg-orange-50"
          borderColor="border-orange-200"
          textColor="text-orange-800"
          tools={FREE_AUDIO_TOOLS}
        />

        <CategorySection
          emoji="🎓"
          title="Μάθηση & Εκπαίδευση"
          bgColor="bg-purple-50"
          borderColor="border-purple-200"
          textColor="text-purple-800"
          tools={FREE_LEARNING_TOOLS}
        />

        <CategorySection
          emoji="⚡"
          title="Παραγωγικότητα & Οργάνωση"
          bgColor="bg-teal-50"
          borderColor="border-teal-200"
          textColor="text-teal-800"
          tools={FREE_PRODUCTIVITY_TOOLS}
        />

        <CategorySection
          emoji="♿"
          title="Προσβασιμότητα"
          bgColor="bg-rose-50"
          borderColor="border-rose-200"
          textColor="text-rose-800"
          tools={FREE_ACCESSIBILITY_TOOLS}
        />
      </div>

      {/* Practical guides */}
      <section aria-labelledby="practical-guides-heading">
        <h2 id="practical-guides-heading" className="text-2xl font-bold mb-5 flex items-center gap-2">
          <span aria-hidden="true">🛠️</span> Πρακτικοί Οδηγοί Βήμα-Βήμα
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {PRACTICAL_GUIDES.map((g) => (
            <GuideCard key={g.title} {...g} />
          ))}
        </div>
      </section>

      {/* Tips section */}
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
        <h2 className="text-xl font-bold text-amber-800 flex items-center gap-2">
          <span aria-hidden="true">💡</span> Χρήσιμες Συμβουλές
        </h2>
        <ul className="space-y-2">
          {[
            'Πάντα επαλήθευε τις πληροφορίες που δίνει το AI από αξιόπιστες πηγές.',
            'Τα δωρεάν tiers είναι αρκετά για τις περισσότερες καθημερινές ανάγκες.',
            'Ο συνδυασμός εργαλείων δίνει καλύτερα αποτελέσματα (π.χ. Perplexity + ChatPDF).',
            'Μην βάζεις προσωπικά δεδομένα σε AI chatbots χωρίς να διαβάσεις τους όρους χρήσης.',
            'Για πιο αξιόπιστα αποτελέσματα, δώσε πλαίσιο στις ερωτήσεις σου (context).',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-amber-500 font-bold flex-shrink-0">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Global models reference */}
      <section aria-labelledby="global-models-heading" className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
        <h2 id="global-models-heading" className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span aria-hidden="true">🌐</span> Μεγάλα Μοντέλα Αναφοράς
        </h2>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          {[
            { name: 'OpenAI GPT-4o', href: 'https://openai.com/', badge: 'Γραφή / Ανάλυση' },
            { name: 'Google Gemini', href: 'https://gemini.google.com/', badge: 'Multimodal' },
            { name: 'Anthropic Claude', href: 'https://claude.ai/', badge: 'Μεγάλα κείμενα' },
            { name: 'Meta Llama (ανοιχτό)', href: 'https://ai.meta.com/llama/', badge: 'Open Source' },
            { name: 'Mistral (ανοιχτό)', href: 'https://mistral.ai/', badge: 'Open Source' },
            { name: 'Hugging Face Hub', href: 'https://huggingface.co/', badge: '400 000+ μοντέλα' },
          ].map((m) => (
            <a
              key={m.name}
              href={m.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-1 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow transition-all"
            >
              <span className="font-semibold text-gray-800">{m.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5 self-start">{m.badge}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Greek ecosystem */}
      <section aria-labelledby="greek-ai-heading" className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
        <h2 id="greek-ai-heading" className="text-xl font-bold text-indigo-800 mb-3 flex items-center gap-2">
          <span aria-hidden="true">🇬🇷</span> Ελληνικό Οικοσύστημα AI
        </h2>
        <div className="space-y-2 text-sm">
          {[
            { name: 'ΕΚ "Αθηνά" – έρευνα σε AI, δεδομένα και ψηφιακές τεχνολογίες', href: 'https://www.athenarc.gr/' },
            { name: 'FORTH (ΙΤΕ) – έρευνα AI / υπολογιστικά συστήματα', href: 'https://www.forth.gr/' },
            { name: 'ΕΜΠ – Σχολές & εργαστήρια ML/AI', href: 'https://www.ntua.gr/' },
            { name: 'ΑΠΘ – Ερευνητικές δράσεις NLP/AI', href: 'https://www.auth.gr/' },
            { name: 'Archipelago AI – ελληνική κοινότητα AI', href: 'https://www.archipelago.gr/' },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-lg bg-white border border-indigo-100 hover:border-indigo-300 text-indigo-700 hover:text-indigo-900 transition-colors"
            >
              {item.name}
            </a>
          ))}
        </div>
      </section>
    </StaticPageLayout>
  );
}
