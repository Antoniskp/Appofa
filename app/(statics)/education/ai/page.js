import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Τεχνητή Νοημοσύνη (AI) - Εκπαίδευση | Απόφαση',
  description:
    'Συνοπτικός οδηγός για σημαντικά μοντέλα και έργα τεχνητής νοημοσύνης παγκοσμίως και στην Ελλάδα.',
  openGraph: {
    title: 'Τεχνητή Νοημοσύνη (AI) - Εκπαίδευση | Απόφαση',
    description:
      'Συνοπτικός οδηγός για σημαντικά μοντέλα και έργα τεχνητής νοημοσύνης παγκοσμίως και στην Ελλάδα.',
    url: `${SITE_URL}/education/ai`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Τεχνητή Νοημοσύνη (AI) - Εκπαίδευση | Απόφαση',
    description:
      'Συνοπτικός οδηγός για σημαντικά μοντέλα και έργα τεχνητής νοημοσύνης παγκοσμίως και στην Ελλάδα.',
  },
  alternates: {
    canonical: `${SITE_URL}/education/ai`,
  },
};

const GLOBAL_LLM_PROJECTS = [
  { name: 'OpenAI – GPT / ChatGPT', href: 'https://openai.com/' },
  { name: 'Google DeepMind – Gemini', href: 'https://deepmind.google/technologies/gemini/' },
  { name: 'Anthropic – Claude', href: 'https://www.anthropic.com/claude' },
  { name: 'Meta AI – Llama', href: 'https://ai.meta.com/llama/' },
  { name: 'Mistral AI', href: 'https://mistral.ai/' },
  { name: 'Cohere', href: 'https://cohere.com/' },
  { name: 'AI at xAI – Grok', href: 'https://x.ai/' },
];

const MULTIMODAL_PROJECTS = [
  { name: 'Stability AI (Stable Diffusion)', href: 'https://stability.ai/' },
  { name: 'Midjourney', href: 'https://www.midjourney.com/' },
  { name: 'Runway', href: 'https://runwayml.com/' },
  { name: 'ElevenLabs (speech)', href: 'https://elevenlabs.io/' },
  { name: 'Open Source model hub (Hugging Face)', href: 'https://huggingface.co/' },
];

const OPEN_SOURCE_FOUNDATIONS = [
  { name: 'PyTorch', href: 'https://pytorch.org/' },
  { name: 'TensorFlow', href: 'https://www.tensorflow.org/' },
  { name: 'LangChain', href: 'https://www.langchain.com/' },
  { name: 'vLLM', href: 'https://vllm.ai/' },
  { name: 'ONNX', href: 'https://onnx.ai/' },
];

const GREEK_PROJECTS = [
  { name: 'Αρχιπέλαγος AI (κοινότητα/πρωτοβουλία για ελληνικό AI οικοσύστημα)', href: 'https://www.archipelago.gr/' },
  { name: 'ΕΚ "Αθηνά" (έρευνα σε AI, δεδομένα και ψηφιακές τεχνολογίες)', href: 'https://www.athenarc.gr/' },
  { name: 'ΕΜΠ – Σχολές/εργαστήρια με δράσεις σε ML/AI', href: 'https://www.ntua.gr/' },
  { name: 'ΑΠΘ – ερευνητικές δράσεις σε NLP/AI', href: 'https://www.auth.gr/' },
  { name: 'Πανεπιστήμιο Κρήτης & FORTH (ΙΤΕ) – έρευνα σε AI/υπολογιστικά συστήματα', href: 'https://www.forth.gr/' },
];

function LinkList({ items }) {
  return (
    <ul className="list-disc pl-6 space-y-2 text-gray-700">
      {items.map((item) => (
        <li key={item.name}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:text-blue-900 underline underline-offset-2"
          >
            {item.name}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function EducationAIPage() {
  return (
    <StaticPageLayout
      title="Τεχνητή Νοημοσύνη (AI)"
      maxWidth="max-w-4xl"
      breadcrumb={
        <Link href="/education" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Εκπαίδευση
        </Link>
      }
    >
      <section className="space-y-4">
        <p className="text-lg text-gray-700 leading-relaxed">
          Η τεχνητή νοημοσύνη εξελίσσεται ραγδαία και επηρεάζει την εκπαίδευση, την οικονομία,
          τη δημόσια διοίκηση και την καθημερινή ζωή. Η σελίδα αυτή λειτουργεί ως σύντομος
          οδηγός με αξιόπιστες αφετηρίες για περαιτέρω μελέτη.
        </p>
        <p className="text-sm text-gray-500">Τελευταία ενημέρωση: 18 Ιουνίου 2026</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Μεγάλα μοντέλα και έργα παγκοσμίως</h2>
        <p className="text-gray-700">
          Βασικοί οργανισμοί και οικοσυστήματα που καθορίζουν την εξέλιξη των γλωσσικών
          μοντέλων (LLMs) και των εφαρμογών παραγωγικής AI.
        </p>
        <LinkList items={GLOBAL_LLM_PROJECTS} />
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Πολυτροπικά έργα (εικόνα, ήχος, βίντεο)</h2>
        <p className="text-gray-700">
          Πλατφόρμες και μοντέλα που συνδυάζουν κείμενο, εικόνα, ήχο και βίντεο για δημιουργία
          περιεχομένου ή βοηθητικές εφαρμογές.
        </p>
        <LinkList items={MULTIMODAL_PROJECTS} />
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Open-source υποδομή και εργαλεία</h2>
        <p className="text-gray-700">
          Θεμελιώδη εργαλεία και frameworks που χρησιμοποιούνται ευρέως στην έρευνα και στην
          παραγωγή συστημάτων AI.
        </p>
        <LinkList items={OPEN_SOURCE_FOUNDATIONS} />
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Σημαντικές πρωτοβουλίες στην Ελλάδα</h2>
        <p className="text-gray-700">
          Ενδεικτικοί φορείς και κοινότητες με ενεργή παρουσία στην έρευνα, ανάπτυξη και διάχυση
          της τεχνητής νοημοσύνης στην Ελλάδα.
        </p>
        <LinkList items={GREEK_PROJECTS} />
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Πώς να αξιοποιήσεις αυτή τη σελίδα</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>Ξεκίνα από τα θεμελιώδη (LLMs, multimodal, open-source εργαλεία).</li>
          <li>Σύγκρινε προσεγγίσεις μεταξύ εμπορικών και ανοιχτών μοντέλων.</li>
          <li>Σύνδεσε τη διεθνή εικόνα με ελληνικές ερευνητικές/εκπαιδευτικές πρωτοβουλίες.</li>
        </ul>
      </section>
    </StaticPageLayout>
  );
}
