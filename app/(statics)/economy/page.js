import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import { getEconomyMetrics } from '@/lib/economyMetrics';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';
export const revalidate = 21600;

export const metadata = {
  title: 'Οικονομία - Απόφαση',
  description: 'Ζωντανοί δείκτες, απλές εξηγήσεις και σύγκριση της ελληνικής οικονομίας με την Ευρώπη.',
  openGraph: {
    title: 'Οικονομία - Απόφαση',
    description: 'Ζωντανοί δείκτες, απλές εξηγήσεις και σύγκριση της ελληνικής οικονομίας με την Ευρώπη.',
    url: `${SITE_URL}/economy`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Οικονομία - Απόφαση',
    description: 'Ζωντανοί δείκτες, απλές εξηγήσεις και σύγκριση της ελληνικής οικονομίας με την Ευρώπη.',
  },
  alternates: {
    canonical: `${SITE_URL}/economy`,
  },
};

function formatNumber(value) {
  return new Intl.NumberFormat('el-GR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatMetricValue(metric, value) {
  if (typeof value !== 'number') {
    return 'Δεν υπάρχει διαθέσιμο στοιχείο';
  }

  return `${formatNumber(value)}${metric.unit.startsWith('%') ? '' : ' '}${metric.unit}`;
}

function formatPeriod(period) {
  if (!period) {
    return '';
  }

  if (period.includes('-Q')) {
    const [year, quarter] = period.split('-Q');
    return `${quarter}ο τρίμηνο ${year}`;
  }

  const [year, month] = period.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat('el-GR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatUpdatedAt(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('el-GR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getDifferenceText(metric) {
  if (metric.difference === null || metric.difference === undefined) {
    return null;
  }

  if (metric.difference === 0) {
    return `Ίδιο επίπεδο με ${metric.comparisonLabel}.`;
  }

  const relation = metric.difference > 0 ? 'πάνω από' : 'κάτω από';
  return `${formatNumber(Math.abs(metric.difference))} μονάδες ${relation} ${metric.comparisonLabel}.`;
}

function getReading(metric) {
  if (metric.difference === null || metric.difference === undefined) {
    return 'Η σύγκριση θα εμφανιστεί μόλις δοθούν διαθέσιμα ευρωπαϊκά στοιχεία για την ίδια περίοδο.';
  }

  const isFavorable =
    (metric.direction === 'lower' && metric.difference < 0) ||
    (metric.direction === 'higher' && metric.difference > 0);

  if (metric.id === 'gdp-growth') {
    if (metric.primary.value > 0) {
      return isFavorable
        ? 'Η οικονομία μεγάλωσε και κινήθηκε ταχύτερα από το ευρωπαϊκό σημείο αναφοράς.'
        : 'Η οικονομία μεγάλωσε, αλλά πιο αργά από το ευρωπαϊκό σημείο αναφοράς.';
    }

    return 'Η οικονομική δραστηριότητα υποχώρησε στο τελευταίο διαθέσιμο τρίμηνο.';
  }

  return isFavorable
    ? 'Για τον πολίτη, αυτό σημαίνει καλύτερη εικόνα από τον ευρωπαϊκό μέσο όρο σε αυτόν τον δείκτη.'
    : 'Για τον πολίτη, αυτό σημαίνει μεγαλύτερη πίεση από τον ευρωπαϊκό μέσο όρο σε αυτόν τον δείκτη.';
}

function MetricTrend({ metric }) {
  const values = metric.series.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <div className="flex h-14 items-end gap-1" aria-hidden="true">
      {metric.series.map((point) => {
        const height = 22 + ((point.value - min) / range) * 34;

        return (
          <span
            key={point.period}
            className="block w-full rounded-t-sm bg-sky-500"
            style={{ height: `${height}px` }}
            title={`${formatPeriod(point.period)}: ${formatNumber(point.value)}%`}
          />
        );
      })}
    </div>
  );
}

function MetricCard({ metric }) {
  if (metric.unavailable) {
    return (
      <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-950">{metric.label}</h3>
            <p className="mt-1 text-sm text-gray-600">{metric.explainer}</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Προσωρινά μη διαθέσιμο</span>
        </div>
        <p className="mt-5 text-sm text-gray-700">
          Δεν μπορέσαμε να φορτώσουμε τα ζωντανά στοιχεία από τη Eurostat. Η σελίδα θα ξαναδοκιμάσει αυτόματα στο επόμενο refresh.
        </p>
      </article>
    );
  }

  const updatedAt = formatUpdatedAt(metric.updatedAt);
  const statusLabel = metric.primary.status === 'e' ? 'εκτίμηση' : metric.primary.status === 'p' ? 'προσωρινό' : null;

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-950">{metric.label}</h3>
          <p className="mt-1 text-sm text-gray-600">{metric.explainer}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Live Eurostat</span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-sm font-medium text-gray-500">{metric.valueLabel}</p>
          <p className="mt-1 text-4xl font-bold tracking-normal text-gray-950">{formatMetricValue(metric, metric.primary.value)}</p>
          <p className="mt-1 text-sm text-gray-500">
            {formatPeriod(metric.primary.period)}
            {statusLabel ? `, ${statusLabel}` : ''}
          </p>
        </div>
        {metric.comparison ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left sm:text-right">
            <p className="text-xs font-medium uppercase text-gray-500">{metric.comparisonLabel}</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{formatMetricValue(metric, metric.comparison.value)}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        <MetricTrend metric={metric} />
        <p className="mt-2 text-xs text-gray-500">Τελευταίες διαθέσιμες περίοδοι για την Ελλάδα</p>
      </div>

      <div className="mt-5 space-y-2 border-t border-gray-100 pt-4">
        <p className="text-sm font-semibold text-gray-900">{getDifferenceText(metric)}</p>
        <p className="text-sm text-gray-700">{getReading(metric)}</p>
        <p className="text-xs text-gray-500">
          Πηγή:{' '}
          <a href={metric.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 hover:underline">
            {metric.sourceName}
          </a>
          {updatedAt ? `, ενημέρωση ${updatedAt}` : ''}
        </p>
      </div>
    </article>
  );
}

export default async function EconomyPage() {
  const metrics = await getEconomyMetrics();

  return (
    <StaticPageLayout title="Οικονομία" maxWidth="max-w-5xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η οικονομία δεν χρειάζεται να είναι μια σειρά από δύσκολους όρους. Παρακάτω θα βρεις τους βασικούς δείκτες
          για την Ελλάδα, σε σύγκριση με την Ευρώπη, με απλή εξήγηση για το τι σημαίνουν στην καθημερινότητα.
        </p>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl font-semibold">Ζωντανή εικόνα</h2>
            <p className="mt-1 text-sm text-gray-600">
              Τα στοιχεία αντλούνται από τη Eurostat και ανανεώνονται περιοδικά από την εφαρμογή.
            </p>
          </div>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800">
            Ελλάδα vs Ευρώπη
          </span>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Πώς να διαβάζεις τους αριθμούς</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="text-base font-semibold text-gray-950">Η κατεύθυνση έχει σημασία</h3>
            <p className="mt-2 text-sm text-gray-700">
              Σε δείκτες όπως ανεργία, πληθωρισμός και χρέος, χαμηλότερη τιμή συνήθως σημαίνει λιγότερη πίεση. Στην ανάπτυξη ΑΕΠ,
              υψηλότερη τιμή δείχνει ταχύτερη αύξηση της παραγωγής.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="text-base font-semibold text-gray-950">Η περίοδος δεν είναι πάντα ίδια</h3>
            <p className="mt-2 text-sm text-gray-700">
              Ο πληθωρισμός και η ανεργία δημοσιεύονται μηνιαία. Το ΑΕΠ και το δημόσιο χρέος δημοσιεύονται ανά τρίμηνο, άρα ενημερώνονται
              πιο αργά.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="text-base font-semibold text-gray-950">Η σύγκριση είναι οδηγός</h3>
            <p className="mt-2 text-sm text-gray-700">
              Η διαφορά από την ΕΕ ή την Ευρωζώνη βοηθά να δούμε αν η Ελλάδα κινείται μαζί με την υπόλοιπη Ευρώπη ή αντιμετωπίζει
              πιο έντονη πίεση.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Τι επηρεάζει τον πολίτη</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-sky-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Κόστος ζωής</h3>
            <p className="text-gray-700 text-sm">
              Όταν ο πληθωρισμός μένει υψηλός, οι μισθοί χρειάζονται μεγαλύτερη αύξηση απλώς για να διατηρηθεί η ίδια αγοραστική δύναμη.
            </p>
          </div>

          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Δουλειές και εισόδημα</h3>
            <p className="text-gray-700 text-sm">
              Η ανεργία δείχνει πόσο δύσκολο είναι να βρει κανείς εργασία. Η ανάπτυξη ΑΕΠ δείχνει αν υπάρχει περισσότερη οικονομική
              δραστηριότητα για επιχειρήσεις και εργαζόμενους.
            </p>
          </div>

          <div className="border-l-4 border-amber-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Χώρος για δημόσιες πολιτικές</h3>
            <p className="text-gray-700 text-sm">
              Το δημόσιο χρέος δεν λέει μόνο του όλη την ιστορία, αλλά επηρεάζει το κόστος δανεισμού και τον χώρο για νέες δαπάνες ή
              φορολογικές ελαφρύνσεις.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Σημείωση για τα στοιχεία</h2>
        <p className="text-gray-700 text-sm">
          Οι δείκτες είναι επίσημα στατιστικά στοιχεία, όχι πρόβλεψη. Οι τιμές μπορεί να αναθεωρηθούν από τη Eurostat ή τις εθνικές
          στατιστικές αρχές, ειδικά όταν σημειώνονται ως προσωρινές ή εκτιμήσεις.
        </p>
      </section>
    </StaticPageLayout>
  );
}
