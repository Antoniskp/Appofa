'use client';

export default function DreamTeamHero({ totalVotes = 0, totalFormations = 0, lastUpdated = null }) {
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('el-GR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-indigo-900 text-white mb-8">
      {/* Decorative background circles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5" />
      </div>

      <div className="relative z-10 px-8 py-10 md:py-14">
        <div className="flex items-center gap-3 mb-4">
          {/* Greek flag colors stripe */}
          <div className="flex flex-col gap-0.5" aria-hidden="true">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-1 w-8 rounded-full ${i % 2 === 0 ? 'bg-white' : 'bg-blue-400'}`}
              />
            ))}
          </div>
          <span className="text-blue-200 text-sm font-medium uppercase tracking-widest">
            Πολιτική Συμμετοχή
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">
          🏛️ Ιδανική Κυβέρνηση
        </h1>
        <p className="text-lg md:text-xl text-blue-100 mb-6 max-w-2xl">
          Ψηφίστε τους ανθρώπους που θέλετε σε κάθε θέση της κυβέρνησης και δείτε
          ποια ιδανική κυβέρνηση επιλέγει η κοινότητα.
        </p>

        <div className="flex flex-wrap gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center gap-3">
            <span className="text-2xl font-bold">{totalVotes.toLocaleString('el-GR')}</span>
            <span className="text-blue-100 text-sm">Συνολικές Ψήφοι</span>
          </div>
          {totalFormations > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center gap-3">
              <span className="text-2xl font-bold">{totalFormations.toLocaleString('el-GR')}</span>
              <span className="text-blue-100 text-sm">📋 Δημόσιες Συνθέσεις</span>
            </div>
          )}
          {formattedDate && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center gap-3">
              <span className="text-sm text-blue-100">
                Τελευταία ενημέρωση: <span className="font-semibold text-white">{formattedDate}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
