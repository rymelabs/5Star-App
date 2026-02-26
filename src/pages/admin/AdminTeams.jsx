import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFootball } from '../../context/FootballContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { useSoftDelete } from '../../hooks/useSoftDelete';
import AdminPageLayout from '../../components/AdminPageLayout';
import ConfirmationModal from '../../components/ConfirmationModal';
import NewTeamAvatar from '../../components/NewTeamAvatar';
import { uploadImage, validateImageFile } from '../../services/imageUploadService';
import { Plus, Edit, Trash2, Upload, Save, X, Users, UserPlus, Shield, Goal, Image, Link } from 'lucide-react';

const AdminTeams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const {
    ownedTeams,
    ownedLeagues,
    addTeam,
    updateTeam
  } = useFootball();
  const { softDeleteTeam } = useSoftDelete();
  const teams = ownedTeams;
  const leagues = ownedLeagues;
  const { showSuccess, showError } = useNotification();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, team: null });
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
  const [logoUploadMethod, setLogoUploadMethod] = useState('url'); // 'url' or 'file'
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const totalPlayers = teams.reduce((sum, team) => sum + (team.players?.length || 0), 0);

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
    if (file) {
      const validation = validateImageFile(file);
      if (validation.isValid) {
        setSelectedLogoFile(file);
        setFormData(prev => ({ ...prev, logo: '' })); // Clear URL when file is selected
      } else {
        showError(t('pages.adminTeams.invalidImage'), validation.error);
        e.target.value = ''; // Clear the file input
      }
    } else {
      setSelectedLogoFile(null);
    }
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
      showError(t('pages.adminTeams.validationError'), t('pages.adminTeams.playerNameJerseyRequired'));
      return;
    }

    // Validate jersey number uniqueness (exclude current player if editing)
    const jerseyExists = formData.players.some(p => 
      p.jerseyNumber === playerForm.jerseyNumber && p.id !== editingPlayer
    );
    if (jerseyExists) {
      showError(t('pages.adminTeams.duplicateJerseyNumber'), t('pages.adminTeams.jerseyNumberAssigned'));
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
      showSuccess(t('pages.adminTeams.playerUpdated'), t('pages.adminTeams.playerUpdatedDesc').replace('{name}', playerForm.name));
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
      showSuccess(t('pages.adminTeams.playerAdded'), t('pages.adminTeams.playerAddedDesc').replace('{name}', newPlayer.name));
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
    showSuccess(t('pages.adminTeams.playerRemoved'), t('pages.adminTeams.playerRemovedDesc'));
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
      let logoUrl = formData.logo;

      // Upload image file if selected
      if (logoUploadMethod === 'file' && selectedLogoFile) {
        setUploadingLogo(true);
        try {
          logoUrl = await uploadImage(selectedLogoFile, 'teams', `${formData.name.replace(/[^a-zA-Z0-9]/g, '_')}_logo`);
          setUploadingLogo(false);
        } catch (uploadError) {
          setUploadingLogo(false);
          showError(t('pages.adminTeams.imageUploadFailed'), uploadError.message);
          return;
        }
      }

      if (editingTeam) {
        // Update existing team
        const updatedTeam = {
          ...formData,
          logo: (logoUrl || '').trim(),
        };
        await updateTeam(editingTeam.id, updatedTeam);
        showSuccess(t('pages.adminTeams.teamUpdated'), t('pages.adminTeams.teamUpdatedDesc').replace('{name}', updatedTeam.name));
      } else {
        // Add new team
        const newTeam = {
          ...formData,
          logo: (logoUrl || '').trim(),
        };
        await addTeam(newTeam);
        showSuccess(t('pages.adminTeams.teamAdded'), t('pages.adminTeams.teamAddedDesc').replace('{name}', newTeam.name));
      }

      // Reset form
      setFormData({ name: '', logo: '', stadium: '', founded: '', manager: '', leagueId: '', players: [] });
      setSelectedLogoFile(null);
      setLogoPreviewUrl(null);
      setLogoUploadMethod('url');
      setShowAddForm(false);
      setEditingTeam(null);
    } catch (error) {
      showError(t('common.error'), t('pages.adminTeams.failedToSaveTeam'));
    } finally {
      setLoading(false);
      setUploadingLogo(false);
    }
  };

  const handleDeleteTeam = async (team) => {
    setConfirmDelete({ isOpen: true, team });
  };

  const confirmDeleteTeam = async () => {
    const team = confirmDelete.team;
    if (!team) return;


    try {
      setLoading(true);
      await softDeleteTeam(team);
      showSuccess(t('pages.adminTeams.teamDeleted'), t('pages.adminTeams.teamDeletedDesc').replace('{name}', team.name) + ' (Moved to Recycle Bin)');
      setConfirmDelete({ isOpen: false, team: null });
    } catch (error) {
      let errorMessage = t('pages.adminTeams.failedToDeleteTeam') + ' ';
      if (error.code === 'permission-denied') {
        errorMessage += t('pages.adminTeams.noDeletePermission').replace('{role}', user?.role || 'unknown');
      } else if (error.code === 'not-found') {
        errorMessage += t('pages.adminTeams.teamNotFound');
      } else {
        errorMessage += error.message || t('pages.adminTeams.pleaseTryAgain');
      }
      
      showError(t('pages.adminTeams.deleteFailed'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', logo: '', stadium: '', founded: '', manager: '', players: [] });
    setPlayerForm({ name: '', position: 'Forward', jerseyNumber: '', isCaptain: false, isGoalkeeper: false });
    setSelectedLogoFile(null);
    setLogoPreviewUrl(null);
    setLogoUploadMethod('url');
    setShowAddForm(false);
    setShowPlayerForm(false);
    setEditingTeam(null);
  };

  return (
    <AdminPageLayout
      title={t('pages.adminTeams.teamsManagement')}
      subtitle="TEAM OPS"
      description={t('pages.adminTeams.getStartedAddTeams')}
      onBack={() => navigate(-1)}
      actions={[
        {
          label: t('pages.adminTeams.bulkUpload'),
          icon: Upload,
          onClick: () => navigate('/admin/teams/upload'),
          variant: 'secondary',
        },
        {
          label: t('pages.adminTeams.addTeam'),
          icon: Plus,
          onClick: () => setShowAddForm(true),
          variant: 'primary',
        },
      ]}
      stats={[
        { label: t('pages.adminTeams.teams'), value: teams.length, icon: Users },
        { label: t('pages.adminTeams.league'), value: leagues.length, icon: Shield },
        { label: t('pages.adminTeams.players'), value: totalPlayers, icon: Goal },
      ]}
    >
      <div className="space-y-6">
        {/* Add Team Form */}
        {showAddForm && (
          <div className="card relative overflow-hidden p-4 sm:p-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-purple/10 via-transparent to-blue-500/10 opacity-80" />
            <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editingTeam ? t('pages.adminTeams.editTeam') : t('pages.adminTeams.addNewTeam')}</h3>
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
                    {t('pages.adminTeams.teamName')} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder={t('pages.adminTeams.enterTeamName')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('pages.adminTeams.league')} *
                  </label>
                  <select
                    name="leagueId"
                    value={formData.leagueId}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    
                  >
                    <option value="">{t('pages.adminTeams.selectLeague')}</option>
                    {leagues.map(league => (
                      <option key={league.id} value={league.id}>
                        {league.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('pages.adminTeams.teamLogo')}
                  </label>

                  {/* Logo Upload Method Toggle */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => handleLogoUploadMethodChange('url')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
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
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                        logoUploadMethod === 'file'
                          ? 'bg-blue-600 text-white'
                          : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                      }`}
                    >
                      <Image className="w-4 h-4" />
                      Upload File
                    </button>
                  </div>

                  {/* URL Input */}
                  {logoUploadMethod === 'url' && (
                    <input
                      type="url"
                      name="logo"
                      value={formData.logo}
                      onChange={handleInputChange}
                      className="input-field w-full"
                      placeholder="https://example.com/logo.png"
                    />
                  )}

                  {/* File Upload */}
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
                            {t('common.reset')}
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('pages.adminTeams.stadium')}
                  </label>
                  <input
                    type="text"
                    name="stadium"
                    value={formData.stadium}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder={t('pages.adminTeams.stadiumName')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('pages.adminTeams.foundedYear')}
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
                  {t('pages.adminTeams.manager')}
                </label>
                <input
                  type="text"
                  name="manager"
                  value={formData.manager}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder={t('pages.adminTeams.managerName')}
                />
              </div>

              {/* Players Section */}
              <div className="border-t border-dark-700 pt-4 mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-primary-500 mr-2" />
                    <h4 className="text-sm font-semibold text-white uppercase tracking-[0.2em]">{t('pages.adminTeams.squadPlayers').replace('{count}', formData.players.length)}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPlayerForm(!showPlayerForm)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    {t('pages.adminTeams.addPlayer')}
                  </button>
                </div>

                {/* Add/Edit Player Form */}
                {showPlayerForm && (
                  <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 mb-4">
                    <h5 className="text-sm font-semibold text-white mb-3">{editingPlayer ? t('pages.adminTeams.editPlayer') : t('pages.adminTeams.newPlayer')}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          {t('pages.adminTeams.playerName')} *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={playerForm.name}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                          placeholder={t('pages.adminTeams.enterPlayerName')}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          {t('pages.adminTeams.jerseyNumber')} *
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
                          {t('pages.adminTeams.position')}
                        </label>
                        <select
                          name="position"
                          value={playerForm.position}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                        >
                          <option value="Goalkeeper">{t('pages.adminTeams.goalkeeper')}</option>
                          <option value="Defender">{t('pages.adminTeams.defender')}</option>
                          <option value="Midfielder">{t('pages.adminTeams.midfielder')}</option>
                          <option value="Forward">{t('pages.adminTeams.forward')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          {t('pages.adminTeams.dateOfBirth')}
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
                          {t('pages.adminTeams.placeOfBirth')}
                        </label>
                        <input
                          type="text"
                          name="placeOfBirth"
                          value={playerForm.placeOfBirth}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                          placeholder={t('pages.adminTeams.placeOfBirthPlaceholder')}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          {t('pages.adminTeams.nationality')}
                        </label>
                        <input
                          type="text"
                          name="nationality"
                          value={playerForm.nationality}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                          placeholder={t('pages.adminTeams.nationalityPlaceholder')}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          {t('pages.adminTeams.height')}
                        </label>
                        <input
                          type="number"
                          name="height"
                          value={playerForm.height}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                          placeholder={t('pages.adminTeams.heightPlaceholder')}
                          min="150"
                          max="220"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          {t('pages.adminTeams.preferredFoot')}
                        </label>
                        <select
                          name="preferredFoot"
                          value={playerForm.preferredFoot}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                        >
                          <option value="">{t('pages.adminTeams.select')}</option>
                          <option value="right">{t('pages.adminTeams.right')}</option>
                          <option value="left">{t('pages.adminTeams.left')}</option>
                          <option value="both">{t('pages.adminTeams.both')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          {t('pages.adminTeams.marketValue')}
                        </label>
                        <input
                          type="text"
                          name="marketValue"
                          value={playerForm.marketValue}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                          placeholder={t('pages.adminTeams.marketValuePlaceholder')}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          {t('pages.adminTeams.contractExpiry')}
                        </label>
                        <input
                          type="date"
                          name="contractExpiry"
                          value={playerForm.contractExpiry}
                          onChange={handlePlayerInputChange}
                          className="input-field w-full text-sm"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
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
                            {t('pages.adminTeams.captain')}
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
                            {t('pages.adminTeams.gk')}
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
                        className="px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-white rounded-lg text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleAddPlayer}
                        className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
                      >
                        {editingPlayer ? t('pages.adminTeams.updatePlayer') : t('pages.adminTeams.addPlayer')}
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
                                  <Shield className="w-4 h-4 text-yellow-500" title={t('pages.adminTeams.captain')} />
                                )}
                                {player.isGoalkeeper && (
                                  <Goal className="w-4 h-4 text-blue-500" title={t('pages.adminTeams.goalkeeper')} />
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
                              title={t('pages.adminTeams.editPlayer')}
                            >
                              <Edit className="w-4 h-4" />
                </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePlayer(player.id)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                              title={t('pages.adminTeams.removePlayer')}
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
                    <p className="text-sm">{t('pages.adminTeams.noPlayersAdded')}</p>
                    <p className="text-xs">{t('pages.adminTeams.clickAddPlayer')}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold uppercase tracking-[0.25em] transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingLogo || !formData.name.trim()}
                  className="group relative px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-xs font-semibold uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  <span>
                    {uploadingLogo
                      ? t('pages.adminTeams.uploadingImage')
                      : loading
                        ? (editingTeam ? t('pages.adminTeams.updating') : t('pages.adminTeams.adding'))
                        : (editingTeam ? t('pages.adminTeams.updateTeam') : t('pages.adminTeams.addTeam'))
                    }
                  </span>
                  {!loading && !uploadingLogo && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-400/20 to-green-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        )}

        {/* Teams List */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 xl:gap-4">
          {teams.map((team) => (
            <div key={team.id} className="card group relative overflow-hidden p-3">
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-brand-purple/10 via-transparent to-blue-500/10" />
              <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-2.5">
                  <NewTeamAvatar 
                    team={team} 
                    size={40} 
                    className="rounded-lg bg-black/30 border border-white/5"
                  />
                  <div>
                    <h3 className="font-semibold text-white text-base">{team.name}</h3>
                    <div className="text-[11px] text-white/60 space-y-0.5">
                      {team.stadium && <p>🏟️ {team.stadium}</p>}
                      {team.founded && <p>📅 {t('pages.adminTeams.founded')} {team.founded}</p>}
                      {team.manager && <p>👨‍💼 {team.manager}</p>}
                      {team.players && team.players.length > 0 && (
                        <p className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {team.players.length} {team.players.length !== 1 ? t('pages.adminTeams.players') : t('pages.adminTeams.player')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start md:self-auto">
                  <button
                    onClick={() => handleEdit(team)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
                    title={t('pages.adminTeams.editTeam')}
                  >
                    <Edit className="w-4 h-4" />
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 hover:bg-red-500/20 transition-colors flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('pages.adminTeams.deleteTeam')}
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="card text-center py-10">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-white/60" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">{t('pages.adminTeams.noTeamsYet')}</h3>
            <p className="text-sm text-white/60">{t('pages.adminTeams.getStartedAddTeams')}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, team: null })}
        onConfirm={confirmDeleteTeam}
        title={t('pages.adminTeams.deleteTeam')}
        message={t('pages.adminTeams.deleteTeamConfirmation').replace('{name}', confirmDelete.team?.name)}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
        isLoading={loading}
      />
    </AdminPageLayout>
  );
};

export default AdminTeams;
