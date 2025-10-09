import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFootball } from '../../context/FootballContext';
import { useCompetitions } from '../../context/CompetitionsContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Clock, MapPin, Save, X, Users, Target, Zap, Check } from 'lucide-react';

const AdminFixtures = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { fixtures, teams, leagues, addFixture, updateFixture, seasons, activeSeason } = useFootball();
  const { competitions } = useCompetitions();
  const { toast, showToast, hideToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    date: '',
    time: '',
    venue: '',
    competition: '',
    round: '',
    status: 'scheduled',
    homeScore: '',
    awayScore: '',
    seasonId: '',
    leagueId: '',
    groupId: '',
    stage: '',
    homeLineup: [],
    awayLineup: [],
    events: []
  });
  const [selectedSeasonGroups, setSelectedSeasonGroups] = useState([]);
  const [showLineupModal, setShowLineupModal] = useState(null); // 'home' or 'away'
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    type: 'goal',
    team: 'home',
    player: '',
    minute: '',
    assistBy: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If season changes, load its groups
    if (name === 'seasonId') {
      const season = seasons.find(s => s.id === value);
      if (season && season.groups) {
        setSelectedSeasonGroups(season.groups);
      } else {
        setSelectedSeasonGroups([]);
      }
      // Reset group and stage when season changes
      setFormData(prev => ({
        ...prev,
        groupId: '',
        stage: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.homeTeam || !formData.awayTeam || !formData.date || !formData.time) return;

    setLoading(true);
    try {
      // Combine date and time into a single dateTime
      const dateTimeString = `${formData.date}T${formData.time}`;
      const dateTime = new Date(dateTimeString);
      
    const fixtureData = {
        homeTeamId: formData.homeTeam,
        awayTeamId: formData.awayTeam,
        dateTime: dateTimeString,
        venue: formData.venue || '',
  // competition resolution: explicit competition -> selected season name -> selected league name -> 'Friendly'
  competition: formData.competition || (formData.seasonId ? (seasons.find(s => s.id === formData.seasonId)?.name) : (formData.leagueId ? (leagues.find(l => l.id === formData.leagueId)?.name) : 'Friendly')),
        round: formData.round || '',
        status: formData.status || 'scheduled',
        homeScore: formData.homeScore || null,
        awayScore: formData.awayScore || null,
        seasonId: formData.seasonId || null,
        leagueId: formData.leagueId || null,
        groupId: formData.groupId || null,
        stage: formData.stage || null,
        homeLineup: formData.homeLineup || [],
        awayLineup: formData.awayLineup || [],
        events: formData.events || []
      };
      
  console.log('Submitting fixture:', fixtureData);
  await addFixture(fixtureData);
      
      // Reset form
      setFormData({
        homeTeam: '',
        awayTeam: '',
        date: '',
        time: '',
        venue: '',
        competition: '',
        round: '',
        status: 'scheduled'
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding fixture:', error);
      showToast(t('adminFixtures.addFailed') + ': ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Lineup Management
  const handleTogglePlayerInLineup = (team, playerId) => {
    const lineupKey = team === 'home' ? 'homeLineup' : 'awayLineup';
    const currentLineup = formData[lineupKey] || [];
    
    if (currentLineup.includes(playerId)) {
      // Remove player from lineup
      setFormData(prev => ({
        ...prev,
        [lineupKey]: currentLineup.filter(id => id !== playerId)
      }));
    } else {
      // Add player to lineup (max 11)
      if (currentLineup.length < 11) {
        setFormData(prev => ({
          ...prev,
          [lineupKey]: [...currentLineup, playerId]
        }));
      } else {
        showToast(t('adminFixtures.maxPlayersWarning'), 'warning');
      }
    }
  };

  // Event Management
  const handleAddEvent = () => {
    if (!eventForm.player || !eventForm.minute) {
      showToast(t('adminFixtures.eventValidation'), 'warning');
      return;
    }

    const newEvent = {
      id: Date.now().toString(),
      type: eventForm.type,
      team: eventForm.team,
      playerId: eventForm.player,
      minute: parseInt(eventForm.minute),
      assistById: eventForm.assistBy || null,
      timestamp: new Date().toISOString()
    };

    setFormData(prev => ({
      ...prev,
      events: [...(prev.events || []), newEvent]
    }));

    // Auto-increment score if it's a goal
    if (eventForm.type === 'goal') {
      const scoreKey = eventForm.team === 'home' ? 'homeScore' : 'awayScore';
      setFormData(prev => ({
        ...prev,
        [scoreKey]: (parseInt(prev[scoreKey]) || 0) + 1
      }));
    }

    // Reset event form
    setEventForm({
      type: 'goal',
      team: 'home',
      player: '',
      minute: '',
      assistBy: ''
    });
    setShowEventModal(false);
  };

  const handleRemoveEvent = (eventId) => {
    const event = formData.events.find(e => e.id === eventId);
    
    // Decrement score if removing a goal
    if (event && event.type === 'goal') {
      const scoreKey = event.team === 'home' ? 'homeScore' : 'awayScore';
      setFormData(prev => ({
        ...prev,
        [scoreKey]: Math.max(0, (parseInt(prev[scoreKey]) || 0) - 1)
      }));
    }

    setFormData(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== eventId)
    }));
  };

  const handleCancel = () => {
    setFormData({
      homeTeam: '',
      awayTeam: '',
      date: '',
      time: '',
      venue: '',
      competition: '',
      round: '',
      status: 'scheduled',
      homeScore: '',
      awayScore: '',
      seasonId: '',
      groupId: '',
      stage: '',
      homeLineup: [],
      awayLineup: [],
      events: []
    });
    setSelectedSeasonGroups([]);
    setShowAddForm(false);
    setEditingId(null);
    setShowLineupModal(null);
    setShowEventModal(false);
  };

  const handleEdit = (fixture) => {
    // Extract date and time from fixture.dateTime
    const dateTime = new Date(fixture.dateTime);
    const date = dateTime.toISOString().split('T')[0];
    const time = dateTime.toTimeString().slice(0, 5);
    
    setFormData({
      homeTeam: fixture.homeTeamId || fixture.homeTeam?.id || '',
      awayTeam: fixture.awayTeamId || fixture.awayTeam?.id || '',
      date: date,
      time: time,
      venue: fixture.venue || '',
    // When prefilling: prefer fixture.competition, then fixture.season name, then fixture.league name
    competition: fixture.competition || (fixture.seasonId ? (seasons.find(s => s.id === fixture.seasonId)?.name) : (fixture.leagueId ? (leagues.find(l => l.id === fixture.leagueId)?.name) : '')),
      round: fixture.round || '',
      status: fixture.status || 'scheduled',
      homeScore: fixture.homeScore !== null && fixture.homeScore !== undefined ? fixture.homeScore : '',
      awayScore: fixture.awayScore !== null && fixture.awayScore !== undefined ? fixture.awayScore : '',
      seasonId: fixture.seasonId || '',
      groupId: fixture.groupId || '',
      stage: fixture.stage || '',
      homeLineup: fixture.homeLineup || [],
      awayLineup: fixture.awayLineup || [],
      events: fixture.events || []
    });
    // Load groups if season is selected
    if (fixture.seasonId) {
      const season = seasons.find(s => s.id === fixture.seasonId);
      if (season && season.groups) {
        setSelectedSeasonGroups(season.groups);
      }
    }
    setEditingId(fixture.id);
    setShowAddForm(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId || !formData.homeTeam || !formData.awayTeam || !formData.date || !formData.time) return;

    setLoading(true);
    try {
      const dateTimeString = `${formData.date}T${formData.time}`;
      const dateTime = new Date(dateTimeString);
      
      const updates = {
        homeTeamId: formData.homeTeam,
        awayTeamId: formData.awayTeam,
        dateTime: dateTime,
        venue: formData.venue || '',
      // competition resolution on update: explicit competition -> season name -> league name -> null
      competition: formData.competition || (formData.seasonId ? (seasons.find(s => s.id === formData.seasonId)?.name) : (formData.leagueId ? (leagues.find(l => l.id === formData.leagueId)?.name) : null)),
        round: formData.round || '',
        status: formData.status || 'scheduled',
        homeScore: formData.homeScore !== '' ? parseInt(formData.homeScore) : null,
        awayScore: formData.awayScore !== '' ? parseInt(formData.awayScore) : null,
        seasonId: formData.seasonId || null,
        groupId: formData.groupId || null,
        stage: formData.stage || null,
        homeLineup: formData.homeLineup || [],
        awayLineup: formData.awayLineup || [],
        events: formData.events || []
      };
      
      await updateFixture(editingId, updates);
      
      // Reset form
      handleCancel();
    } catch (error) {
      console.error('Error updating fixture:', error);
      showToast(t('adminFixtures.updateFailed') + ': ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'text-accent-500 bg-accent-500/20';
      case 'finished': return 'text-gray-400 bg-gray-500/20';
      case 'postponed': return 'text-yellow-500 bg-yellow-500/20';
      case 'cancelled': return 'text-red-500 bg-red-500/20';
      default: return 'text-primary-500 bg-primary-500/20';
    }
  };

  const formatDateTime = (date, time) => {
    const dateObj = new Date(`${date}T${time}`);
    return {
      date: dateObj.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: dateObj.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="mb-4">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="ml-2">
              <h1 className="admin-header">{t('adminFixtures.title')}</h1>
              <p className="text-sm text-gray-400">{fixtures.length} {t('adminFixtures.fixtures')}</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary w-full flex items-center justify-center text-sm py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('adminFixtures.addFixture')}
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Add/Edit Fixture Form */}
        {(showAddForm || editingId) && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? t('adminFixtures.editFixture') : t('adminFixtures.addNewFixture')}
              </h3>
              <button
                onClick={handleCancel}
                className="p-2 rounded-full hover:bg-dark-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={editingId ? handleUpdate : handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.homeTeam')} *
                  </label>
                  <select
                    name="homeTeam"
                    value={formData.homeTeam}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  >
                    <option value="">{t('adminFixtures.selectHomeTeam')}</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.awayTeam')} *
                  </label>
                  <select
                    name="awayTeam"
                    value={formData.awayTeam}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  >
                    <option value="">{t('adminFixtures.selectAwayTeam')}</option>
                    {teams.filter(team => team.id !== formData.homeTeam).map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.date')} *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.time')} *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.venue')}
                  </label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder={t('adminFixtures.stadiumPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.competition')}
                  </label>
                  <select
                    name="competition"
                    value={formData.competition}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  >
                    <option value="">{t('adminFixtures.selectCompetition')}</option>
                    {competitions.map(comp => (
                      <option key={comp.id} value={comp.name}>{comp.name}</option>
                    ))}
                  </select>
                  {competitions.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t('adminFixtures.noCompetitions')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.season')}
                  </label>
                  <select
                    name="seasonId"
                    value={formData.seasonId}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  >
                    <option value="">{t('adminFixtures.noneFriendly')}</option>
                    {seasons.map(season => (
                      <option key={season.id} value={season.id}>
                        {season.name} ({season.year})
                      </option>
                    ))}
                  </select>
                  {seasons.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t('adminFixtures.noSeasons')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.league')}
                  </label>
                  <select
                    name="leagueId"
                    value={formData.leagueId}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  >
                    <option value="">{t('adminFixtures.selectLeague')}</option>
                    {leagues.map(league => (
                      <option key={league.id} value={league.id}>
                        {league.name}
                      </option>
                    ))}
                  </select>
                  {leagues.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t('adminFixtures.noLeagues')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.stage')}
                  </label>
                  <select
                    name="stage"
                    value={formData.stage}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    disabled={!formData.seasonId}
                  >
                    <option value="">{t('adminFixtures.selectStage')}</option>
                    <option value="group">{t('adminFixtures.groupStage')}</option>
                    <option value="knockout">{t('adminFixtures.knockoutStage')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.group')}
                  </label>
                  <select
                    name="groupId"
                    value={formData.groupId}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    disabled={!formData.seasonId || formData.stage !== 'group'}
                  >
                    <option value="">{t('adminFixtures.selectGroup')}</option>
                    {selectedSeasonGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  {formData.stage === 'group' && selectedSeasonGroups.length === 0 && formData.seasonId && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t('adminFixtures.noGroups')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.round')}
                  </label>
                  <input
                    type="text"
                    name="round"
                    value={formData.round}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder={t('adminFixtures.roundPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.status')}
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  >
                    <option value="scheduled">{t('adminFixtures.scheduled')}</option>
                    <option value="live">{t('adminFixtures.live')}</option>
                    <option value="playing">{t('adminFixtures.playing')}</option>
                    <option value="completed">{t('adminFixtures.completed')}</option>
                    <option value="postponed">{t('adminFixtures.postponed')}</option>
                    <option value="cancelled">{t('adminFixtures.cancelled')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.homeScore')}
                  </label>
                  <input
                    type="number"
                    name="homeScore"
                    value={formData.homeScore}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.awayScore')}
                  </label>
                  <input
                    type="number"
                    name="awayScore"
                    value={formData.awayScore}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* Lineup Management Section */}
              {formData.homeTeam && formData.awayTeam && (
                <div className="border-t border-gray-700 pt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {t('adminFixtures.teamLineups')}
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Home Team Lineup */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-300">
                          {teams.find(t => t.id === formData.homeTeam)?.name} {t('adminFixtures.lineup')}
                        </label>
                        <span className="text-xs text-gray-400">
                          {formData.homeLineup.length}/11 {t('adminFixtures.selected')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLineupModal('home')}
                        className="btn-secondary w-full justify-center"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        {t('adminFixtures.selectHomeLineup')}
                      </button>
                      {formData.homeLineup.length > 0 && (
                        <div className="mt-2 text-xs text-gray-400">
                          {formData.homeLineup.length} {formData.homeLineup.length !== 1 ? t('adminFixtures.playersSelected') : t('adminFixtures.playerSelected')}
                        </div>
                      )}
                    </div>

                    {/* Away Team Lineup */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-300">
                          {teams.find(t => t.id === formData.awayTeam)?.name} {t('adminFixtures.lineup')}
                        </label>
                        <span className="text-xs text-gray-400">
                          {formData.awayLineup.length}/11 {t('adminFixtures.selected')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLineupModal('away')}
                        className="btn-secondary w-full justify-center"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        {t('adminFixtures.selectAwayLineup')}
                      </button>
                      {formData.awayLineup.length > 0 && (
                        <div className="mt-2 text-xs text-gray-400">
                          {formData.awayLineup.length} {formData.awayLineup.length !== 1 ? t('adminFixtures.playersSelected') : t('adminFixtures.playerSelected')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Match Events Section */}
              {formData.homeTeam && formData.awayTeam && (formData.homeLineup.length > 0 || formData.awayLineup.length > 0) && (
                <div className="border-t border-gray-700 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      {t('adminFixtures.matchEvents')} ({formData.events.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowEventModal(true)}
                      className="btn-secondary text-sm"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {t('adminFixtures.addEvent')}
                    </button>
                  </div>

                  {/* Events List */}
                  {formData.events.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {formData.events
                        .sort((a, b) => a.minute - b.minute)
                        .map((event) => {
                          const team = teams.find(t => t.id === event.team);
                          const player = team?.players?.find(p => p.id === event.playerId);
                          const assistant = event.assistById ? team?.players?.find(p => p.id === event.assistById) : null;
                          
                          return (
                            <div key={event.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-purple-400 w-8">
                                  {event.minute}'
                                </span>
                                <div className="flex items-center gap-2">
                                  {event.type === 'goal' && <Target className="w-4 h-4 text-green-400" />}
                                  {event.type === 'yellow_card' && <div className="w-3 h-4 bg-yellow-400 rounded-sm" />}
                                  {event.type === 'red_card' && <div className="w-3 h-4 bg-red-500 rounded-sm" />}
                                  <div>
                                    <div className="text-sm text-white">
                                      {player?.name || 'Unknown Player'}
                                      <span className="text-xs text-gray-400 ml-2">({team?.name})</span>
                                    </div>
                                    {assistant && (
                                      <div className="text-xs text-gray-400">
                                        {t('adminFixtures.assist')}: {assistant.name}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveEvent(event.id)}
                                className="text-red-400 hover:text-red-300 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      {t('adminFixtures.noEvents')}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('adminFixtures.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.homeTeam || !formData.awayTeam}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? (editingId ? t('adminFixtures.updating') : t('adminFixtures.adding')) : (editingId ? t('adminFixtures.updateFixture') : t('adminFixtures.addFixtureButton'))}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lineup Selection Modal */}
        {showLineupModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    {t('adminFixtures.selectLineupTitle')} {showLineupModal === 'home' ? t('adminFixtures.home') : t('adminFixtures.away')} {t('adminFixtures.team')}
                  </h3>
                  <button
                    onClick={() => setShowLineupModal(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {t('adminFixtures.selectUpTo11')}
                  {showLineupModal === 'home' && ` • ${formData.homeLineup.length}/11 ${t('adminFixtures.selected')}`}
                  {showLineupModal === 'away' && ` • ${formData.awayLineup.length}/11 ${t('adminFixtures.selected')}`}
                </p>
              </div>

              <div className="p-6">
                {(() => {
                  const teamId = showLineupModal === 'home' ? formData.homeTeam : formData.awayTeam;
                  const team = teams.find(t => t.id === teamId);
                  const lineup = showLineupModal === 'home' ? formData.homeLineup : formData.awayLineup;
                  const players = team?.players || [];

                  if (players.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{t('adminFixtures.noPlayersAdded')}</p>
                        <p className="text-sm mt-1">{t('adminFixtures.addPlayersFirst')}</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {players
                        .sort((a, b) => (a.jerseyNumber || 99) - (b.jerseyNumber || 99))
                        .map((player) => {
                          const isSelected = lineup.includes(player.id);
                          const canSelect = isSelected || lineup.length < 11;

                          return (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => canSelect && handleTogglePlayerInLineup(showLineupModal, player.id)}
                              disabled={!canSelect}
                              className={`w-full p-4 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-500/20'
                                  : canSelect
                                  ? 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                                  : 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                    {player.jerseyNumber || '?'}
                                  </div>
                                  <div className="text-left">
                                    <div className="font-medium text-white flex items-center gap-2">
                                      {player.name}
                                      {player.isCaptain && (
                                        <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/50">
                                          C
                                        </span>
                                      )}
                                      {player.isGoalkeeper && (
                                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/50">
                                          GK
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-400">{player.position}</div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  );
                })()}
              </div>

              <div className="sticky bottom-0 bg-gray-800 p-6 border-t border-gray-700">
                <button
                  onClick={() => setShowLineupModal(null)}
                  className="btn-primary w-full justify-center"
                >
                  {t('adminFixtures.done')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="w-6 h-6" />
                    {t('adminFixtures.addMatchEvent')}
                  </h3>
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      setEventForm({ type: 'goal', team: '', player: '', minute: '', assistBy: '' });
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.eventType')}
                  </label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="goal">⚽ {t('adminFixtures.goal')}</option>
                    <option value="yellow_card">🟨 {t('adminFixtures.yellowCard')}</option>
                    <option value="red_card">🟥 {t('adminFixtures.redCard')}</option>
                  </select>
                </div>

                {/* Team Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.team')}
                  </label>
                  <select
                    value={eventForm.team}
                    onChange={(e) => {
                      setEventForm({ ...eventForm, team: e.target.value, player: '', assistBy: '' });
                    }}
                    className="input-field w-full"
                  >
                    <option value="">{t('adminFixtures.selectTeam')}</option>
                    <option value={formData.homeTeam}>
                      {teams.find(t => t.id === formData.homeTeam)?.name}
                    </option>
                    <option value={formData.awayTeam}>
                      {teams.find(t => t.id === formData.awayTeam)?.name}
                    </option>
                  </select>
                </div>

                {/* Player Selection */}
                {eventForm.team && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('adminFixtures.player')}
                    </label>
                    <select
                      value={eventForm.player}
                      onChange={(e) => setEventForm({ ...eventForm, player: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="">{t('adminFixtures.selectPlayer')}</option>
                      {(() => {
                        const team = teams.find(t => t.id === eventForm.team);
                        const lineup = eventForm.team === formData.homeTeam ? formData.homeLineup : formData.awayLineup;
                        const lineupPlayers = team?.players?.filter(p => lineup.includes(p.id)) || [];
                        
                        return lineupPlayers
                          .sort((a, b) => (a.jerseyNumber || 99) - (b.jerseyNumber || 99))
                          .map(player => (
                            <option key={player.id} value={player.id}>
                              #{player.jerseyNumber} - {player.name}
                            </option>
                          ));
                      })()}
                    </select>
                  </div>
                )}

                {/* Minute */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('adminFixtures.minute')}
                  </label>
                  <input
                    type="number"
                    value={eventForm.minute}
                    onChange={(e) => setEventForm({ ...eventForm, minute: e.target.value })}
                    className="input-field w-full"
                    placeholder={t('adminFixtures.minutePlaceholder')}
                    min="1"
                    max="120"
                  />
                </div>

                {/* Assist (only for goals) */}
                {eventForm.type === 'goal' && eventForm.team && eventForm.player && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('adminFixtures.assistBy')}
                    </label>
                    <select
                      value={eventForm.assistBy}
                      onChange={(e) => setEventForm({ ...eventForm, assistBy: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="">{t('adminFixtures.noAssist')}</option>
                      {(() => {
                        const team = teams.find(t => t.id === eventForm.team);
                        const lineup = eventForm.team === formData.homeTeam ? formData.homeLineup : formData.awayLineup;
                        const lineupPlayers = team?.players?.filter(p => lineup.includes(p.id) && p.id !== eventForm.player) || [];
                        
                        return lineupPlayers
                          .sort((a, b) => (a.jerseyNumber || 99) - (b.jerseyNumber || 99))
                          .map(player => (
                            <option key={player.id} value={player.id}>
                              #{player.jerseyNumber} - {player.name}
                            </option>
                          ));
                      })()}
                    </select>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-700 flex gap-3">
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setEventForm({ type: 'goal', team: '', player: '', minute: '', assistBy: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('adminFixtures.cancel')}
                </button>
                <button
                  onClick={handleAddEvent}
                  disabled={!eventForm.team || !eventForm.player || !eventForm.minute}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('adminFixtures.addEventButton')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fixtures List */}
        <div className="space-y-4">
          {fixtures.map((fixture) => {
            // Handle both old (date/time) and new (dateTime) formats
            let dateTime;
            if (fixture.dateTime) {
              const dt = new Date(fixture.dateTime);
              dateTime = {
                date: dt.toLocaleDateString(),
                time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              };
            } else {
              dateTime = formatDateTime(fixture.date, fixture.time);
            }
            
            // Safely get team data
            const homeTeam = fixture.homeTeam || teams.find(t => t.id === fixture.homeTeamId) || { name: 'Unknown', logo: '' };
            const awayTeam = fixture.awayTeam || teams.find(t => t.id === fixture.awayTeamId) || { name: 'Unknown', logo: '' };
            
            return (
              <div key={fixture.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fixture.status)}`}>
                      {fixture.status.charAt(0).toUpperCase() + fixture.status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-400">{fixture.competition}</span>
                    {fixture.round && (
                      <span className="text-sm text-gray-500">• {fixture.round}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(fixture)}
                      className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                      title="Edit fixture"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t('adminFixtures.deleteConfirm'))) {
                          console.log('Delete fixture:', fixture.id);
                        }
                      }}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title={t('adminFixtures.deleteFixture')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {/* Teams */}
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      {homeTeam.logo && (
                        <img
                          src={homeTeam.logo}
                          alt={homeTeam.name}
                          className="w-8 h-8 object-contain"
                        />
                      )}
                      <span className="font-medium text-white">{homeTeam.name}</span>
                    </div>

                    <div className="flex items-center space-x-2 px-4">
                      {fixture.status === 'finished' ? (
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">
                            {fixture.homeScore} - {fixture.awayScore}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-sm text-gray-400">VS</div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {awayTeam.logo && (
                        <img
                          src={awayTeam.logo}
                          alt={awayTeam.name}
                          className="w-8 h-8 object-contain"
                        />
                      )}
                      <span className="font-medium text-white">{awayTeam.name}</span>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="text-right text-sm text-gray-400 ml-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{dateTime.date}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{dateTime.time}</span>
                    </div>
                    {fixture.venue && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{fixture.venue}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {fixtures.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t('adminFixtures.noFixtures')}</h3>
            <p className="text-gray-400 mb-4">{t('adminFixtures.getStarted')}</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              {t('adminFixtures.addFirstFixture')}
            </button>
          </div>
        )}
      </div>

      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default AdminFixtures;