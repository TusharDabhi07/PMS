import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Mail, MailOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/Modal';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/data';
import { formatDateTime } from '@/lib/utils';
import type { Notification } from '@/types';

export function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markAllOpen, setMarkAllOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    try {
      const data = await fetchNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to mark notification', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await markAllNotificationsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast('All notifications marked as read.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to mark notifications', 'error');
    } finally { setMarkAllOpen(false); }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'You are all caught up'}
        action={unreadCount > 0 ? <Button variant="secondary" size="sm" onClick={() => setMarkAllOpen(true)}><CheckCheck className="h-4 w-4" />Mark all read</Button> : undefined}
      />
      <Card>
        <CardBody className="p-0">
          {loading ? <LoadingSpinner /> :
           error ? <ErrorState message={error} onRetry={load} /> :
           notifications.length === 0 ? <EmptyState icon={<Bell className="h-12 w-12" />} title="No notifications" description="Your notifications will appear here." /> :
           <div className="divide-y divide-slate-100">
             {notifications.map((n) => (
               <div key={n.id} className={`flex items-start gap-3 px-5 py-4 ${!n.is_read ? 'bg-primary-50/40' : ''}`}>
                 <div className={`mt-0.5 ${n.is_read ? 'text-slate-300' : 'text-primary-500'}`}>
                   {n.is_read ? <MailOpen className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className={`text-sm ${n.is_read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>{n.title}</p>
                   <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                   <p className="text-xs text-slate-400 mt-1">{formatDateTime(n.created_at)}</p>
                 </div>
                 {!n.is_read && <button onClick={() => handleMarkRead(n.id)} className="text-xs font-medium text-primary-600 hover:text-primary-700 flex-shrink-0">Mark read</button>}
               </div>
             ))}
           </div>}
        </CardBody>
      </Card>
      <ConfirmDialog open={markAllOpen} onClose={() => setMarkAllOpen(false)} onConfirm={handleMarkAllRead} title="Mark all as read" message="Mark all notifications as read?" confirmLabel="Mark all read" />
    </div>
  );
}
