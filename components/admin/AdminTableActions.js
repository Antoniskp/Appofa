'use client';

import { useState, useEffect } from 'react';

/**
 * Reusable action buttons for admin tables
 * @param {object} item - The item being acted upon
 * @param {function} onEdit - Edit handler
 * @param {function} onDelete - Delete handler
 */
export default function AdminTableActions({ item, onEdit, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!confirmingDelete) return;

    // Auto-cancel after 3 seconds
    const timeoutId = setTimeout(() => {
      setConfirmingDelete(false);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [confirmingDelete]);

  const handleDeleteClick = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    // Execute delete
    if (onDelete) {
      await onDelete(item);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-3">
      {onEdit && (
        <button
          onClick={() => onEdit(item)}
          className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
        >
          Edit
        </button>
      )}
      {onDelete && (
        <button
          onClick={handleDeleteClick}
          className={`font-medium transition-all ${
            confirmingDelete
              ? 'bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700'
              : 'text-red-600 hover:text-red-900'
          }`}
        >
          {confirmingDelete ? 'Confirm?' : 'Delete'}
        </button>
      )}
    </div>
  );
}
