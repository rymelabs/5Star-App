import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFootball } from '../../context/FootballContext';
import { useNotification } from '../../context/NotificationContext';
import BulkTeamUpload from '../../components/BulkTeamUpload';
import { ArrowLeft, Plus, Edit, Trash2, Upload, Save, X } from 'lucide-react';

const AdminTeams = () => {
  const navigate = useNavigate();
  const { teams, addTeam, addBulkTeams } = useFootball();
  const { showSuccess, showError } = useNotification();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    stadium: '',
    founded: '',
    manager: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const newTeam = {
        ...formData,
        logo: formData.logo || `https://ui-avatars.com/api/?name=${formData.name}&background=22c55e&color=fff&size=200`,
      };
      
      addTeam(newTeam);
      setFormData({ name: '', logo: '', stadium: '', founded: '', manager: '' });
      setShowAddForm(false);
      showSuccess('Team Added', `${newTeam.name} has been added successfully`);
    } catch (error) {
      console.error('Error adding team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', logo: '', stadium: '', founded: '', manager: '' });
    setShowAddForm(false);
  };

  const handleBulkUpload = async (teamsData) => {
    try {
      await addBulkTeams(teamsData);
      showSuccess(
        'Teams Uploaded Successfully',
        `${teamsData.length} team${teamsData.length === 1 ? '' : 's'} added to the database`
      );
    } catch (error) {
      console.error('Error uploading teams:', error);
      showError(
        'Upload Failed',
        'There was an error uploading the teams. Please try again.'
      );
      throw error; // Re-throw to let BulkTeamUpload handle the error
    }
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="ml-2">
              <h1 className="text-lg font-semibold text-white">Teams Management</h1>
              <p className="text-sm text-gray-400">{teams.length} teams</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowBulkUpload(true)}
              className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold tracking-tight transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center min-w-[140px]"
            >
              <Upload className="w-5 h-5 mr-2.5 group-hover:scale-110 transition-transform duration-200" />
              <span>Bulk Upload</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-blue-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="group relative px-6 py-3 bg-gradient-to-r from-primary-600 to-orange-600 hover:from-primary-700 hover:to-orange-700 text-white rounded-xl font-semibold tracking-tight transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-primary-500/25 flex items-center justify-center min-w-[140px]"
            >
              <Plus className="w-5 h-5 mr-2.5 group-hover:scale-110 transition-transform duration-200" />
              <span>Add Team</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400/20 to-primary-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Add Team Form */}
        {showAddForm && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add New Team</h3>
              <button
                onClick={handleCancel}
                className="p-2 rounded-full hover:bg-dark-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder="Enter team name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    name="logo"
                    value={formData.logo}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stadium
                  </label>
                  <input
                    type="text"
                    name="stadium"
                    value={formData.stadium}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder="Stadium name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    name="founded"
                    value={formData.founded}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder="1900"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Manager
                </label>
                <input
                  type="text"
                  name="manager"
                  value={formData.manager}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder="Manager name"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium tracking-tight transition-all duration-200 transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="group relative px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold tracking-tight transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  <Save className="w-5 h-5 mr-2.5 group-hover:scale-110 transition-transform duration-200" />
                  <span>{loading ? 'Adding...' : 'Add Team'}</span>
                  {!loading && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 to-green-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Teams List */}
        <div className="space-y-4">
          {teams.map((team) => (
            <div key={team.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="w-12 h-12 object-contain rounded-lg bg-dark-700"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${team.name}&background=22c55e&color=fff&size=48`;
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-white">{team.name}</h3>
                    <div className="text-sm text-gray-400 space-y-1">
                      {team.stadium && <p>🏟️ {team.stadium}</p>}
                      {team.founded && <p>📅 Founded {team.founded}</p>}
                      {team.manager && <p>👨‍💼 {team.manager}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/admin/teams/edit/${team.id}`)}
                    className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${team.name}?`)) {
                        // In a real app, you'd call a delete function
                        console.log('Delete team:', team.id);
                      }
                    }}
                    className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No teams yet</h3>
            <p className="text-gray-400 mb-6">Get started by adding teams individually or in bulk</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Single Team
              </button>
              <button
                onClick={() => setShowBulkUpload(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload Teams
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              💡 Tip: Use bulk upload to add multiple teams at once using CSV or JSON format
            </p>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkTeamUpload
          onUpload={handleBulkUpload}
          onClose={() => setShowBulkUpload(false)}
        />
      )}
    </div>
  );
};

export default AdminTeams;