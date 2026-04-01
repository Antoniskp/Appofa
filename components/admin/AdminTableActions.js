'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/Modal';

/**
 * Reusable action buttons for admin tables
 * @param {object} item - The item being acted upon
 * @param {function} onEdit - Edit handler
 * @param {function} onDelete - Delete handler
 */
export default function AdminTableActions({ item, onEdit, onDelete }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleConfirmDelete = async () => {
    if (onDelete) {
      await onDelete(item);
    }
  };

  return (
    <>
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
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 hover:text-red-900 font-medium transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}
