import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
