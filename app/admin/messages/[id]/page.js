'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Card from '@/components/ui/Card';
import { useAsyncData } from '@/hooks/useAsyncData';
import { messageAPI } from '@/lib/api';

function MessageDetailContent() {
  const params = useParams();
  const messageId = params?.id;

  const { data: message, loading, error } = useAsyncData(
    async () => {
      if (!messageId) return null;
      const response = await messageAPI.getById(messageId);
      if (response.success) {
        return response.data?.message || null;
      }
      return null;
    },
    [messageId],
    { initialData: null }
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/admin/messages" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            ← Επιστροφή στα μηνύματα
          </Link>
          <h1 className="text-3xl font-bold mt-2">Λεπτομέρειες Μηνύματος</h1>
        </div>

        {loading && (
          <Card>
            <p className="text-gray-500">Φόρτωση...</p>
          </Card>
        )}

        {error && (
          <Card>
            <p className="text-red-600">Αποτυχία φόρτωσης μηνύματος.</p>
          </Card>
        )}

        {!loading && !error && !message && (
          <Card>
            <p className="text-gray-600">Το μήνυμα δεν βρέθηκε.</p>
          </Card>
        )}

        {!loading && !error && message && (
          <Card>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{message.subject}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(message.createdAt).toLocaleDateString('el-GR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Αποστολέας</h3>
                <p className="text-gray-900">
                  {message.user ? `${message.user.username} (${message.user.email})` : `${message.name} (${message.email})`}
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Μήνυμα</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{message.message}</p>
              </div>

              {message.adminNotes && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Admin Notes</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{message.adminNotes}</p>
                </div>
              )}

              {message.response && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-green-700 mb-1">Απάντηση</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{message.response}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function AdminMessageDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <MessageDetailContent />
    </ProtectedRoute>
  );
}
