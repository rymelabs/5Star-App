import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFootball } from '../../context/FootballContext';
import { useCompetitions } from '../../context/CompetitionsContext';
import { useAuth } from '../../context/AuthContext';
import { useSoftDelete } from '../../hooks/useSoftDelete';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import AdminPageLayout from '../../components/AdminPageLayout';
import { useLanguage } from '../../context/LanguageContext';
import NewTeamAvatar from '../../components/NewTeamAvatar';
import ConfirmationModal from '../../components/ConfirmationModal';
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, Save, X, Users, Target, Zap, Check, ChevronDown, ChevronUp } from 'lucide-react';

const AdminFixtures = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    ownedFixtures,
    ownedTeams,
    ownedLeagues,
    ownedSeasons,
    addFixture,
    updateFixture,
    activeSeason
  } = useFootball();
  const { ownedCompetitions } = useCompetitions();
  const { softDeleteFixture } = useSoftDelete();

  const fixtures = ownedFixtures;
  const teams = ownedTeams;
  const leagues = ownedLeagues;
  const seasons = ownedSeasons;
  const competitions = ownedCompetitions;
  const { toast, showToast, hideToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, fixture: null });
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
    decidedByPenalties: false,
    penaltyHomeScore: '',
    penaltyAwayScore: '',
    penaltyWinnerId: '',
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
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Group fixtures by competition
  const groupedFixtures = fixtures.reduce((groups, fixture) => {
    const groupName = fixture.competition || 'Friendly';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(fixture);
    return groups;
  }, {});

  const totalFixtures = fixtures.length;
  const upcomingFixtures = fixtures.filter(f => ['scheduled', 'playing', 'live'].includes(f.status)).length;
  const completedFixtures = fixtures.filter(f => ['finished', 'completed'].includes(f.status)).length;
  const uniqueTeams = new Set(fixtures.flatMap(f => [f.homeTeamId, f.awayTeamId].filter(Boolean))).size;

  const handleCreateClick = () => {
    setEditingId(null);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const handlePenaltyToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      decidedByPenalties: checked,
      penaltyHomeScore: checked ? prev.penaltyHomeScore : '',
      penaltyAwayScore: checked ? prev.penaltyAwayScore : '',
      penaltyWinnerId: checked ? prev.penaltyWinnerId : '',
    }));
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
        homeScore: formData.homeScore !== '' ? parseInt(formData.homeScore) : 0,
        awayScore: formData.awayScore !== '' ? parseInt(formData.awayScore) : 0,
        seasonId: formData.seasonId || null,
        leagueId: formData.leagueId || null,
        groupId: formData.groupId || null,
        stage: formData.stage || null,
        decidedByPenalties: formData.decidedByPenalties || false,
        penaltyHomeScore: formData.decidedByPenalties && formData.penaltyHomeScore !== '' ? parseInt(formData.penaltyHomeScore) : null,
        penaltyAwayScore: formData.decidedByPenalties && formData.penaltyAwayScore !== '' ? parseInt(formData.penaltyAwayScore) : null,
        penaltyWinnerId: formData.decidedByPenalties ? (formData.penaltyWinnerId || null) : null,
        homeLineup: formData.homeLineup || [],
        awayLineup: formData.awayLineup || [],
        events: formData.events || []
      };
      
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
      decidedByPenalties: false,
      penaltyHomeScore: '',
      penaltyAwayScore: '',
      penaltyWinnerId: '',
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
      decidedByPenalties: Boolean(fixture.penaltyHomeScore !== null && fixture.penaltyHomeScore !== undefined && fixture.penaltyAwayScore !== null && fixture.penaltyAwayScore !== undefined),
      penaltyHomeScore: fixture.penaltyHomeScore !== null && fixture.penaltyHomeScore !== undefined ? fixture.penaltyHomeScore : '',
      penaltyAwayScore: fixture.penaltyAwayScore !== null && fixture.penaltyAwayScore !== undefined ? fixture.penaltyAwayScore : '',
      penaltyWinnerId: fixture.penaltyWinnerId || '',
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
        decidedByPenalties: formData.decidedByPenalties || false,
        penaltyHomeScore: formData.decidedByPenalties && formData.penaltyHomeScore !== '' ? parseInt(formData.penaltyHomeScore) : null,
        penaltyAwayScore: formData.decidedByPenalties && formData.penaltyAwayScore !== '' ? parseInt(formData.penaltyAwayScore) : null,
        penaltyWinnerId: formData.decidedByPenalties ? (formData.penaltyWinnerId || null) : null,
        homeLineup: formData.homeLineup || [],
        awayLineup: formData.awayLineup || [],
        events: formData.events || []
      };
      
      await updateFixture(editingId, updates);
      
      // Reset form
      handleCancel();
    } catch (error) {
      showToast(t('adminFixtures.updateFailed') + ': ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFixture = (fixture) => {
    setConfirmDelete({ isOpen: true, fixture });
  };

  const confirmDeleteFixture = async () => {
    const fixture = confirmDelete.fixture;
    if (!fixture) return;

    try {
      setLoading(true);
      const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
      const awayTeam = teams.find(t => t.id === fixture.awayTeamId);
      const fixtureName = `${homeTeam?.name || 'Team'} vs ${awayTeam?.name || 'Team'}`;
      
      await softDeleteFixture(fixture);
      showToast(`${fixtureName} moved to recycle bin`, 'success');
      setConfirmDelete({ isOpen: false, fixture: null });
    } catch (error) {
      showToast(t('adminFixtures.deleteFailed') + ': ' + error.message, 'error');
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

  const isKnockoutStage = (() => {
    const stage = (formData.stage || '').toLowerCase();
    return stage.includes('knock') || stage.includes('quarter') || stage.includes('semi') || stage.includes('final');
  })();

  return (
    <AdminPageLayout
      title={t('adminFixtures.title')}
      subtitle="FIXTURE OPS"
      description={t('adminFixtures.getStarted')}
      onBack={() => navigate(-1)}
      actions={[
        {
          label: editingId ? t('adminFixtures.editFixture') : t('adminFixtures.addFixture'),
          icon: Plus,
          onClick: handleCreateClick,
          variant: 'primary',
        },
      ]}
      stats={[
        { label: t('adminFixtures.fixtures'), value: totalFixtures, icon: Calendar },
        { label: t('adminFixtures.scheduled'), value: upcomingFixtures, icon: Clock },
        { label: t('adminFixtures.completed'), value: completedFixtures, icon: Check },
        { label: t('pages.adminTeams.teams'), value: uniqueTeams || teams.length, icon: Users },
      ]}
    >
      <div className="space-y-6">
        {/* Add/Edit Fixture Form */}
        {(showAddForm || editingId) && (
          <div className="card relative overflow-hidden p-4 sm:p-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-purple/10 via-transparent to-blue-500/10 opacity-80" />
            <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white uppercase tracking-[0.3em]">
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

                {/* Penalties (Knockout) */}
                <div className="md:col-span-2 space-y-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white flex items-center gap-2">
                        {t('adminFixtures.penalties') || 'Penalties'}
                        {isKnockoutStage && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200">Knockout</span>}
                      </p>
                      <p className="text-xs text-gray-400">{t('adminFixtures.penaltiesHint') || 'Use when full-time is a draw and decided by shootout.'}</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.decidedByPenalties}
                        onChange={(e) => handlePenaltyToggle(e.target.checked)}
                        className="accent-brand-purple w-4 h-4"
                      />
                      <span>{t('adminFixtures.decidedByPenalties') || 'Decided by penalties'}</span>
                    </label>
                  </div>

                  {formData.decidedByPenalties && (
                    <div className="grid md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">{t('adminFixtures.homePens') || 'Home pens'}</label>
                        <input
                          type="number"
                          name="penaltyHomeScore"
                          value={formData.penaltyHomeScore}
                          onChange={handleInputChange}
                          className="input-field w-full"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">{t('adminFixtures.awayPens') || 'Away pens'}</label>
                        <input
                          type="number"
                          name="penaltyAwayScore"
                          value={formData.penaltyAwayScore}
                          onChange={handleInputChange}
                          className="input-field w-full"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-300 mb-1">{t('adminFixtures.penaltyWinner') || 'Penalty winner'}</label>
                        <select
                          name="penaltyWinnerId"
                          value={formData.penaltyWinnerId}
                          onChange={handleInputChange}
                          className="input-field w-full"
                        >
                          <option value="">{t('adminFixtures.selectWinner') || 'Select winner'}</option>
                          {formData.homeTeam && <option value={formData.homeTeam}>{teams.find(t => t.id === formData.homeTeam)?.name || t('adminFixtures.homeTeam')}</option>}
                          {formData.awayTeam && <option value={formData.awayTeam}>{teams.find(t => t.id === formData.awayTeam)?.name || t('adminFixtures.awayTeam')}</option>}
                        </select>
                        <p className="text-[11px] text-gray-500 mt-1">{t('adminFixtures.penaltyWinnerHint') || 'Only required when the match finished level in normal time.'}</p>
                      </div>
                    </div>
                  )}
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
                        className="flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-white/10 transition-colors"
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
                        className="flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-white/10 transition-colors"
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
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-white/10 transition-colors"
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

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
                >
                  {t('adminFixtures.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.homeTeam || !formData.awayTeam}
                  className="group relative px-5 py-2 bg-gradient-to-r from-brand-purple to-blue-500 text-white rounded-lg text-xs font-semibold uppercase tracking-[0.25em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? (editingId ? t('adminFixtures.updating') : t('adminFixtures.adding')) : (editingId ? t('adminFixtures.updateFixture') : t('adminFixtures.addFixtureButton'))}
                </button>
              </div>
            </form>
            </div>
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
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-brand-purple to-blue-500 text-white text-xs font-semibold uppercase tracking-[0.25em] flex items-center justify-center"
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
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-purple to-blue-500 text-white text-xs font-semibold uppercase tracking-[0.25em] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('adminFixtures.addEventButton')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fixtures List */}
        {fixtures.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedFixtures).map(([groupName, groupFixtures]) => (
              <div key={groupName} className="rounded-xl border border-white/5 bg-[#0b1020]/50 overflow-hidden">
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-brand-purple rounded-full" />
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-white">{groupName}</h3>
                      <p className="text-xs text-gray-400">{groupFixtures.length} {t('adminFixtures.fixtures')}</p>
                    </div>
                  </div>
                  {expandedGroups[groupName] ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {expandedGroups[groupName] && (
                  <div className="p-4 pt-0 space-y-3 border-t border-white/5 mt-2">
                    {groupFixtures.map((fixture) => {
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
                        <div key={fixture.id} className="group relative w-full overflow-hidden rounded-xl border border-white/5 bg-[#0b1020] transition-all hover:border-white/10 hover:bg-[#111629]">
                          {/* Background Gradients */}
                          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-brand-purple/5 blur-3xl transition-opacity group-hover:opacity-75" />
                          <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl transition-opacity group-hover:opacity-75" />

                          {/* Mobile Layout (< lg) */}
                          <div className="lg:hidden p-3 relative">
                            {/* Header: Date & Actions */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-white/40">
                                <span>{dateTime.date}</span>
                                <span className="text-white/20">•</span>
                                <span>{dateTime.time}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEdit(fixture)}
                                  className="p-1.5 rounded hover:bg-brand-purple/20 text-white/60 hover:text-brand-purple transition-colors"
                                  title={t('common.edit')}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFixture(fixture)}
                                  className="p-1.5 rounded hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                                  title={t('common.delete')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Teams & Score Grid */}
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                              {/* Home Team */}
                              <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-end sm:text-right">
                                <span className="font-bold text-white text-xs sm:text-sm order-2 sm:order-1 truncate w-full">
                                  {homeTeam.name}
                                </span>
                                <NewTeamAvatar 
                                  team={homeTeam} 
                                  size={32} 
                                  className="flex-shrink-0 order-1 sm:order-2 h-8 w-8 sm:h-9 sm:w-9" 
                                />
                              </div>

                              {/* Score / VS */}
                              <div className="flex flex-col items-center justify-center rounded-lg bg-black/20 backdrop-blur-sm px-2 py-1 min-w-[50px]">
                                {fixture.status === 'finished' || fixture.status === 'completed' || fixture.status === 'live' ? (
                                  <div className="flex items-center gap-1 text-lg font-bold text-white">
                                    <span>{fixture.homeScore ?? 0}</span>
                                    <span className="text-white/20">-</span>
                                    <span>{fixture.awayScore ?? 0}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-bold text-white/20">VS</span>
                                )}
                                {(fixture.status === 'finished' || fixture.status === 'completed') && (
                                  <span className="text-[8px] font-medium uppercase text-white/40">FT</span>
                                )}
                                {fixture.status === 'live' && (
                                  <span className="text-[8px] font-bold uppercase text-red-500 animate-pulse">LIVE</span>
                                )}
                              </div>

                              {/* Away Team */}
                              <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-start sm:text-left">
                                <NewTeamAvatar 
                                  team={awayTeam} 
                                  size={32} 
                                  className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9" 
                                />
                                <span className="font-bold text-white text-xs sm:text-sm truncate w-full">
                                  {awayTeam.name}
                                </span>
                              </div>
                            </div>

                            {/* Footer: Competition & Status */}
                            <div className="mt-3 flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1 text-white/40 uppercase tracking-wider truncate max-w-[60%]">
                                {fixture.competition && <span className="truncate text-brand-purple">{fixture.competition}</span>}
                                {fixture.round && (
                                  <>
                                    <span className="text-white/20">•</span>
                                    <span className="truncate">{fixture.round}</span>
                                  </>
                                )}
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest ${getStatusColor(fixture.status)}`}>
                                {fixture.status}
                              </span>
                            </div>
                          </div>

                          {/* Desktop Layout (>= lg) */}
                          <div className="hidden lg:flex items-center justify-between p-3 gap-4 relative h-24">
                            {/* Left: Teams & Scores */}
                            <div className="flex flex-col justify-center gap-2 flex-1 min-w-0 h-full">
                              {/* Home Team */}
                              <div className="flex items-center gap-3">
                                <NewTeamAvatar team={homeTeam} size={24} className="flex-shrink-0" />
                                <span className="text-xs font-bold text-white truncate flex-1">{homeTeam.name}</span>
                                <span className={`text-sm font-bold ${fixture.status === 'live' ? 'text-brand-purple' : 'text-white'} w-6 text-center bg-white/5 rounded py-0.5`}>
                                  {fixture.homeScore ?? '-'}
                                </span>
                              </div>

                              {/* Away Team */}
                              <div className="flex items-center gap-3">
                                <NewTeamAvatar team={awayTeam} size={24} className="flex-shrink-0" />
                                <span className="text-xs font-bold text-white truncate flex-1">{awayTeam.name}</span>
                                <span className={`text-sm font-bold ${fixture.status === 'live' ? 'text-brand-purple' : 'text-white'} w-6 text-center bg-white/5 rounded py-0.5`}>
                                  {fixture.awayScore ?? '-'}
                                </span>
                              </div>
                            </div>

                            {/* Middle: Date/Time & Status */}
                            <div className="flex flex-col items-center justify-center gap-1 px-6 border-x border-white/5 min-w-[140px] h-full">
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-white">{dateTime.time}</span>
                                <span className="text-[9px] text-white/40 uppercase tracking-wider">{dateTime.date}</span>
                              </div>
                              {fixture.status === 'live' ? (
                                <span className="mt-1 px-2 py-0.5 rounded-full bg-red-500/10 text-[9px] font-bold text-red-500 animate-pulse uppercase tracking-widest border border-red-500/20">
                                  Live
                                </span>
                              ) : (fixture.status === 'finished' || fixture.status === 'completed') ? (
                                <span className="mt-1 px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-bold text-gray-400 uppercase tracking-widest border border-white/10">
                                  FT
                                </span>
                              ) : (
                                <span className="mt-1 px-2 py-0.5 rounded-full bg-brand-purple/10 text-[9px] font-bold text-brand-purple uppercase tracking-widest border border-brand-purple/20">
                                  Upcoming
                                </span>
                              )}
                            </div>

                            {/* Right: Actions */}
                            <div className="flex flex-col justify-center gap-2 h-full pl-2">
                              <button
                                onClick={() => handleEdit(fixture)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-brand-purple hover:text-white text-white/40 transition-all duration-200 group"
                                title={t('common.edit')}
                              >
                                <Edit className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              </button>
                              <button
                                onClick={() => handleDeleteFixture(fixture)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500 hover:text-white text-white/40 transition-all duration-200 group"
                                title={t('common.delete')}
                              >
                                <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-10">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-white/60" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">{t('adminFixtures.noFixtures')}</h3>
            <p className="text-sm text-white/60 mb-4">{t('adminFixtures.getStarted')}</p>
            <button
              onClick={handleCreateClick}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-purple to-blue-500 text-white text-xs font-semibold uppercase tracking-[0.25em]"
            >
              {t('adminFixtures.addFirstFixture')}
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, fixture: null })}
        onConfirm={confirmDeleteFixture}
        title={t('adminFixtures.deleteFixture') || 'Delete Fixture'}
        message={t('adminFixtures.deleteConfirm') || 'Are you sure you want to delete this fixture? It will be moved to the recycle bin.'}
        confirmText={t('common.delete') || 'Delete'}
        type="danger"
      />

      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={hideToast}
        />
      )}
    </AdminPageLayout>
  );
};

export default AdminFixtures;
