import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { submissionsCollection, teamsCollection, adminActivityCollection, usersCollection } from '../../firebase/firestore';
import { useNotification } from '../../context/NotificationContext';

const AdminSubmissions = () => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const loadPending = async () => {
    try {
      setLoading(true);
      const pending = await submissionsCollection.getPending();
      // Fetch submitter info in parallel
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPending(); }, []);

  const approve = async (submission) => {
    try {
      setLoading(true);
      const newTeamId = await teamsCollection.createFromSubmission(submission);
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

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="p-2 rounded-md hover:bg-dark-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <h1 className="text-2xl font-semibold m-0">Team Submissions</h1>
      </div>
      {subs.length === 0 && <div className="text-gray-400">No pending submissions</div>}
      <div className="space-y-4">
        {subs.map(sub => (
          <div key={sub.id} className="bg-dark-800 p-4 rounded-lg border border-dark-700">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{sub.name}</h3>
                <p className="text-sm text-gray-400">{sub.stadium} • {sub.manager}</p>
                <p className="text-xs text-gray-500 mt-2">Submitted: {new Date(sub.createdAt?.toDate?.() || sub.createdAt || Date.now()).toLocaleString()}</p>
                {sub.submitter ? (
                  <p className="text-xs text-gray-400 mt-1">Submitted by: {sub.submitter.name || sub.submitter.email || sub.userId} ({sub.submitter.email})</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">Submitted by: {sub.userId || 'Unknown'}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => approve(sub)} className="px-3 py-1 bg-green-600 rounded text-white">Approve</button>
                <button onClick={() => reject(sub)} className="px-3 py-1 bg-red-600 rounded text-white">Reject</button>
              </div>
            </div>

            {sub.players && sub.players.length > 0 && (
              <div className="mt-3 text-sm text-gray-300">
                <strong>Players:</strong>
                <ul className="list-disc ml-5 mt-1">
                  {sub.players.map((p, idx) => <li key={idx}>{p.name} ({p.position}) #{p.jerseyNumber}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSubmissions;
