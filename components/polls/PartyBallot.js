import PollOptionLogo from './PollOptionLogo';

const OTHER_CHOICES = new Set(['Άλλο κόμμα', 'Δεν έχω αποφασίσει', 'Λευκό / Άκυρο', 'Αποχή']);

export default function PartyBallot({ poll, selectedOptionId, onSelect, disabled }) {
  const groups = [
    ['Κόμματα', poll.options.filter(option => !OTHER_CHOICES.has(option.text))],
    ['Άλλες επιλογές', poll.options.filter(option => OTHER_CHOICES.has(option.text))],
  ];
  return <div className="space-y-6">{groups.map(([title, options]) => (
    <fieldset key={title} disabled={disabled}>
      <legend className="mb-3 text-sm font-semibold text-gray-600">{title}</legend>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{options.map(option => (
        <label key={option.id} className={`flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${selectedOptionId === option.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
          <input type="radio" name="poll-option" value={option.id} checked={selectedOptionId === option.id} onChange={() => onSelect(option.id)} className="h-4 w-4 shrink-0 accent-blue-600" />
          <PollOptionLogo poll={poll} option={option} />
          <span className="min-w-0 text-sm font-semibold text-gray-900">{option.text}</span>
        </label>
      ))}</div>
    </fieldset>
  ))}</div>;
}
