'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeIcon, PencilIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { articleAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Card from '@/components/Card';
import Badge, { StatusBadge } from '@/components/Badge';
import { useToast } from '@/components/ToastProvider';
import ArticleForm from '@/components/ArticleForm';
import { useAsyncData } from '@/hooks/useAsyncData';
import { usePermissions } from '@/hooks/usePermissions';
import Button from '@/components/Button';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/Modal';
import { TooltipIconButton } from '@/components/Tooltip';

function NewsApprovalBadge({ article }) {
  if (!article.isNews && article.type !== 'news') return null;
  if (article.newsApprovedAt) {
    return <Badge variant="success">Εγκεκριμένο</Badge>;
  }
  return <Badge variant="warning">Αναμονή έγκρισης</Badge>;
}

function MyNewsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { canEditArticle, canDeleteArticle } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: newsItems, loading, refetch } = useAsyncData(
    async () => {
      if (!user?.id) return [];
      const params = { authorId: user.id, type: 'news', limit: 50, orderBy: 'updatedAt', order: 'desc' };
      if (statusFilter) params.status = statusFilter;
      const response = await articleAPI.getAll(params);
      if (response.success) {
        return (response.data.articles || []).filter(a => a.authorId === user.id);
      }
      return [];
    },
    [user?.id, statusFilter],
    { initialData: [] }
  );

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const response = await articleAPI.create({ ...formData, type: 'news', isNews: true });
      if (response.success) {
        addToast('Η είδηση δημιουργήθηκε! Αναμένει έγκριση για να εμφανιστεί δημόσια.', { type: 'success' });
        setShowForm(false);
        refetch();
      } else {
        setSubmitError(response.message || 'Αποτυχία δημιουργίας είδησης.');
      }
    } catch (error) {
      setSubmitError(`Αποτυχία δημιουργίας είδησης: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await articleAPI.delete(id);
      refetch();
      addToast('Η είδηση διαγράφηκε.', { type: 'success' });
    } catch (error) {
      addToast(`Αποτυχία διαγραφής: ${error.message}`, { type: 'error' });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Τα νέα μου</h1>
          <Button onClick={() => setShowForm(!showForm)} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />}>
            Δημιουργία είδησης
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Νέα Είδηση</h2>
            <ArticleForm
              article={null}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              isSubmitting={submitting}
              submitError={submitError}
            />
          </Card>
        )}

        <Card
          header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-xl font-semibold">Οι ειδήσεις μου</h2>
              <div className="flex gap-2 items-center">
                <label htmlFor="statusFilter" className="text-sm mr-1">Φίλτρο κατάστασης:</label>
                <select
                  id="statusFilter"
                  className="border rounded px-2 py-1 text-sm"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="">Όλες</option>
                  <option value="draft">Πρόχειρο</option>
                  <option value="published">Δημοσιευμένο</option>
                  <option value="archived">Αρχειοθετημένο</option>
                </select>
              </div>
            </div>
          }
        >
          {loading ? (
            <SkeletonLoader type="card" count={5} variant="list" />
          ) : newsItems.length === 0 ? (
            <EmptyState
              type="empty"
              title="Δεν βρέθηκαν ειδήσεις"
              description="Δημιουργήστε την πρώτη σας είδηση!"
            />
          ) : (
            <div className="divide-y divide-gray-200">
              {newsItems.map((article) => (
                <div key={article.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold mb-1">
                        <Link href={`/news/${article.id}`} className="hover:text-blue-600">
                          {article.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {article.summary || article.content?.substring(0, 100) + '...'}
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500 items-center">
                        <StatusBadge status={article.status} />
                        <NewsApprovalBadge article={article} />
                        {article.category && <Badge variant="primary">{article.category}</Badge>}
                        <span>{new Date(article.createdAt).toLocaleDateString('el-GR')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <TooltipIconButton
                        icon={EyeIcon}
                        tooltip="Προβολή είδησης"
                        onClick={() => router.push(`/news/${article.id}`)}
                      />
                      {canEditArticle(article) && (
                        <TooltipIconButton
                          icon={PencilIcon}
                          tooltip="Επεξεργασία είδησης"
                          onClick={() => router.push(`/articles/${article.id}/edit`)}
                          variant="primary"
                        />
                      )}
                      {canDeleteArticle(article) && (
                        <TooltipIconButton
                          icon={TrashIcon}
                          tooltip="Διαγραφή είδησης"
                          onClick={() => { setArticleToDelete(article.id); setDeleteDialogOpen(true); }}
                          variant="danger"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => handleDelete(articleToDelete)}
        title="Διαγραφή Είδησης"
        message="Είστε σίγουρος ότι θέλετε να διαγράψετε αυτή την είδηση; Η ενέργεια δεν μπορεί να αναιρεθεί."
        confirmText="Διαγραφή"
        cancelText="Άκυρο"
        variant="danger"
      />
    </div>
  );
}

export default function MyNewsPage() {
  return (
    <ProtectedRoute>
      <MyNewsContent />
    </ProtectedRoute>
  );
}
