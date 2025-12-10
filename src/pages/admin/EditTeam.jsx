import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFootball } from '../../context/FootballContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { ArrowLeft, Save, X, Users, UserPlus, Shield, Goal, Trash2, Edit, Image, Link } from 'lucide-react';
import { uploadImage, validateImageFile } from '../../services/imageUploadService';

const EditTeam = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams, leagues, updateTeam } = useFootball();
  const { showSuccess, showError } = useNotification();
  
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    stadium: '',
    founded: '',
    manager: '',
    leagueId: '',
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
  const [logoUploadMethod, setLogoUploadMethod] = useState('url');
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    // Load team data with fallbacks
    const findTeamByParam = (param) => {
      let found = teams.find(t => t.id === param);
      if (found) return found;
      found = teams.find(t => t.teamId === param || String(t.teamId) === param);
      if (found) return found;
      found = teams.find(t => String(t.id) === String(Number(param)));
      if (found) return found;
      const slug = String(param).toLowerCase().replace(/[-_\s]+/g, ' ').trim();
      found = teams.find(t => (t.name || '').toLowerCase().replace(/[-_\s]+/g, ' ').trim() === slug);
      return found;
    };

    const team = findTeamByParam(teamId);
    if (team) {
      setFormData({
        name: team.name,
        logo: team.logo || '',
        stadium: team.stadium || '',
        founded: team.founded || '',
        manager: team.manager || '',
        leagueId: team.leagueId || '',
        players: team.players || [],
      });
      setLogoUploadMethod(team.logo ? 'url' : 'file');
      setSelectedLogoFile(null);
      setLogoPreviewUrl(null);
    } else {
      showError('Team Not Found', 'The team you are trying to edit does not exist.');
      navigate('/admin/teams');
    }
  }, [teamId, teams]);

  useEffect(() => {
    if (!selectedLogoFile) {
      setLogoPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedLogoFile);
    setLogoPreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedLogoFile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUploadMethodChange = (method) => {
    setLogoUploadMethod(method);
    if (method === 'url') {
      setSelectedLogoFile(null);
      setLogoPreviewUrl(null);
    } else {
      setFormData(prev => ({ ...prev, logo: '' }));
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedLogoFile(null);
      return;
    }

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      showError('Invalid Image', validation.error);
      e.target.value = '';
      return;
    }

    setSelectedLogoFile(file);
    setFormData(prev => ({ ...prev, logo: '' }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showError('Validation Error', 'Please enter a team name');
      return;
    }

    if (formData.players.length === 0) {
      showError('Validation Error', 'Please add at least one player');
      return;
    }

    try {
      setLoading(true);
      let logoUrl = formData.logo;

      if (logoUploadMethod === 'file' && selectedLogoFile) {
        setUploadingLogo(true);
        try {
          const safeName = formData.name.replace(/[^a-zA-Z0-9]/g, '_') || 'team_logo';
          logoUrl = await uploadImage(selectedLogoFile, 'teams', `${safeName}_${Date.now()}`);
        } catch (uploadError) {
          showError('Image Upload Failed', uploadError.message || 'Unable to upload logo image. Please try again.');
          setUploadingLogo(false);
          setLoading(false);
          return;
        } finally {
          setUploadingLogo(false);
        }
      }

      const updatedTeam = {
        ...formData,
        logo: (logoUrl || '').trim(),
        name: formData.name.trim(),
        updatedAt: new Date().toISOString()
      };

      await updateTeam(teamId, updatedTeam);
      showSuccess('Team Updated', `${updatedTeam.name} has been updated successfully`);
      setSelectedLogoFile(null);
      setLogoUploadMethod('url');
      setLogoPreviewUrl(null);
      navigate('/admin/teams');
    } catch (error) {
      showError('Update Failed', error.message || 'Failed to update team');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedLogoFile(null);
    setLogoPreviewUrl(null);
    setLogoUploadMethod('url');
    navigate('/admin/teams');
  };

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Teams
          </button>
          <h1 className="text-2xl font-bold text-white">Edit Team</h1>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Team Information</h3>
            
            <div className="space-y-4">
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
                  League *
                </label>
                <select
                  name="leagueId"
                  value={formData.leagueId}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  
                >
                  <option value="">Select a league</option>
                  {leagues.map(league => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Logo
                </label>

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => handleLogoUploadMethodChange('url')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      logoUploadMethod === 'url'
                        ? 'bg-blue-600 text-white'
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                    }`}
                  >
                    <Link className="w-4 h-4" />
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogoUploadMethodChange('file')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      logoUploadMethod === 'file'
                        ? 'bg-blue-600 text-white'
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    Upload File
                  </button>
                </div>

                {logoUploadMethod === 'url' && (
                  <>
                    <input
                      type="url"
                      name="logo"
                      value={formData.logo}
                      onChange={handleInputChange}
                      className="input-field w-full"
                      placeholder="https://example.com/logo.png"
                    />
                    {formData.logo && (
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                        <img
                          src={formData.logo}
                          alt={formData.name}
                          className="w-16 h-16 object-contain rounded-lg bg-dark-800 border border-dark-600"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <span>Current logo preview</span>
                      </div>
                    )}
                  </>
                )}

                {logoUploadMethod === 'file' && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="input-field w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    {selectedLogoFile && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Image className="w-4 h-4" />
                        <span>{selectedLogoFile.name}</span>
                        <span className="text-gray-500">
                          ({(selectedLogoFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    )}
                    {logoPreviewUrl && (
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <img
                          src={logoPreviewUrl}
                          alt="Selected logo preview"
                          className="w-16 h-16 object-contain rounded-lg bg-dark-800 border border-dark-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLogoFile(null);
                            setLogoPreviewUrl(null);
                          }}
                          className="px-2 py-1 text-xs bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                        >
                          Clear selection
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Founded
                  </label>
                  <input
                    type="text"
                    name="founded"
                    value={formData.founded}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder="Year founded"
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
            </div>
          </div>

          {/* Players Section */}
          <div className="card p-6">
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
              <div className="text-center py-8 text-gray-500 bg-dark-800 rounded-lg border border-dark-700">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No players added yet</p>
                <p className="text-sm">Click "Add Player" to start building your squad</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingLogo}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{uploadingLogo ? 'Uploading Logo...' : loading ? 'Updating...' : 'Update Team'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTeam;
