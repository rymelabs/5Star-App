import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  RefreshCw,
  Users,
  Shield,
  FileText,
  MapPin,
  UserCircle,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import AdminPageLayout from '../../components/AdminPageLayout';
import { submissionsCollection, teamsCollection, adminActivityCollection, usersCollection } from '../../firebase/firestore';
import { useNotification } from '../../context/NotificationContext';

const AdminSubmissions = () => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const loadPending = async () => {
    try {
      setLoading(true);
      const pending = await submissionsCollection.getPending();
      const withUsers = await Promise.all(pending.map(async (p) => {
        try {
          const u = p.userId ? await usersCollection.getById(p.userId) : null;
          return { ...p, submitter: u };
        } catch (e) {
          return { ...p, submitter: null };
        }
      }));
      setSubs(withUsers);
    } catch (err) {
      console.error('Error loading submissions:', err);
      showError('Unable to fetch submissions', err.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const approve = async (submission) => {
    try {
      setLoading(true);
      await teamsCollection.createFromSubmission(submission);
      await submissionsCollection.approve(submission.id, { approvedBy: 'admin' });
      await adminActivityCollection.log({ action: 'approve', type: 'submission', itemId: submission.id, itemName: submission.name });
      showSuccess('Submission approved', `${submission.name} created`);
      await loadPending();
    } catch (err) {
      console.error('Approve failed:', err);
      showError('Approve failed', err.message || 'See console');
    } finally {
      setLoading(false);
    }
  };

  const reject = async (submission) => {
    try {
      setLoading(true);
      await submissionsCollection.reject(submission.id, 'Rejected by admin');
      await adminActivityCollection.log({ action: 'reject', type: 'submission', itemId: submission.id, itemName: submission.name });
      showSuccess('Submission rejected', submission.name);
      await loadPending();
    } catch (err) {
      console.error('Reject failed:', err);
      showError('Reject failed', err.message || 'See console');
    } finally {
      setLoading(false);
    }
  };

  const totalPlayers = useMemo(() => subs.reduce((sum, sub) => sum + (sub.players?.length || 0), 0), [subs]);
  const uniqueManagers = useMemo(() => new Set(subs.map(sub => sub.manager).filter(Boolean)).size, [subs]);
  const averageSquadSize = subs.length ? Math.round(totalPlayers / subs.length) : 0;

  const formatDate = (value) => {
    const date = new Date(value?.toDate?.() || value || Date.now());
    return date.toLocaleString();
  };

  return (
    <AdminPageLayout
      title="Team Submissions"
      subtitle="REVIEW QUEUE"
      description="Approve or reject community submitted teams before they go live."
      onBack={() => navigate('/admin')}
      actions={[
        {
          label: loading ? 'Refreshing' : 'Refresh',
          icon: RefreshCw,
          onClick: loadPending,
          disabled: loading,
        }
      ]}
      stats={[
        { label: 'Pending', value: subs.length, icon: ClipboardList },
        { label: 'Players Submitted', value: totalPlayers, icon: Users },
        { label: 'Distinct Managers', value: uniqueManagers, icon: Shield },
        { label: 'Avg Squad Size', value: averageSquadSize, icon: FileText },
      ]}
    >
      {loading ? (
        <div className="card p-3 text-xs text-white/70">Loading pending submissions...</div>
      ) : subs.length === 0 ? (
        <div className="card text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white/60" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No pending submissions</h3>
          <p className="text-xs text-white/60">New teams will appear here as soon as they are sent in.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
          {subs.map(sub => (
            <div key={sub.id} className="card relative overflow-hidden p-2 sm:p-2.5">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-purple/5 via-transparent to-blue-500/10" />
              <div className="relative space-y-2">
                <div className="flex items-start justify-between gap-1.5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">Community team</p>
                    <h3 className="text-[13px] font-semibold text-white leading-tight">{sub.name}</h3>
                    <p className="text-[11px] text-white/60 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{sub.stadium || 'Unknown stadium'}</span>
                    </p>
                    <p className="text-[11px] text-white/60 flex items-center gap-1">
                      <UserCircle className="w-3 h-3" />
                      <span>{sub.manager || 'No manager provided'}</span>
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-white/50">
                    <p className="uppercase tracking-[0.25em]">Submitted</p>
                    <p className="text-[11px] text-white/70">{formatDate(sub.createdAt)}</p>
                    {sub.submitter && (
                      <p className="mt-0.5 text-[10px]">{sub.submitter.email || sub.submitter.name}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[10px] text-white/70">
                  <div className="px-1 py-0.5 rounded-md border border-white/10 bg-white/5">
                    <p className="uppercase tracking-[0.25em] text-white/50">Players</p>
                    <p className="text-xs text-white">{sub.players?.length || 0}</p>
                  </div>
                  <div className="px-1 py-0.5 rounded-md border border-white/10 bg-white/5">
                    <p className="uppercase tracking-[0.25em] text-white/50">Owner</p>
                    <p className="text-xs text-white truncate">{sub.submitter?.name || sub.userId || 'Unknown'}</p>
                  </div>
                </div>

                {sub.players?.length > 0 && (
                  <div className="border-t border-white/5 pt-1">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/50 mb-0.5">Submitted Squad</p>
                    <div className="space-y-0.5 max-h-24 overflow-auto pr-1">
                      {sub.players.map((player, idx) => (
                        <div key={`${sub.id}-player-${idx}`} className="flex items-center justify-between text-[11px] text-white/80 bg-white/5 border border-white/10 rounded px-1 py-0.5">
                          <span className="font-medium text-white truncate">{player.name}</span>
                          <span className="text-white/60 text-[10px]">{player.position || 'N/A'} · #{player.jerseyNumber || '--'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1 border-t border-white/5 pt-1">
                  <button
                    onClick={() => approve(sub)}
                    className="px-2 py-0.5 rounded-md bg-green-500/20 border border-green-400/40 text-green-100 text-[10px] font-semibold uppercase tracking-[0.25em]"
                    disabled={loading}
                  >
                    <Check className="w-3 h-3 mr-1 inline" /> Approve
                  </button>
                  <button
                    onClick={() => reject(sub)}
                    className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-400/40 text-red-100 text-[10px] font-semibold uppercase tracking-[0.25em]"
                    disabled={loading}
                  >
                    <X className="w-3 h-3 mr-1 inline" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AdminSubmissions;
