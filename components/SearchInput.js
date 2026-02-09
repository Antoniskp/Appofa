export default function SearchInput({
  id,
  name,
  label,
  value,
  onChange,
  onFocus,
  placeholder,
  loading = false,
  className = ''
}) {
  const inputId = id || name;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          placeholder={placeholder}
          className="w-full h-10 px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}
