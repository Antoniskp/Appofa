'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Card from '@/components/Card';
import { useAsyncData } from '@/hooks/useAsyncData';
import { messageAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

function MessagesContent() {
  const { addToast } = useToast();
  const [filters, setFilters] = useState({
    type: '',
    status: '',
  });

  const { data: messagesData, loading, refetch } = useAsyncData(
    async () => {
      const response = await messageAPI.getAll(filters);
      if (response.success) {
        return response.data;
      }
      return { messages: [], pagination: {} };
    },
    [filters],
    { initialData: { messages: [], pagination: {} } }
  );

  const messages = messagesData.messages || [];

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await messageAPI.updateStatus(id, newStatus);
      addToast('Η κατάσταση ενημερώθηκε', { type: 'success' });
      refetch();
    } catch (err) {
      addToast(err.message || 'Σφάλμα κατά την ενημέρωση', { type: 'error' });
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      contact: 'Επικοινωνία',
      moderator_application: 'Αίτηση Moderator',
      general: 'Γενικό',
      bug_report: 'Αναφορά Bug',
      feature_request: 'Αίτημα Feature'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      contact: 'bg-blue-100 text-blue-800',
      moderator_application: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800',
      bug_report: 'bg-red-100 text-red-800',
      feature_request: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Μηνύματα & Αιτήσεις</h1>
          <p className="text-gray-600 mt-2">Διαχείριση μηνυμάτων επικοινωνίας και αιτήσεων moderator</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Τύπος</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">Όλοι οι τύποι</option>
                <option value="contact">Επικοινωνία</option>
                <option value="moderator_application">Αίτηση Moderator</option>
                <option value="general">Γενικό</option>
                <option value="bug_report">Αναφορά Bug</option>
                <option value="feature_request">Αίτημα Feature</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Κατάσταση</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">Όλες οι καταστάσεις</option>
                <option value="pending">Εκκρεμεί</option>
                <option value="read">Αναγνωσμένο</option>
                <option value="in_progress">Σε εξέλιξη</option>
                <option value="responded">Απαντήθηκε</option>
                <option value="archived">Αρχειοθετημένο</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Messages List */}
        <Card>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Φόρτωση...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Δεν βρέθηκαν μηνύματα</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{msg.subject}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(msg.type)}`}>
                          {getTypeLabel(msg.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Από: {msg.user ? `${msg.user.username} (${msg.user.email})` : `${msg.name} (${msg.email})`}
                        {' • '}
                        {new Date(msg.createdAt).toLocaleDateString('el-GR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <select
                        value={msg.status}
                        onChange={(e) => handleStatusChange(msg.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="pending">Εκκρεμεί</option>
                        <option value="read">Αναγνωσμένο</option>
                        <option value="in_progress">Σε εξέλιξη</option>
                        <option value="responded">Απαντήθηκε</option>
                        <option value="archived">Αρχειοθετημένο</option>
                      </select>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm line-clamp-2 mb-2">{msg.message}</p>
                  
                  {msg.location && (
                    <p className="text-xs text-indigo-600">
                      📍 Περιοχή: {msg.location.name}
                    </p>
                  )}
                  
                  {msg.response && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs font-semibold text-green-800 mb-1">Απάντηση:</p>
                      <p className="text-sm text-green-900">{msg.response}</p>
                      {msg.responder && (
                        <p className="text-xs text-green-700 mt-1">
                          από {msg.responder.username} • {new Date(msg.respondedAt).toLocaleDateString('el-GR')}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/admin/messages/${msg.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Προβολή λεπτομερειών →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pagination info */}
        {messagesData.pagination && messagesData.pagination.total > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Σύνολο: {messagesData.pagination.total} μηνύματα
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminMessagesPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <MessagesContent />
    </ProtectedRoute>
  );
}
