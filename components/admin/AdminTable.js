'use client';

import AdminTableActions from './AdminTableActions';
import SkeletonLoader from '@/components/SkeletonLoader';

/**
 * Reusable admin table component
 * @param {array} columns - Column definitions [{ key, header, render?, width? }]
 * @param {array} data - Array of data objects to display
 * @param {function} onEdit - Edit handler (item) => void
 * @param {function} onDelete - Delete handler (item) => void
 * @param {boolean} loading - Loading state
 * @param {string} emptyMessage - Message when no data
 * @param {string} keyField - Field to use as unique key (default: 'id')
 * @param {function} rowClassName - Function to get row classes (item) => string
 */
export default function AdminTable({
  columns = [],
  data = [],
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = 'No items found',
  keyField = 'id',
  rowClassName,
  actions = true,
}) {
  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.width || ''}`}
                  >
                    {column.header}
                  </th>
                ))}
                {actions && (onEdit || onDelete) && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <SkeletonLoader type="table" count={10} />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-8 text-center">
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.width || ''}`}
                >
                  {column.header}
                </th>
              ))}
              {actions && (onEdit || onDelete) && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr
                key={item[keyField]}
                className={rowClassName ? rowClassName(item) : 'hover:bg-gray-50'}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 text-sm text-gray-900 ${column.className || 'whitespace-nowrap'}`}
                  >
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
                {actions && (onEdit || onDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <AdminTableActions
                      item={item}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
