import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFootball } from '../../context/FootballContext';
import { useNotification } from '../../context/NotificationContext';
import BulkTeamUpload from '../../components/BulkTeamUpload';
import { ArrowLeft, Plus, Edit, Trash2, Upload, Save, X, Users, UserPlus, Shield, Goal } from 'lucide-react';

const AdminTeams = () => {
  const navigate = useNavigate();
  const { teams, addTeam, addBulkTeams } = useFootball();
  const { showSuccess, showError } = useNotification();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    stadium: '',
    founded: '',
    manager: '',
    players: [],
  });
  const [playerForm, setPlayerForm] = useState({
    name: '',
    position: 'Forward',
    jerseyNumber: '',
    isCaptain: false,
    isGoalkeeper: false,
  });
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlayerInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPlayerForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddPlayer = () => {
    if (!playerForm.name.trim() || !playerForm.jerseyNumber) {
      showError('Validation Error', 'Please enter player name and jersey number');
      return;
    }

    // Validate jersey number uniqueness
    const jerseyExists = formData.players.some(p => p.jerseyNumber === playerForm.jerseyNumber);
    if (jerseyExists) {
      showError('Duplicate Jersey Number', 'This jersey number is already assigned');
      return;
    }

    // If setting as goalkeeper, unset previous goalkeeper
    if (playerForm.isGoalkeeper) {
      setFormData(prev => ({
        ...prev,
        players: prev.players.map(p => ({ ...p, isGoalkeeper: false }))
      }));
    }

    // If setting as captain, unset previous captain
    if (playerForm.isCaptain) {
      setFormData(prev => ({
        ...prev,
        players: prev.players.map(p => ({ ...p, isCaptain: false }))
      }));
    }

    const newPlayer = {
      ...playerForm,
      id: Date.now().toString(),
      jerseyNumber: parseInt(playerForm.jerseyNumber)
    };

    setFormData(prev => ({
      ...prev,
      players: [...prev.players, newPlayer]
    }));

    // Reset player form
    setPlayerForm({
      name: '',
      position: 'Forward',
      jerseyNumber: '',
      isCaptain: false,
      isGoalkeeper: false,
    });
    setShowPlayerForm(false);
    showSuccess('Player Added', `${newPlayer.name} added to squad`);
  };

  const handleRemovePlayer = (playerId) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId)
    }));
    showSuccess('Player Removed', 'Player removed from squad');
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
    setFormData({ name: '', logo: '', stadium: '', founded: '', manager: '', players: [] });
    setPlayerForm({ name: '', position: 'Forward', jerseyNumber: '', isCaptain: false, isGoalkeeper: false });
    setShowAddForm(false);
    setShowPlayerForm(false);
    setEditingTeam(null);
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
              className="group px-4 py-2 border-2 border-green-500 hover:border-green-400 bg-transparent text-green-500 hover:text-green-400 rounded-[9px] font-medium tracking-tight transition-all duration-200 flex items-center justify-center"
            >
              <Upload className="w-4 h-4 mr-2 group-hover:scale-105 transition-transform duration-200" />
              <span>Bulk Upload</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="group px-4 py-2 border-2 border-orange-500 hover:border-orange-400 bg-transparent text-orange-500 hover:text-orange-400 rounded-[9px] font-medium tracking-tight transition-all duration-200 flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2 group-hover:scale-105 transition-transform duration-200" />
              <span>Add Team</span>
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

              {/* Players Section */}
              <div className="border-t border-dark-700 pt-4 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-primary-500 mr-2" />
                    <h4 className="text-md font-semibold text-white">Squad Players ({formData.players.length})</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPlayerForm(!showPlayerForm)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Player
                  </button>
                </div>

                {/* Add Player Form */}
                {showPlayerForm && (
                  <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 mb-4">
                    <h5 className="text-sm font-semibold text-white mb-3">New Player</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Player Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={playerForm.name}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                          placeholder="Enter player name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Jersey Number *
                        </label>
                        <input
                          type="number"
                          name="jerseyNumber"
                          value={playerForm.jerseyNumber}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                          placeholder="1-99"
                          min="1"
                          max="99"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Position
                        </label>
                        <select
                          name="position"
                          value={playerForm.position}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                        >
                          <option value="Goalkeeper">Goalkeeper</option>
                          <option value="Defender">Defender</option>
                          <option value="Midfielder">Midfielder</option>
                          <option value="Forward">Forward</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="isCaptain"
                            checked={playerForm.isCaptain}
                            onChange={handlePlayerInputChange}
                            className="w-4 h-4 text-primary-600 bg-dark-700 border-gray-600 rounded focus:ring-primary-500"
                          />
                          <span className="text-xs text-gray-300 flex items-center gap-1">
                            <Shield className="w-3 h-3 text-yellow-500" />
                            Captain
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="isGoalkeeper"
                            checked={playerForm.isGoalkeeper}
                            onChange={handlePlayerInputChange}
                            className="w-4 h-4 text-primary-600 bg-dark-700 border-gray-600 rounded focus:ring-primary-500"
                          />
                          <span className="text-xs text-gray-300 flex items-center gap-1">
                            <Goal className="w-3 h-3 text-blue-500" />
                            GK
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPlayerForm(false);
                          setPlayerForm({
                            name: '',
                            position: 'Forward',
                            jerseyNumber: '',
                            isCaptain: false,
                            isGoalkeeper: false,
                          });
                        }}
                        className="px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-white rounded-lg text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddPlayer}
                        className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm transition-colors"
                      >
                        Add Player
                      </button>
                    </div>
                  </div>
                )}

                {/* Players List */}
                {formData.players.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {formData.players
                      .sort((a, b) => a.jerseyNumber - b.jerseyNumber)
                      .map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 bg-dark-800 border border-dark-700 rounded-lg hover:border-dark-600 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
                              {player.jerseyNumber}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{player.name}</span>
                                {player.isCaptain && (
                                  <Shield className="w-4 h-4 text-yellow-500" title="Captain" />
                                )}
                                {player.isGoalkeeper && (
                                  <Goal className="w-4 h-4 text-blue-500" title="Goalkeeper" />
                                )}
                              </div>
                              <span className="text-xs text-gray-500">{player.position}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePlayer(player.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No players added yet</p>
                    <p className="text-xs">Click "Add Player" to build your squad</p>
                  </div>
                )}
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
                      {team.players && team.players.length > 0 && (
                        <p className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {team.players.length} player{team.players.length !== 1 ? 's' : ''}
                        </p>
                      )}
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
            <p className="text-gray-400">Get started by adding teams individually or in bulk</p>
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