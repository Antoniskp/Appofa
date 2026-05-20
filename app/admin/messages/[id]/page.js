'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Card from '@/components/ui/Card';
import { useAsyncData } from '@/hooks/useAsyncData';
import { messageAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import AdminLayout from '@/components/admin/AdminLayout';

function MessageDetailContent() {
  const params = useParams();
  const messageId = params?.id;
  const { addToast } = useToast();

  const [response, setResponse] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: message, loading, error, refetch } = useAsyncData(
    async () => {
      if (!messageId) return null;
      const response = await messageAPI.getById(messageId);
      if (response.success) {
        const msg = response.data?.message || null;
        if (msg) {
          setAdminNotes(msg.adminNotes || '');
          if (msg.response) setResponse(msg.response);
        }
        return msg;
      }
      return null;
    },
    [messageId],
    { initialData: null }
  );

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!response.trim()) {
      addToast('Η απάντηση είναι υποχρεωτική.', { type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await messageAPI.respond(messageId, {
        response: response.trim(),
        adminNotes: adminNotes.trim()
      });
      if (res.success) {
        addToast('Η απάντηση στάλθηκε επιτυχώς.', { type: 'success' });
        refetch();
      } else {
        throw new Error(res.message || 'Αποτυχία αποστολής απάντησης.');
      }
    } catch (err) {
      addToast(err.message, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await messageAPI.updateStatus(messageId, newStatus);
      if (res.success) {
        addToast('Η κατάσταση ενημερώθηκε.', { type: 'success' });
        refetch();
      } else {
        throw new Error(res.message || 'Αποτυχία ενημέρωσης κατάστασης.');
      }
    } catch (err) {
      addToast(err.message, { type: 'error' });
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

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <Link href="/admin/messages" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                ← Επιστροφή στα μηνύματα
              </Link>
              <h1 className="text-3xl font-bold mt-2">Λεπτομέρειες Μηνύματος</h1>
            </div>
            {message && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Κατάσταση:</span>
                <select
                  value={message.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="pending">Εκκρεμεί</option>
                  <option value="read">Αναγνωσμένο</option>
                  <option value="in_progress">Σε εξέλιξη</option>
                  <option value="responded">Απαντήθηκε</option>
                  <option value="archived">Αρχειοθετημένο</option>
                </select>
              </div>
            )}
          </div>

          {loading && (
            <Card>
              <p className="text-gray-500 text-center py-12">Φόρτωση...</p>
            </Card>
          )}

          {error && (
            <Card>
              <p className="text-red-600 text-center py-12">Αποτυχία φόρτωσης μηνύματος.</p>
            </Card>
          )}

          {!loading && !error && !message && (
            <Card>
              <p className="text-gray-600 text-center py-12">Το μήνυμα δεν βρέθηκε.</p>
            </Card>
          )}

          {!loading && !error && message && (
            <div className="space-y-6">
              <Card>
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-bold text-gray-900">{message.subject}</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {getTypeLabel(message.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Υποβλήθηκε στις {new Date(message.createdAt).toLocaleDateString('el-GR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-b py-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Αποστολέας</h3>
                      <p className="text-gray-900 font-medium">
                        {message.user ? (
                          <Link href={`/users/${message.user.username}`} className="text-blue-600 hover:underline">
                            {message.user.firstNameNative} {message.user.lastNameNative} (@{message.user.username})
                          </Link>
                        ) : (
                          message.name || 'Επισκέπτης'
                        )}
                      </p>
                      <p className="text-gray-600 text-sm mt-1">{message.user?.email || message.email}</p>
                    </div>
                    {message.location && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Περιοχή Ενδιαφέροντος</h3>
                        <p className="text-gray-900 font-medium">{message.location.name}</p>
                        <p className="text-gray-600 text-xs mt-1 capitalize">{message.location.type}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Περιεχόμενο Μηνύματος</h3>
                    <div className="bg-gray-100 rounded-xl p-5 text-gray-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                      {message.message}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Response Form */}
              <Card>
                <form onSubmit={handleSubmitResponse} className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900">Απάντηση στο Μήνυμα</h3>

                  <div>
                    <label htmlFor="response" className="block text-sm font-semibold text-gray-700 mb-2">
                      Το μήνυμά σας προς τον χρήστη
                    </label>
                    <textarea
                      id="response"
                      rows={6}
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                      placeholder="Γράψτε την απάντησή σας εδώ... (Ο χρήστης θα λάβει ειδοποίηση και email)"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      * Η απάντηση αυτή θα αποσταλεί μέσω email στον χρήστη και θα εμφανιστεί στις ειδοποιήσεις του.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="adminNotes" className="block text-sm font-semibold text-gray-700 mb-2">
                      Εσωτερικές σημειώσεις (ορατές μόνο σε διαχειριστές)
                    </label>
                    <textarea
                      id="adminNotes"
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                      placeholder="Προσθέστε τυχόν εσωτερικές σημειώσεις για αυτό το μήνυμα..."
                    />
                  </div>

                  <div className="flex justify-end border-t pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting || !response.trim()}
                      className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${
                        isSubmitting || !response.trim()
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                      }`}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Αποστολή...
                        </span>
                      ) : (
                        'Αποστολή Απάντησης'
                      )}
                    </button>
                  </div>
                </form>
              </Card>

              {message.respondedAt && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-green-900">Τελευταία Απάντηση</h3>
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
                      Στάλθηκε στις {new Date(message.respondedAt).toLocaleDateString('el-GR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="text-green-800 whitespace-pre-wrap italic">
                    "{message.response}"
                  </div>
                  {message.responder && (
                    <p className="mt-4 text-sm text-green-700 font-medium">
                      — Απαντήθηκε από {message.responder.firstNameNative} {message.responder.lastNameNative} (@{message.responder.username})
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminMessageDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <MessageDetailContent />
    </ProtectedRoute>
  );
}
