import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminBulkTeamUpload from '../../components/admin/BulkTeamUpload';
import { useFootball } from '../../context/FootballContext';
import { useNotification } from '../../context/NotificationContext';

const BulkTeamUploadPage = () => {
  const navigate = useNavigate();
  const { addBulkTeams } = useFootball();
  const { showSuccess, showError } = useNotification();

  const handleUpload = async (teams) => {
    try {
      await addBulkTeams(teams);
      showSuccess('Bulk upload successful', `Uploaded ${teams.length} teams`);
      navigate('/admin/teams');
    } catch (err) {
      console.error('Bulk upload failed on page:', err);
      showError('Bulk upload failed', err?.message || 'See console for details');
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-5xl mx-auto">
        <AdminBulkTeamUpload inline onUpload={handleUpload} onClose={() => navigate(-1)} />
      </div>
    </div>
  );
};

export default BulkTeamUploadPage;
