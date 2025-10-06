import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFootball } from '../../context/FootballContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import BulkTeamUpload from '../../components/BulkTeamUpload';
import { ArrowLeft, Plus, Edit, Trash2, Upload, Save, X, Users, UserPlus, Shield, Goal } from 'lucide-react';

const AdminTeams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams, addTeam, updateTeam, deleteTeam } = useFootball();
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
    dateOfBirth: '',
    placeOfBirth: '',
    nationality: '',
    height: '',
    preferredFoot: '',
    marketValue: '',
    contractExpiry: '',
  });
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
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

  const handleEditPlayer = (player) => {
    setEditingPlayer(player.id);
    setPlayerForm({
      name: player.name || '',
      position: player.position || 'Forward',
      jerseyNumber: player.jerseyNumber ? player.jerseyNumber.toString() : '',
      isCaptain: player.isCaptain || false,
      isGoalkeeper: player.isGoalkeeper || false,
      dateOfBirth: player.dateOfBirth || '',
      placeOfBirth: player.placeOfBirth || '',
      nationality: player.nationality || '',
      height: player.height ? player.height.toString() : '',
      preferredFoot: player.preferredFoot || '',
      marketValue: player.marketValue || '',
      contractExpiry: player.contractExpiry || '',
    });
    setShowPlayerForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddPlayer = () => {
    if (!playerForm.name.trim() || !playerForm.jerseyNumber) {
      showError('Validation Error', 'Please enter player name and jersey number');
      return;
    }

    // Validate jersey number uniqueness (exclude current player if editing)
    const jerseyExists = formData.players.some(p => 
      p.jerseyNumber === playerForm.jerseyNumber && p.id !== editingPlayer
    );
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

    if (editingPlayer) {
      // Update existing player
      setFormData(prev => ({
        ...prev,
        players: prev.players.map(p => 
          p.id === editingPlayer
            ? {
                ...p,
                ...playerForm,
                jerseyNumber: parseInt(playerForm.jerseyNumber)
              }
            : p
        )
      }));
      showSuccess('Player Updated', `${playerForm.name} has been updated`);
    } else {
      // Add new player
      const newPlayer = {
        ...playerForm,
        id: Date.now().toString(),
        jerseyNumber: parseInt(playerForm.jerseyNumber)
      };

      setFormData(prev => ({
        ...prev,
        players: [...prev.players, newPlayer]
      }));
      showSuccess('Player Added', `${newPlayer.name} added to squad`);
    }

    // Reset player form
    setPlayerForm({
      name: '',
      position: 'Forward',
      jerseyNumber: '',
      isCaptain: false,
      isGoalkeeper: false,
      dateOfBirth: '',
      placeOfBirth: '',
      nationality: '',
      height: '',
      preferredFoot: '',
      marketValue: '',
      contractExpiry: '',
    });
    setEditingPlayer(null);
    setShowPlayerForm(false);
  };

  const handleRemovePlayer = (playerId) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId)
    }));
    showSuccess('Player Removed', 'Player removed from squad');
  };

  const handleEdit = (team) => {
    // Navigate to edit page with team ID
    navigate(`/admin/teams/edit/${team.id}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      if (editingTeam) {
        // Update existing team
        const updatedTeam = {
          ...formData,
          logo: formData.logo || `https://ui-avatars.com/api/?name=${formData.name}&background=22c55e&color=fff&size=200`,
        };
        await updateTeam(editingTeam.id, updatedTeam);
        showSuccess('Team Updated', `${updatedTeam.name} has been updated successfully`);
      } else {
        // Add new team
        const newTeam = {
          ...formData,
          logo: formData.logo || `https://ui-avatars.com/api/?name=${formData.name}&background=22c55e&color=fff&size=200`,
        };
        await addTeam(newTeam);
        showSuccess('Team Added', `${newTeam.name} has been added successfully`);
      }
      
      setFormData({ name: '', logo: '', stadium: '', founded: '', manager: '', players: [] });
      setShowAddForm(false);
      setEditingTeam(null);
    } catch (error) {
      console.error('Error saving team:', error);
      showError('Error', 'Failed to save team');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (team) => {
    console.log('🔐 Current user:', user);
    console.log('🔐 User role:', user?.role);
    console.log('🎯 Team to delete:', team);
    console.log('🆔 Team ID:', team.id, 'Type:', typeof team.id);
    
    if (!confirm(`Are you sure you want to delete ${team.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ Attempting to delete team:', team.id, team.name);
      await deleteTeam(team.id);
      showSuccess('Team Deleted', `${team.name} has been deleted successfully`);
    } catch (error) {
      console.error('❌ Error deleting team:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to delete team. ';
      if (error.code === 'permission-denied') {
        errorMessage += 'You do not have permission to delete teams. Your role: ' + (user?.role || 'unknown');
      } else if (error.code === 'not-found') {
        errorMessage += 'Team not found.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      showError('Delete Failed', errorMessage);
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

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="ml-2">
              <h1 className="page-header">Teams Management</h1>
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
              <h3 className="text-lg font-semibold text-white">{editingTeam ? 'Edit Team' : 'Add New Team'}</h3>
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

                {/* Add/Edit Player Form */}
                {showPlayerForm && (
                  <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 mb-4">
                    <h5 className="text-sm font-semibold text-white mb-3">{editingPlayer ? 'Edit Player' : 'New Player'}</h5>
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

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={playerForm.dateOfBirth}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Place of Birth
                        </label>
                        <input
                          type="text"
                          name="placeOfBirth"
                          value={playerForm.placeOfBirth}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                          placeholder="e.g., London, England"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Nationality
                        </label>
                        <input
                          type="text"
                          name="nationality"
                          value={playerForm.nationality}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                          placeholder="e.g., England"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          name="height"
                          value={playerForm.height}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                          placeholder="e.g., 180"
                          min="150"
                          max="220"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Preferred Foot
                        </label>
                        <select
                          name="preferredFoot"
                          value={playerForm.preferredFoot}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                        >
                          <option value="">Select...</option>
                          <option value="right">Right</option>
                          <option value="left">Left</option>
                          <option value="both">Both</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Market Value
                        </label>
                        <input
                          type="text"
                          name="marketValue"
                          value={playerForm.marketValue}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                          placeholder="e.g., €50M"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Contract Expiry
                        </label>
                        <input
                          type="date"
                          name="contractExpiry"
                          value={playerForm.contractExpiry}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-4 md:col-span-2">
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
                          setEditingPlayer(null);
                          setPlayerForm({
                            name: '',
                            position: 'Forward',
                            jerseyNumber: '',
                            isCaptain: false,
                            isGoalkeeper: false,
                            dateOfBirth: '',
                            placeOfBirth: '',
                            nationality: '',
                            height: '',
                            preferredFoot: '',
                            marketValue: '',
                            contractExpiry: '',
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
                        {editingPlayer ? 'Update Player' : 'Add Player'}
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
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditPlayer(player)}
                              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                              title="Edit player"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePlayer(player.id)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                              title="Remove player"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
                  <span>{loading ? (editingTeam ? 'Updating...' : 'Adding...') : (editingTeam ? 'Update Team' : 'Add Team')}</span>
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
                    onClick={() => handleEdit(team)}
                    className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team)}
                    disabled={loading}
                    className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      <BulkTeamUpload
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
      />
    </div>
  );
};

export default AdminTeams;