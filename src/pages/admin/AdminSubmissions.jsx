import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submissionsCollection, teamsCollection, adminActivityCollection } from '../../firebase/firestore';
import { useNotification } from '../../context/NotificationContext';

const AdminSubmissions = () => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const loadPending = async () => {
    try {
      setLoading(true);
      const pending = await submissionsCollection.getPending();
      setSubs(pending);
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
      <h1 className="text-2xl font-semibold mb-4">Team Submissions</h1>
      {subs.length === 0 && <div className="text-gray-400">No pending submissions</div>}
      <div className="space-y-4">
        {subs.map(sub => (
          <div key={sub.id} className="bg-dark-800 p-4 rounded-lg border border-dark-700">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{sub.name}</h3>
                <p className="text-sm text-gray-400">{sub.stadium} • {sub.manager}</p>
                <p className="text-xs text-gray-500 mt-2">Submitted: {new Date(sub.createdAt?.toDate?.() || sub.createdAt || Date.now()).toLocaleString()}</p>
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
