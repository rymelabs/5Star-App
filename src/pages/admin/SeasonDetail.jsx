import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trophy, 
  Users,
  Calendar,
  CheckCircle2,
  Play,
  Pause,
  Edit,
  TrendingUp,
  Target,
  Eye,
  Clock,
  Plus,
  X,
  Save
} from 'lucide-react';
import { seasonsCollection, fixturesCollection } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useFootball } from '../../context/FootballContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import { calculateGroupStandings } from '../../utils/standingsUtils';
import { getLiveTeamIds } from '../../utils/helpers';

const SeasonDetail = () => {
  const navigate = useNavigate();
  const { seasonId } = useParams();
  const { user } = useAuth();
  const { teams } = useFootball();
  const [season, setSeason] = useState(null);
  const [seasonFixtures, setSeasonFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('groups'); // groups, knockout, fixtures
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Manual fixture creation state
  const [showFixtureModal, setShowFixtureModal] = useState(false);
  const [fixtureForm, setFixtureForm] = useState({
    homeTeamId: '',
    awayTeamId: '',
    groupId: '',
    stage: 'group',
    dateTime: '',
    venue: ''
  });
  const [savingFixture, setSavingFixture] = useState(false);
  
  // Manual knockout round creation state
  const [showKnockoutModal, setShowKnockoutModal] = useState(false);
  const [knockoutForm, setKnockoutForm] = useState({
    roundName: '',
    matches: [{ homeTeamId: '', awayTeamId: '' }]
  });
  const [savingKnockout, setSavingKnockout] = useState(false);

  const [fixtureGenSettings, setFixtureGenSettings] = useState({
    startDate: '',
    spacingDaysMin: 5,
    spacingDaysMax: 9,
    kickoffTimeMin: '14:00',
    kickoffTimeMax: '18:00',
    maxFixtures: '', // Empty means generate all possible fixtures
    venues: [], // List of venue names to randomly assign
    newVenue: '' // Input field for adding new venue
  });

  const liveTeamIds = useMemo(() => getLiveTeamIds(seasonFixtures), [seasonFixtures]);

  const isAdmin = user?.isAdmin;

  useEffect(() => {
    if (seasonId) {
      loadSeason();
      loadSeasonFixtures();
      
      // Set up real-time listener for season (to update standings)
      const unsubscribeSeason = seasonsCollection.onSnapshotById(seasonId, (updatedSeason) => {
        if (updatedSeason) {
          setSeason(updatedSeason);
        }
      });
      
      // Set up real-time listener for fixtures
      const unsubscribeFixtures = fixturesCollection.onSnapshot((updatedFixtures) => {
        const seasonFixturesData = updatedFixtures.filter(f => f.seasonId === seasonId);
        
        // Populate with team data
        const populatedFixtures = seasonFixturesData.map(fixture => {
          const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
          const awayTeam = teams.find(t => t.id === fixture.awayTeamId);
          
          return {
            ...fixture,
            homeTeam: homeTeam || { id: fixture.homeTeamId, name: 'Unknown Team', logo: '' },
            awayTeam: awayTeam || { id: fixture.awayTeamId, name: 'Unknown Team', logo: '' }
          };
        });
        
        setSeasonFixtures(populatedFixtures);
      });
      
      return () => {
        unsubscribeSeason();
        unsubscribeFixtures();
      };
    }
  }, [seasonId, teams]);

  useEffect(() => {
    if (!season) return;
    const toYmd = (value) => {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const d = value ? new Date(value) : new Date();
      if (Number.isNaN(d.getTime())) return '';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    setFixtureGenSettings((prev) => ({
      ...prev,
      startDate: season.startDate ? toYmd(season.startDate) : (prev.startDate || toYmd(new Date()))
    }));
  }, [season]);

  const loadSeason = async () => {
    try {
      setLoading(true);
      const data = await seasonsCollection.getById(seasonId);
      setSeason(data);
    } catch (error) {
      console.error('Error loading season:', error);
      showToast('Failed to load season', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSeasonFixtures = async () => {
    try {
      const fixtures = await fixturesCollection.getBySeason(seasonId);
      
      // Populate with team data
      const populatedFixtures = fixtures.map(fixture => {
        const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
        const awayTeam = teams.find(t => t.id === fixture.awayTeamId);
        
        return {
          ...fixture,
          homeTeam: homeTeam || { id: fixture.homeTeamId, name: 'Unknown Team', logo: '' },
          awayTeam: awayTeam || { id: fixture.awayTeamId, name: 'Unknown Team', logo: '' }
        };
      });
      
      setSeasonFixtures(populatedFixtures);
    } catch (error) {
      console.error('Error loading season fixtures:', error);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleGenerateFixtures = async () => {
    if (!confirm('Generate fixtures for all groups? This will create all group stage matches.')) {
      return;
    }

    try {
      const fixtures = await seasonsCollection.generateGroupFixtures(seasonId, {
        startDate: fixtureGenSettings.startDate || season?.startDate || null,
        spacingDaysMin: fixtureGenSettings.spacingDaysMin,
        spacingDaysMax: fixtureGenSettings.spacingDaysMax,
        kickoffTimeMin: fixtureGenSettings.kickoffTimeMin,
        kickoffTimeMax: fixtureGenSettings.kickoffTimeMax,
        maxFixtures: fixtureGenSettings.maxFixtures || null,
        venues: fixtureGenSettings.venues
      });
      
      // Save fixtures to Firestore
      for (const fixture of fixtures) {
        await fixturesCollection.add({
          ...fixture,
          createdAt: new Date(),
          status: 'upcoming'
        });
      }

      showToast(`Generated ${fixtures.length} fixtures successfully!`, 'success');
    } catch (error) {
      console.error('Error generating fixtures:', error);
      showToast('Failed to generate fixtures', 'error');
    }
  };

  const handleDeleteSeasonFixtures = async () => {
    if (!confirm('⚠️ DELETE all fixtures for this season? This action cannot be undone!')) {
      return;
    }

    try {
      const deletedCount = await fixturesCollection.deleteBySeason(seasonId);
      showToast(`Deleted ${deletedCount} fixtures successfully!`, 'success');
    } catch (error) {
      console.error('Error deleting fixtures:', error);
      showToast('Failed to delete fixtures', 'error');
    }
  };

  const handleCleanupBrokenFixtures = async () => {
    if (!confirm('Clean up broken fixtures? This will delete all fixtures with missing team IDs.')) {
      return;
    }

    try {
      const deletedCount = await fixturesCollection.cleanupBrokenFixtures();
      showToast(`Cleaned up ${deletedCount} broken fixtures!`, 'success');
    } catch (error) {
      console.error('Error cleaning up fixtures:', error);
      showToast('Failed to cleanup fixtures', 'error');
    }
  };

  const handleRegenerateFixtures = async () => {
    if (!confirm('⚠️ REGENERATE all fixtures? This will delete existing fixtures and create new ones with correct team IDs.')) {
      return;
    }

    try {
      // Step 1: Delete existing fixtures
      const deletedCount = await fixturesCollection.deleteBySeason(seasonId);
      
      // Step 2: Generate new fixtures
      const fixtures = await seasonsCollection.generateGroupFixtures(seasonId, {
        startDate: fixtureGenSettings.startDate || season?.startDate || null,
        spacingDaysMin: fixtureGenSettings.spacingDaysMin,
        spacingDaysMax: fixtureGenSettings.spacingDaysMax,
        kickoffTimeMin: fixtureGenSettings.kickoffTimeMin,
        kickoffTimeMax: fixtureGenSettings.kickoffTimeMax,
        maxFixtures: fixtureGenSettings.maxFixtures || null,
        venues: fixtureGenSettings.venues
      });
      
      // Step 3: Save new fixtures
      for (const fixture of fixtures) {
        await fixturesCollection.add({
          ...fixture,
          createdAt: new Date(),
          status: 'upcoming'
        });
      }

      showToast(`✅ Deleted ${deletedCount} old fixtures and generated ${fixtures.length} new fixtures!`, 'success');
    } catch (error) {
      console.error('Error regenerating fixtures:', error);
      showToast('Failed to regenerate fixtures', 'error');
    }
  };

  const handleAddMoreFixtures = async () => {
    const addCount = parseInt(fixtureGenSettings.maxFixtures, 10);
    if (!addCount || addCount < 1) {
      showToast('Enter the number of fixtures to add in "Max fixtures" field', 'error');
      return;
    }

    if (!confirm(`Add ${addCount} more fixtures to existing ones?`)) {
      return;
    }

    try {
      // Generate fixtures with the add count as max, app will handle avoiding duplicates
      const fixtures = await seasonsCollection.generateGroupFixtures(seasonId, {
        startDate: fixtureGenSettings.startDate || season?.startDate || null,
        spacingDaysMin: fixtureGenSettings.spacingDaysMin,
        spacingDaysMax: fixtureGenSettings.spacingDaysMax,
        kickoffTimeMin: fixtureGenSettings.kickoffTimeMin,
        kickoffTimeMax: fixtureGenSettings.kickoffTimeMax,
        maxFixtures: addCount,
        venues: fixtureGenSettings.venues,
        existingFixtures: seasonFixtures // Pass existing fixtures to avoid duplicates
      });
      
      // Save fixtures to Firestore
      for (const fixture of fixtures) {
        await fixturesCollection.add({
          ...fixture,
          createdAt: new Date(),
          status: 'upcoming'
        });
      }

      showToast(`Added ${fixtures.length} new fixtures!`, 'success');
    } catch (error) {
      console.error('Error adding fixtures:', error);
      showToast('Failed to add fixtures', 'error');
    }
  };

  const handleProcessRelegation = async () => {
    const relegationPos = Number.isFinite(Number(season?.relegationPosition)) ? Number(season.relegationPosition) : null;
    const destinationSeasonId = season?.relegationDestinationSeasonId;

    if (!relegationPos) {
      showToast('Set relegation position first (Edit season).', 'error');
      return;
    }
    if (!destinationSeasonId) {
      showToast('Select a relegation destination season (Edit season).', 'error');
      return;
    }
    if (!confirm('Move teams in the relegation zone to the destination season now?')) {
      return;
    }

    try {
      const destination = await seasonsCollection.getById(destinationSeasonId);
      if (!destination) {
        showToast('Destination season not found.', 'error');
        return;
      }

      const relegatedTeamIds = new Set();
      const relegatedTeams = [];

      (season.groups || []).forEach((group) => {
        const computed = calculateGroupStandings(group, seasonFixtures, teams, season.id);
        computed
          .filter((row) => row.position >= relegationPos)
          .forEach((row) => {
            const teamId = row.teamId || row.team?.id;
            if (!teamId || relegatedTeamIds.has(teamId)) return;
            relegatedTeamIds.add(teamId);
            const resolved = teams.find((t) => t.id === teamId) || row.team || { id: teamId, name: 'Unknown Team' };
            relegatedTeams.push(resolved);
          });
      });

      if (relegatedTeams.length === 0) {
        showToast('No relegated teams found (need completed fixtures).', 'error');
        return;
      }

      const destGroups = Array.isArray(destination.groups) && destination.groups.length
        ? JSON.parse(JSON.stringify(destination.groups))
        : [{ id: 'group-1', name: 'Relegation', teams: [], standings: [] }];

      const destGroupIndex = 0;
      const destGroup = destGroups[destGroupIndex];
      const existingIds = new Set((destGroup.teams || []).map((t) => t?.id || t?.teamId).filter(Boolean));
      const maxTeams = Number.isFinite(Number(destination.teamsPerGroup)) ? Number(destination.teamsPerGroup) : null;

      const toAdd = [];
      for (const team of relegatedTeams) {
        const teamId = team?.id || team?.teamId;
        if (!teamId || existingIds.has(teamId)) continue;
        if (maxTeams && (destGroup.teams?.length || 0) + toAdd.length >= maxTeams) break;
        toAdd.push(team);
        existingIds.add(teamId);
      }

      if (toAdd.length === 0) {
        showToast('All relegated teams already exist in destination season.', 'success');
        return;
      }

      destGroups[destGroupIndex] = {
        ...destGroup,
        teams: [...(destGroup.teams || []), ...toAdd]
      };

      await seasonsCollection.update(destinationSeasonId, {
        groups: destGroups,
        updatedAt: new Date()
      });

      await seasonsCollection.update(seasonId, {
        relegationProcessedAt: new Date(),
        relegationMovedTeamIds: Array.from(relegatedTeamIds),
        updatedAt: new Date()
      });

      showToast(`Moved ${toAdd.length} teams to destination season.`, 'success');
    } catch (error) {
      console.error('Error processing relegation:', error);
      showToast('Failed to process relegation', 'error');
    }
  };

  const handleCompleteSeason = async () => {
    if (!confirm('Mark this season as completed?')) return;

    try {
      await seasonsCollection.update(seasonId, {
        status: 'completed',
        isActive: false,
        completedAt: new Date(),
        updatedAt: new Date()
      });

      showToast('Season marked as completed.', 'success');

      if (season?.autoMoveRelegatedTeams && season?.relegationDestinationSeasonId) {
        await handleProcessRelegation();
      }
    } catch (error) {
      console.error('Error completing season:', error);
      showToast('Failed to complete season', 'error');
    }
  };

  const handleSeedKnockout = async () => {
    if (!confirm('Seed knockout stage? This will automatically create knockout brackets from group qualifiers.')) {
      return;
    }

    try {
      const qualifiersPerGroup = season.knockoutConfig?.qualifiersPerGroup || 2;
      await seasonsCollection.seedKnockoutStage(seasonId, qualifiersPerGroup);
      showToast('Knockout stage seeded successfully!', 'success');
      loadSeason(); // Reload to show updated knockout rounds
    } catch (error) {
      console.error('Error seeding knockout:', error);
      showToast('Failed to seed knockout stage', 'error');
    }
  };

  const handleToggleActive = async () => {
    try {
      const newActiveState = !season.isActive;
      await seasonsCollection.toggleActive(seasonId, newActiveState);
      showToast(newActiveState ? 'Season activated!' : 'Season deactivated!', 'success');
      loadSeason();
    } catch (error) {
      console.error('Error toggling season active state:', error);
      showToast('Failed to update season', 'error');
    }
  };

  // Get all teams in this season (from groups)
  const seasonTeams = useMemo(() => {
    if (!season?.groups) return [];
    return season.groups.flatMap(g => g.teams || []);
  }, [season]);

  // Manual fixture creation handler
  const handleCreateFixture = async () => {
    if (!fixtureForm.homeTeamId || !fixtureForm.awayTeamId) {
      showToast('Please select both home and away teams', 'error');
      return;
    }
    if (fixtureForm.homeTeamId === fixtureForm.awayTeamId) {
      showToast('Home and away teams must be different', 'error');
      return;
    }

    try {
      setSavingFixture(true);
      const homeTeam = seasonTeams.find(t => t.id === fixtureForm.homeTeamId);
      const awayTeam = seasonTeams.find(t => t.id === fixtureForm.awayTeamId);
      const group = season.groups?.find(g => g.id === fixtureForm.groupId);

      const fixtureData = {
        seasonId: seasonId, // Explicitly set the season ID
        seasonName: season.name || null,
        homeTeamId: fixtureForm.homeTeamId,
        awayTeamId: fixtureForm.awayTeamId,
        homeTeam: homeTeam || null,
        awayTeam: awayTeam || null,
        groupId: fixtureForm.groupId || null,
        groupName: group?.name || null,
        stage: fixtureForm.stage,
        dateTime: fixtureForm.dateTime ? new Date(fixtureForm.dateTime).toISOString() : new Date().toISOString(),
        venue: fixtureForm.venue || null,
        status: 'upcoming',
        homeScore: null,
        awayScore: null,
        createdAt: new Date(),
        createdManually: true
      };

      await fixturesCollection.add(fixtureData);

      showToast('Fixture created successfully!', 'success');
      setShowFixtureModal(false);
      setFixtureForm({ homeTeamId: '', awayTeamId: '', groupId: '', stage: 'group', dateTime: '', venue: '' });
    } catch (error) {
      console.error('Error creating fixture:', error);
      showToast('Failed to create fixture', 'error');
    } finally {
      setSavingFixture(false);
    }
  };

  // Manual knockout round creation handler
  const handleCreateKnockoutRound = async () => {
    if (!knockoutForm.roundName.trim()) {
      showToast('Please enter a round name', 'error');
      return;
    }

    const validMatches = knockoutForm.matches.filter(m => m.homeTeamId && m.awayTeamId && m.homeTeamId !== m.awayTeamId);
    if (validMatches.length === 0) {
      showToast('Please add at least one valid match', 'error');
      return;
    }

    try {
      setSavingKnockout(true);
      
      const existingRounds = season.knockoutConfig?.rounds || [];
      const nextRoundNumber = existingRounds.length + 1;

      const newRound = {
        roundNumber: nextRoundNumber,
        name: knockoutForm.roundName.trim(),
        completed: false,
        matches: validMatches.map((match, idx) => {
          const homeTeam = seasonTeams.find(t => t.id === match.homeTeamId);
          const awayTeam = seasonTeams.find(t => t.id === match.awayTeamId);
          return {
            matchNumber: idx + 1,
            homeTeam: { teamId: match.homeTeamId, team: homeTeam || null },
            awayTeam: { teamId: match.awayTeamId, team: awayTeam || null }
          };
        })
      };

      await seasonsCollection.update(seasonId, {
        knockoutConfig: {
          ...season.knockoutConfig,
          rounds: [...existingRounds, newRound]
        }
      });

      showToast('Knockout round created successfully!', 'success');
      setShowKnockoutModal(false);
      setKnockoutForm({ roundName: '', matches: [{ homeTeamId: '', awayTeamId: '' }] });
      loadSeason();
    } catch (error) {
      console.error('Error creating knockout round:', error);
      showToast('Failed to create knockout round', 'error');
    } finally {
      setSavingKnockout(false);
    }
  };

  // Add match to knockout form
  const addKnockoutMatch = () => {
    setKnockoutForm(prev => ({
      ...prev,
      matches: [...prev.matches, { homeTeamId: '', awayTeamId: '' }]
    }));
  };

  // Remove match from knockout form
  const removeKnockoutMatch = (index) => {
    if (knockoutForm.matches.length <= 1) return;
    setKnockoutForm(prev => ({
      ...prev,
      matches: prev.matches.filter((_, i) => i !== index)
    }));
  };

  // Update knockout match team
  const updateKnockoutMatch = (index, side, teamId) => {
    setKnockoutForm(prev => ({
      ...prev,
      matches: prev.matches.map((m, i) => i === index ? { ...m, [side]: teamId } : m)
    }));
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-6">You need admin privileges to access this page.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-white mb-4">Season Not Found</h2>
          <p className="text-gray-400 mb-6">The season you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/admin/seasons')} className="btn-primary">
            Back to Seasons
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      ongoing: 'bg-green-500/20 text-green-400 border-green-500/30',
      completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return badges[status] || badges.upcoming;
  };

  return (
    <div className="px-4 py-6 pb-24">
      {/* Toast - positioned below fixed header */}
      {toast.show && (
        <div className={`fixed top-20 right-4 z-[9999] px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start flex-1 min-w-0">
            <button
              onClick={() => navigate('/admin/seasons')}
              className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors mr-2 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            {/* Season Logo */}
            <div className="w-12 h-12 rounded-lg bg-dark-700 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 mr-3">
              {season.logo ? (
                <img 
                  src={season.logo} 
                  alt={season.name} 
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                />
              ) : null}
              <span className={`text-xl ${season.logo ? 'hidden' : ''}`}>🏆</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="admin-header truncate">{season.name}</h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {season.isActive && (
                    <span className="px-2 py-1 text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded whitespace-nowrap">
                      Active
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs font-medium border rounded whitespace-nowrap ${getStatusBadge(season.status)}`}>
                    {season.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400">Season {season.year}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleToggleActive}
            className={`flex-1 sm:flex-none px-4 py-2 border rounded-lg transition-colors flex items-center justify-center space-x-2 ${season.isActive ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20' : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'}`}
          >
            {season.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="text-sm">{season.isActive ? 'Deactivate' : 'Activate'}</span>
          </button>
          {season.status !== 'completed' && (
            <button
              onClick={handleCompleteSeason}
              className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Complete</span>
            </button>
          )}
          <button
            onClick={() => navigate(`/admin/seasons/${seasonId}/edit`)}
            className="flex-1 sm:flex-none px-4 py-2 bg-accent-500/10 text-accent-400 border border-accent-500/30 rounded-lg hover:bg-accent-500/20 transition-colors flex items-center justify-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span className="text-sm">Edit</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
              </div>
              <p className="text-lg md:text-lg font-bold text-white">{season.numberOfGroups}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 truncate">Groups</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-accent-500/10 rounded-lg">
                <Trophy className="w-4 h-4 md:w-5 md:h-5 text-accent-400" />
              </div>
              <p className="text-lg md:text-lg font-bold text-white">{season.teamsPerGroup}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 truncate">Teams/Group</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-primary-500/10 rounded-lg">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-primary-400" />
              </div>
              <p className="text-lg md:text-lg font-bold text-white">
                {season.groups?.reduce((sum, g) => sum + (g.teams?.length || 0), 0) || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 truncate">Total Teams</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
              </div>
              <p className="text-lg md:text-lg font-bold text-white">
                {season.knockoutConfig?.qualifiersPerGroup || 2}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 truncate">Per Group</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixture Generation Settings */}
      <div className="card p-4 mb-4">
        <h3 className="text-sm font-semibold text-white mb-3">Fixture Generation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Start date</label>
            <input
              type="date"
              value={fixtureGenSettings.startDate}
              onChange={(e) => setFixtureGenSettings((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Spacing min (days)</label>
            <input
              type="number"
              min="1"
              value={fixtureGenSettings.spacingDaysMin}
              onChange={(e) => setFixtureGenSettings((prev) => ({ ...prev, spacingDaysMin: e.target.value === '' ? '' : parseInt(e.target.value, 10) }))}
              onBlur={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!val || val < 1) setFixtureGenSettings((prev) => ({ ...prev, spacingDaysMin: 5 }));
              }}
              className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Spacing max (days)</label>
            <input
              type="number"
              min="1"
              value={fixtureGenSettings.spacingDaysMax}
              onChange={(e) => setFixtureGenSettings((prev) => ({ ...prev, spacingDaysMax: e.target.value === '' ? '' : parseInt(e.target.value, 10) }))}
              onBlur={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!val || val < 1) setFixtureGenSettings((prev) => ({ ...prev, spacingDaysMax: 9 }));
              }}
              className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Kickoff min</label>
            <input
              type="time"
              value={fixtureGenSettings.kickoffTimeMin}
              onChange={(e) => setFixtureGenSettings((prev) => ({ ...prev, kickoffTimeMin: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Kickoff max</label>
            <input
              type="time"
              value={fixtureGenSettings.kickoffTimeMax}
              onChange={(e) => setFixtureGenSettings((prev) => ({ ...prev, kickoffTimeMax: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Max fixtures</label>
            <input
              type="number"
              min="1"
              placeholder="All"
              value={fixtureGenSettings.maxFixtures}
              onChange={(e) => setFixtureGenSettings((prev) => ({ ...prev, maxFixtures: e.target.value === '' ? '' : parseInt(e.target.value, 10) }))}
              className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Venue Management */}
        <div className="mt-4">
          <label className="block text-xs text-gray-400 mb-1">Venues (random assignment)</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add venue name..."
              value={fixtureGenSettings.newVenue}
              onChange={(e) => setFixtureGenSettings((prev) => ({ ...prev, newVenue: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && fixtureGenSettings.newVenue.trim()) {
                  setFixtureGenSettings((prev) => ({
                    ...prev,
                    venues: [...prev.venues, prev.newVenue.trim()],
                    newVenue: ''
                  }));
                }
              }}
              className="flex-1 px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            />
            <button
              type="button"
              onClick={() => {
                if (fixtureGenSettings.newVenue.trim()) {
                  setFixtureGenSettings((prev) => ({
                    ...prev,
                    venues: [...prev.venues, prev.newVenue.trim()],
                    newVenue: ''
                  }));
                }
              }}
              className="px-3 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white text-sm"
            >
              Add
            </button>
          </div>
          {fixtureGenSettings.venues.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {fixtureGenSettings.venues.map((venue, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-dark-600 rounded-lg text-xs text-gray-300"
                >
                  {venue}
                  <button
                    type="button"
                    onClick={() => setFixtureGenSettings((prev) => ({
                      ...prev,
                      venues: prev.venues.filter((_, i) => i !== idx)
                    }))}
                    className="text-gray-400 hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Fixtures get random spacing, kickoff times, and venues (if added). Leave "Max fixtures" empty for all possible matches.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
        <button
          onClick={handleGenerateFixtures}
          className="card p-3 hover:bg-dark-800/50 transition-colors text-left"
        >
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-green-500/10 rounded-lg flex-shrink-0">
              <Calendar className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-green-400 text-sm truncate">Generate Fixtures</h3>
              <p className="text-xs text-gray-400 truncate">Create all group stage matches</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleRegenerateFixtures}
          className="card p-3 hover:bg-dark-800/50 transition-colors text-left border border-orange-500/30"
        >
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-orange-500/10 rounded-lg flex-shrink-0">
              <Calendar className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-orange-400 text-sm truncate">🔄 Regenerate Fixtures</h3>
              <p className="text-xs text-gray-400 truncate">Delete & recreate all fixtures</p>
            </div>
          </div>
        </button>

        {seasonFixtures.length > 0 && (
          <button
            onClick={handleAddMoreFixtures}
            className="card p-3 hover:bg-dark-800/50 transition-colors text-left border border-blue-500/30"
          >
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg flex-shrink-0">
                <Plus className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-blue-400 text-sm truncate">➕ Add More Fixtures</h3>
                <p className="text-xs text-gray-400 truncate">Add to existing ({seasonFixtures.length} fixtures)</p>
              </div>
            </div>
          </button>
        )}

        <button
          onClick={handleSeedKnockout}
          className="card p-3 hover:bg-dark-800/50 transition-colors text-left"
        >
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-primary-500/10 rounded-lg flex-shrink-0">
              <Trophy className="w-4 h-4 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm truncate">Seed Knockout Stage</h3>
              <p className="text-xs text-gray-400 truncate">Generate knockout brackets</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleCleanupBrokenFixtures}
          className="card p-3 hover:bg-dark-800/50 transition-colors text-left border border-red-500/30"
        >
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-red-500/10 rounded-lg flex-shrink-0">
              <Target className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-red-400 text-sm truncate">🧹 Cleanup Broken Fixtures</h3>
              <p className="text-xs text-gray-400 truncate">Remove fixtures with missing teams</p>
            </div>
          </div>
        </button>

        {season.autoMoveRelegatedTeams && season.relegationDestinationSeasonId && Number.isFinite(Number(season.relegationPosition)) && (
          <button
            onClick={handleProcessRelegation}
            className="card p-3 hover:bg-dark-800/50 transition-colors text-left border border-red-500/30"
          >
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-red-500/10 rounded-lg flex-shrink-0">
                <Target className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-red-400 text-sm truncate">Process Relegation</h3>
                <p className="text-xs text-gray-400 truncate">Move relegated teams to destination season</p>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-nav flex space-x-1 mb-6 bg-dark-800 p-1 rounded-lg overflow-x-auto">
        {[
          { id: 'groups', label: 'Groups', icon: Users },
          { id: 'knockout', label: 'Knockout', icon: Trophy },
          { id: 'fixtures', label: 'Fixtures', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[90px] px-2.5 sm:px-3 py-1.5 rounded-lg font-medium text-xs transition-colors flex items-center justify-center space-x-1 sm:space-x-1.5 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-3 h-3 flex-shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          {season.groups?.map((group) => {
            // Compute standings from fixtures using shared utility
            const computedStandings = calculateGroupStandings(group, seasonFixtures, teams, season.id);
            const relegationPos = Number.isFinite(Number(season?.relegationPosition)) ? Number(season.relegationPosition) : null;
            
            return (
            <div key={group.id} className="card p-3 sm:p-4">
              <h3 className="text-sm sm:text-base font-semibold text-white mb-3 truncate">{group.name}</h3>
              
              {/* Group Standings */}
              {computedStandings.length > 0 ? (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full">
                      <thead className="text-xs text-gray-400 uppercase border-b border-gray-700">
                        <tr>
                          <th className="text-left py-2 px-2 sm:px-0 sticky left-0 bg-dark-700 sm:bg-transparent z-10">Pos</th>
                          <th className="text-left py-2 px-2 sticky left-8 sm:left-0 bg-dark-700 sm:bg-transparent z-10 min-w-[120px] sm:min-w-0">Team</th>
                          <th className="text-center py-2 px-1 sm:px-2">P</th>
                          <th className="text-center py-2 px-1 sm:px-2">W</th>
                          <th className="text-center py-2 px-1 sm:px-2">D</th>
                          <th className="text-center py-2 px-1 sm:px-2">L</th>
                          <th className="text-center py-2 px-1 sm:px-2">GF</th>
                          <th className="text-center py-2 px-1 sm:px-2">GA</th>
                          <th className="text-center py-2 px-1 sm:px-2">GD</th>
                          <th className="text-center py-2 px-1 sm:px-2">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs sm:text-sm">
                        {computedStandings.map((standing) => (
                            <tr
                              key={standing.teamId}
                              className={`border-b border-gray-700/50 ${
                                relegationPos && Number(standing.position) >= relegationPos ? 'bg-red-500/[0.04]' : ''
                              }`}
                            >
                              <td
                                className={`py-3 px-2 sm:px-0 sticky left-0 bg-dark-700 sm:bg-transparent z-10 ${
                                  relegationPos && Number(standing.position) >= relegationPos ? 'text-red-400 font-semibold' : 'text-white'
                                }`}
                              >
                                {standing.position}
                              </td>
                              <td className="py-3 px-2 sticky left-8 sm:left-0 bg-dark-700 sm:bg-transparent z-10">
                                <div className="flex items-center space-x-2 min-w-[120px] sm:min-w-0 max-w-[140px] sm:max-w-[200px]">
                                  {standing.team?.logo && (
                                    <img
                                      src={standing.team?.logo}
                                      alt={standing.team?.name}
                                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                                      onError={(e) => e.target.style.display = 'none'}
                                    />
                                  )}
                                  <span
                                    className={`truncate ${(standing.teamId || standing.team?.id) && liveTeamIds.has(standing.teamId || standing.team?.id) ? 'text-red-400' : 'text-white'}`}
                                    title={standing.team?.name}
                                  >
                                    {standing.team?.name}
                                  </span>
                                </div>
                              </td>
                              <td className="text-center text-gray-300 px-1 sm:px-2">{standing.played}</td>
                              <td className="text-center text-gray-300 px-1 sm:px-2">{standing.won}</td>
                              <td className="text-center text-gray-300 px-1 sm:px-2">{standing.drawn}</td>
                              <td className="text-center text-gray-300 px-1 sm:px-2">{standing.lost}</td>
                              <td className="text-center text-gray-300 px-1 sm:px-2">{standing.goalsFor}</td>
                              <td className="text-center text-gray-300 px-1 sm:px-2">{standing.goalsAgainst}</td>
                              <td className={`text-center px-1 sm:px-2 font-medium ${
                                standing.goalDifference > 0 ? 'text-green-400' : 
                                standing.goalDifference < 0 ? 'text-red-400' : 
                                'text-gray-400'
                              }`}>
                                {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                              </td>
                              <td className="text-center font-semibold text-white px-1 sm:px-2">{standing.points}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">No teams in this group yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Add teams to this group to see standings
                  </p>
                </div>
              )}
            </div>
          )})}
        </div>
      )}

      {activeTab === 'knockout' && (
        <div className="card p-3 sm:p-4">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm sm:text-base font-semibold text-white">Knockout Rounds</h3>
            <button
              onClick={() => setShowKnockoutModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/20 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Round</span>
            </button>
          </div>
          
          {season.knockoutConfig?.rounds && season.knockoutConfig.rounds.length > 0 ? (
            <div className="space-y-4">
              {season.knockoutConfig.rounds.map((round) => (
                <div key={round.roundNumber}>
                  <h3 className="text-sm sm:text-base font-semibold text-white mb-3">{round.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                    {round.matches.map((match) => (
                      <div key={match.matchNumber} className="p-3 sm:p-4 bg-dark-800 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <img
                              src={match.homeTeam?.team?.logo}
                              alt={match.homeTeam?.team?.name}
                              className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                            <span className="text-white text-sm sm:text-base truncate">{match.homeTeam?.team?.name || 'TBD'}</span>
                          </div>
                          <span className="text-gray-400 text-xs sm:text-sm text-center flex-shrink-0">vs</span>
                          <div className="flex items-center space-x-2 flex-1 min-w-0 sm:justify-end">
                            <span className="text-white text-sm sm:text-base truncate sm:order-2">{match.awayTeam?.team?.name || 'TBD'}</span>
                            <img
                              src={match.awayTeam?.team?.logo}
                              alt={match.awayTeam?.team?.name}
                              className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0 sm:order-1"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Knockout Stage Not Set</h3>
              <p className="text-sm text-gray-400 mb-6 px-4">
                Seed automatically from group results or create rounds manually
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleSeedKnockout}
                  className="btn-primary text-sm sm:text-base"
                >
                  Seed Knockout Stage
                </button>
                <button
                  onClick={() => setShowKnockoutModal(true)}
                  className="px-4 py-2 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Manually
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'fixtures' && (
        <div className="space-y-4">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-semibold text-white">Fixtures ({seasonFixtures.length})</h3>
            <button
              onClick={() => setShowFixtureModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Fixture</span>
            </button>
          </div>
          
          {seasonFixtures.length === 0 ? (
            <div className="card p-3 sm:p-4">
              <div className="text-center py-6 sm:py-8">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-600" />
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2">No Fixtures Yet</h3>
                <p className="text-xs sm:text-sm text-gray-400 px-4 mb-4">
                  Generate fixtures automatically or create them manually
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleGenerateFixtures}
                    className="btn-primary text-sm"
                  >
                    Generate All Fixtures
                  </button>
                  <button
                    onClick={() => setShowFixtureModal(true)}
                    className="px-4 py-2 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Manually
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Group fixtures by group */}
              {(() => {
                // Group fixtures by groupId
                const groupedFixtures = seasonFixtures.reduce((acc, fixture) => {
                  const key = fixture.groupId || fixture.stage || 'other';
                  if (!acc[key]) {
                    acc[key] = {
                      name: fixture.groupName || (fixture.stage ? fixture.stage.charAt(0).toUpperCase() + fixture.stage.slice(1) : 'Other Fixtures'),
                      fixtures: []
                    };
                  }
                  acc[key].fixtures.push(fixture);
                  return acc;
                }, {});

                return Object.entries(groupedFixtures).map(([key, data]) => (
                  <div key={key} className="card p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-semibold text-white mb-3">
                      {data.name} ({data.fixtures.length} fixtures)
                    </h3>
                    
                    <div className="space-y-2">
                      {data.fixtures.map((fixture) => (
                        <div 
                          key={fixture.id}
                          className="p-2 sm:p-3 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            {/* Teams */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              {/* Home Team */}
                              <div className="flex items-center gap-2 flex-1 justify-end min-w-0 max-w-[40%]">
                                <span className="text-sm font-medium text-white truncate" title={fixture.homeTeam?.name}>
                                  {fixture.homeTeam?.name}
                                </span>
                                {fixture.homeTeam?.logo && (
                                  <img
                                    src={fixture.homeTeam.logo}
                                    alt={fixture.homeTeam.name}
                                    className="w-6 h-6 object-contain flex-shrink-0"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                )}
                              </div>

                              {/* Score or VS */}
                              <div className="flex items-center gap-2 px-3 flex-shrink-0">
                                {fixture.status === 'completed' ? (
                                  <div className="text-center">
                                    <div className="text-base font-bold text-white">
                                      {fixture.homeScore} - {fixture.awayScore}
                                    </div>
                                    <div className="text-xs text-gray-500">FT</div>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <div className="text-sm font-semibold text-primary-500">VS</div>
                                    {fixture.dateTime && (
                                      <div className="text-xs text-gray-400 mt-1">
                                        {new Date(fixture.dateTime).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Away Team */}
                              <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[40%]">
                                {fixture.awayTeam?.logo && (
                                  <img
                                    src={fixture.awayTeam.logo}
                                    alt={fixture.awayTeam.name}
                                    className="w-6 h-6 object-contain flex-shrink-0"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                )}
                                <span className="text-sm font-medium text-white truncate" title={fixture.awayTeam?.name}>
                                  {fixture.awayTeam?.name}
                                </span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <button
                              onClick={() => navigate(`/fixtures/${fixture.id}`)}
                              className="p-2 text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors flex-shrink-0"
                              title="View fixture details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Fixture Info */}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                            {fixture.dateTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(fixture.dateTime).toLocaleString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded capitalize ${
                              fixture.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              fixture.status === 'live' ? 'bg-red-500/20 text-red-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {fixture.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </>
          )}
        </div>
      )}

      {/* Manual Fixture Creation Modal */}
      {showFixtureModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-dark-800 rounded-xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Create Fixture</h2>
              <button
                onClick={() => setShowFixtureModal(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Stage Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stage</label>
                <select
                  value={fixtureForm.stage}
                  onChange={(e) => setFixtureForm(prev => ({ ...prev, stage: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="group">Group Stage</option>
                  <option value="knockout">Knockout</option>
                  <option value="final">Final</option>
                </select>
              </div>

              {/* Group Selection (only for group stage) */}
              {fixtureForm.stage === 'group' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Group</label>
                  <select
                    value={fixtureForm.groupId}
                    onChange={(e) => setFixtureForm(prev => ({ ...prev, groupId: e.target.value }))}
                    className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Select Group</option>
                    {season.groups?.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Home Team */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Home Team</label>
                <select
                  value={fixtureForm.homeTeamId}
                  onChange={(e) => setFixtureForm(prev => ({ ...prev, homeTeamId: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select Home Team</option>
                  {seasonTeams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              {/* Away Team */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Away Team</label>
                <select
                  value={fixtureForm.awayTeamId}
                  onChange={(e) => setFixtureForm(prev => ({ ...prev, awayTeamId: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select Away Team</option>
                  {seasonTeams.map(team => (
                    <option key={team.id} value={team.id} disabled={team.id === fixtureForm.homeTeamId}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date & Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={fixtureForm.dateTime}
                  onChange={(e) => setFixtureForm(prev => ({ ...prev, dateTime: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Venue (Optional)</label>
                <input
                  type="text"
                  value={fixtureForm.venue}
                  onChange={(e) => setFixtureForm(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder="e.g., Stadium Name"
                  className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-white/10">
              <button
                onClick={() => setShowFixtureModal(false)}
                className="flex-1 px-4 py-2 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFixture}
                disabled={savingFixture}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingFixture ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Knockout Round Creation Modal */}
      {showKnockoutModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-dark-800 rounded-xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Create Knockout Round</h2>
              <button
                onClick={() => setShowKnockoutModal(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Round Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Round Name</label>
                <input
                  type="text"
                  value={knockoutForm.roundName}
                  onChange={(e) => setKnockoutForm(prev => ({ ...prev, roundName: e.target.value }))}
                  placeholder="e.g., Quarter Finals, Semi Finals"
                  className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Matches */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Matches</label>
                  <button
                    onClick={addKnockoutMatch}
                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Match
                  </button>
                </div>
                
                <div className="space-y-3">
                  {knockoutForm.matches.map((match, index) => (
                    <div key={index} className="p-3 bg-dark-700/50 rounded-lg border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Match {index + 1}</span>
                        {knockoutForm.matches.length > 1 && (
                          <button
                            onClick={() => removeKnockoutMatch(index)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                        <select
                          value={match.homeTeamId}
                          onChange={(e) => updateKnockoutMatch(index, 'homeTeamId', e.target.value)}
                          className="w-full px-2 py-1.5 bg-dark-800 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-primary-500"
                        >
                          <option value="">Home Team</option>
                          {seasonTeams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                        
                        <span className="text-gray-500 text-xs px-1">vs</span>
                        
                        <select
                          value={match.awayTeamId}
                          onChange={(e) => updateKnockoutMatch(index, 'awayTeamId', e.target.value)}
                          className="w-full px-2 py-1.5 bg-dark-800 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-primary-500"
                        >
                          <option value="">Away Team</option>
                          {seasonTeams.map(team => (
                            <option key={team.id} value={team.id} disabled={team.id === match.homeTeamId}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-white/10">
              <button
                onClick={() => setShowKnockoutModal(false)}
                className="flex-1 px-4 py-2 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKnockoutRound}
                disabled={savingKnockout}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingKnockout ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Round
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonDetail;
