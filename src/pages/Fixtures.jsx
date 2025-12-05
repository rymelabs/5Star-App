import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Filter, Trophy, ArrowUpDown, Clock, CheckCircle2, Radio } from 'lucide-react';
import { useFootball } from '../context/FootballContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDate, isToday } from '../utils/dateUtils';
import { abbreviateTeamName } from '../utils/helpers';
import SeasonStandings from '../components/SeasonStandings';
import SurfaceCard from '../components/ui/SurfaceCard';
import PillChip from '../components/ui/PillChip';
import Select from '../components/ui/Select';
import CompactFixtureRow from '../components/CompactFixtureRow';
import NewTeamAvatar from '../components/NewTeamAvatar';

const RECENT_RESULTS_LIMIT = 6;
const LAST_RESULTS_HIGHLIGHT = 3; // Number of most recent matches to show prominently

const CompetitionGroup = ({ group, onFixtureClick }) => (
  <div className="bg-[#0a0a0a]/50 backdrop-blur-sm rounded-xl border border-white/[0.04] overflow-hidden mb-3 last:mb-0">
    <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border-b border-white/[0.04]">
      {group.info.logo ? (
        <img src={group.info.logo} alt={group.info.name} className="w-4 h-4 object-contain" />
      ) : (
        <Trophy className="w-3.5 h-3.5 text-brand-purple" />
      )}
      <h4 className="text-[9px] font-bold text-white/80 uppercase tracking-wider">{group.info.name}</h4>
    </div>
    <div>
      {group.fixtures.map((fixture) => (
        <CompactFixtureRow
          key={fixture.id}
          fixture={fixture}
          onClick={onFixtureClick}
        />
      ))}
    </div>
  </div>
);

const Fixtures = () => {
  const navigate = useNavigate();
  const { fixtures = [], leagueTable = [], leagueSettings = {}, seasons = [], activeSeason = null, teams = [], leagues = [] } = useFootball();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('fixtures');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSeasonId, setSelectedSeasonId] = useState(activeSeason?.id || 'all');
  const [selectedTableSeasonId, setSelectedTableSeasonId] = useState(activeSeason?.id || null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('date'); // 'date' | 'group'
  const [pastDateFilter, setPastDateFilter] = useState('');
  const [recentSortOrder, setRecentSortOrder] = useState('desc');

  const getCompetitionInfo = (fixture) => {
    if (fixture.leagueId) {
      const league = leagues.find(l => l.id === fixture.leagueId);
      if (league) return { id: league.id, name: league.name, logo: league.logo, type: 'league' };
    }
    if (fixture.seasonId) {
      const season = seasons.find(s => s.id === fixture.seasonId);
      if (season) return { id: season.id, name: season.name, logo: null, type: 'season' };
    }
    return { id: 'unknown', name: 'Unknown Competition', logo: null, type: 'unknown' };
  };

  const groupFixturesByCompetition = (fixturesList) => {
    const groups = {};
    fixturesList.forEach(fixture => {
      const comp = getCompetitionInfo(fixture);
      if (!groups[comp.id]) {
        groups[comp.id] = {
          info: comp,
          fixtures: []
        };
      }
      groups[comp.id].fixtures.push(fixture);
    });
    return Object.values(groups).sort((a, b) => a.info.name.localeCompare(b.info.name));
  };

  useEffect(() => {
    if (activeSeason?.id) {
      setSelectedSeasonId((prev) => (prev === 'all' || !prev ? activeSeason.id : prev));
      setSelectedTableSeasonId((prev) => prev || activeSeason.id);
    }
  }, [activeSeason?.id]);

  useEffect(() => {
    if (!activeSeason?.id && seasons?.length > 0) {
      setSelectedTableSeasonId((prev) => prev || seasons[0].id);
    }
  }, [activeSeason?.id, seasons]);

  useEffect(() => {
    if (selectedSeasonId !== 'all' && seasons?.length) {
      const exists = seasons.some((season) => season.id === selectedSeasonId);
      if (!exists) {
        setSelectedSeasonId('all');
      }
    }
  }, [seasons, selectedSeasonId]);

  const displayTableSeason = useMemo(
    () => seasons?.find((season) => season.id === selectedTableSeasonId) || null,
    [seasons, selectedTableSeasonId]
  );
  const showSeasonStandings = Boolean(seasons && seasons.length > 0 && displayTableSeason);

  const statusFilters = [
    { id: 'all', label: t('pages.fixtures.allFixtures') },
    { id: 'upcoming', label: t('pages.fixtures.upcoming') },
    { id: 'live', label: t('pages.fixtures.live') },
    { id: 'completed', label: t('pages.fixtures.completed') },
    { id: 'today', label: t('pages.fixtures.today') }
  ];

  // Filter fixtures
  const filteredFixtures = useMemo(() => {
    let filtered = Array.isArray(fixtures) ? [...fixtures] : [];
    if (selectedSeasonId && selectedSeasonId !== 'all') {
      filtered = filtered.filter(f => f.seasonId === selectedSeasonId);
    }
    if (statusFilter === 'upcoming') {
      filtered = filtered.filter(f => new Date(f.dateTime) > new Date());
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(f => f.status === 'completed');
    } else if (statusFilter === 'live') {
      filtered = filtered.filter(f => f.status === 'live');
    } else if (statusFilter === 'today') {
      filtered = filtered.filter(f => isToday(f.dateTime));
    }
    // Sort: active season fixtures first, then by date desc
    filtered.sort((a, b) => {
      const aActive = a.seasonId && activeSeason?.id && a.seasonId === activeSeason.id;
      const bActive = b.seasonId && activeSeason?.id && b.seasonId === activeSeason.id;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return new Date(b.dateTime) - new Date(a.dateTime);
    });
    return filtered;
  }, [fixtures, statusFilter, selectedSeasonId, activeSeason]);

  // Get live fixtures count for tab indicator
  const liveFixturesCount = useMemo(() => {
    return fixtures.filter(f => f.status === 'live').length;
  }, [fixtures]);

  // Groupings
  const { lastThreeResults, recentFixtures, pastDateGroups, upcomingGroups, liveFixtures } = useMemo(() => {
    if (!filteredFixtures.length) {
      return { lastThreeResults: [], recentFixtures: [], pastDateGroups: [], upcomingGroups: [], liveFixtures: [] };
    }

    const now = new Date();
    const pastFixtures = [];
    const upcomingGroupsMap = {};
    const live = [];

    filteredFixtures.forEach((fixture) => {
      // Collect live fixtures
      if (fixture.status === 'live') {
        live.push(fixture);
      }

      const date = new Date(fixture.dateTime);
      if (Number.isNaN(date.getTime())) {
        return;
      }

      if (date >= now) {
        const key = date.toISOString().split('T')[0];
        if (!upcomingGroupsMap[key]) {
          upcomingGroupsMap[key] = {
            key,
            label: formatDate(fixture.dateTime),
            fixtures: [],
          };
        }
        upcomingGroupsMap[key].fixtures.push(fixture);
        return;
      }

      pastFixtures.push(fixture);
    });

    const pastGroupsMap = pastFixtures.reduce((acc, fixture) => {
      const key = new Date(fixture.dateTime).toISOString().split('T')[0];
      if (!acc[key]) {
        acc[key] = {
          key,
          label: formatDate(fixture.dateTime),
          fixtures: [],
        };
      }
      acc[key].fixtures.push(fixture);
      return acc;
    }, {});

    const completedPastFixtures = pastFixtures
      .filter((fixture) => fixture.status === 'completed')
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

    // Split: first 3 for prominent display, rest for carousel
    // const lastThree = completedPastFixtures.slice(0, LAST_RESULTS_HIGHLIGHT);
    // const recent = completedPastFixtures.slice(LAST_RESULTS_HIGHLIGHT, RECENT_RESULTS_LIMIT + LAST_RESULTS_HIGHLIGHT);
    
    // Combined recent results (like Latest page)
    const recent = completedPastFixtures.slice(0, RECENT_RESULTS_LIMIT + LAST_RESULTS_HIGHLIGHT);
    const lastThree = []; // Empty to disable the split section

    const pastDateGroups = Object.values(pastGroupsMap)
      .map((group) => ({
        ...group,
        fixtures: group.fixtures.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)),
      }))
      .sort((a, b) => new Date(b.key) - new Date(a.key));

    const upcomingGroups = Object.values(upcomingGroupsMap)
      .map((group) => ({
        ...group,
        fixtures: group.fixtures.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)),
      }))
      .sort((a, b) => new Date(a.key) - new Date(b.key));

    return { lastThreeResults: lastThree, recentFixtures: recent, pastDateGroups, upcomingGroups, liveFixtures: live };
  }, [filteredFixtures]);

  const sortedRecentFixtures = useMemo(() => {
    const items = [...recentFixtures];
    items.sort((a, b) => recentSortOrder === 'desc'
      ? new Date(b.dateTime) - new Date(a.dateTime)
      : new Date(a.dateTime) - new Date(b.dateTime));
    return items;
  }, [recentFixtures, recentSortOrder]);

  const selectedPastGroup = useMemo(() => {
    if (!pastDateFilter) return null;
    return pastDateGroups.find(group => group.key === pastDateFilter) || null;
  }, [pastDateFilter, pastDateGroups]);

  const filteredPastFixtures = useMemo(() => {
    if (!selectedPastGroup) return [];
    const items = [...selectedPastGroup.fixtures];
    items.sort((a, b) => recentSortOrder === 'desc'
      ? new Date(b.dateTime) - new Date(a.dateTime)
      : new Date(a.dateTime) - new Date(b.dateTime));
    return items;
  }, [selectedPastGroup, recentSortOrder]);

  const nextUpcomingFixture = useMemo(() => {
    if (!upcomingGroups.length) return null;
    const firstGroup = upcomingGroups[0];
    return firstGroup?.fixtures?.[0] || null;
  }, [upcomingGroups]);

  const maxPastDateKey = useMemo(() => new Date().toISOString().split('T')[0], []);
  const minPastDateKey = useMemo(() => pastDateGroups.length ? pastDateGroups[pastDateGroups.length - 1].key : '', [pastDateGroups]);

  const groupViewSeasonId = useMemo(
    () => (selectedSeasonId && selectedSeasonId !== 'all') ? selectedSeasonId : (activeSeason?.id || null),
    [selectedSeasonId, activeSeason]
  );
  const groupViewSeason = useMemo(
    () => seasons?.find((season) => season.id === groupViewSeasonId) || null,
    [seasons, groupViewSeasonId]
  );
  const groupedByGroup = useMemo(() => {
    if (!groupViewSeasonId) return [];
    const seasonFixtures = filteredFixtures.filter(f => f.seasonId === groupViewSeasonId);
    if (seasonFixtures.length === 0) return [];
    const order = groupViewSeason?.groups?.map(g => g.id) || [];
    const map = seasonFixtures.reduce((acc, fixture) => {
      const key = fixture.stage === 'knockout' ? 'knockout' : (fixture.groupId || 'ungrouped');
      if (!acc[key]) acc[key] = [];
      acc[key].push(fixture);
      return acc;
    }, {});
    return Object.entries(map)
      .map(([key, fixtures]) => ({
        key,
        fixtures,
        meta: groupViewSeason?.groups?.find(g => g.id === key) || null
      }))
      .sort((a, b) => {
        if (a.meta && b.meta) {
          return order.indexOf(a.meta.id) - order.indexOf(b.meta.id);
        }
        if (a.meta) return -1;
        if (b.meta) return 1;
        if (a.key === 'knockout') return 1;
        if (b.key === 'knockout') return -1;
        return a.key.localeCompare(b.key);
      });
  }, [filteredFixtures, groupViewSeasonId, groupViewSeason]);

  const hasGroupData = Boolean(groupViewSeason?.groups?.length);

  const handleFixtureClick = (fixture) => navigate(`/fixtures/${fixture.id}`);

  const renderFixtureCard = (fixture) => (
    <CompactFixtureRow
      key={fixture.id}
      fixture={fixture}
      onClick={handleFixtureClick}
    />
  );

  const renderCarouselItems = (fixtures) => (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 hide-scrollbar">
      {fixtures.map((fixture) => (
        <div 
          key={fixture.id} 
          onClick={() => handleFixtureClick(fixture)}
          className="flex-shrink-0 w-44 bg-[#0a0a0a]/50 backdrop-blur-sm rounded-lg border border-white/[0.04] p-3 cursor-pointer hover:bg-white/[0.03] transition-all group"
        >
          {/* Match Info */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-500">{formatDate(fixture.dateTime)}</span>
            <span className="text-[10px] font-bold text-emerald-400">FT</span>
          </div>
          
          {/* Teams */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <NewTeamAvatar team={fixture.homeTeam} size={18} />
                <span className={`text-[11px] truncate ${
                  Number(fixture.homeScore) > Number(fixture.awayScore) ? 'text-white font-semibold' : 'text-gray-400'
                }`}>{abbreviateTeamName(fixture.homeTeam?.name)}</span>
              </div>
              <span className={`text-sm font-bold ml-2 ${
                Number(fixture.homeScore) > Number(fixture.awayScore) ? 'text-white' : 'text-gray-500'
              }`}>{fixture.homeScore}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <NewTeamAvatar team={fixture.awayTeam} size={18} />
                <span className={`text-[11px] truncate ${
                  Number(fixture.awayScore) > Number(fixture.homeScore) ? 'text-white font-semibold' : 'text-gray-400'
                }`}>{abbreviateTeamName(fixture.awayTeam?.name)}</span>
              </div>
              <span className={`text-sm font-bold ml-2 ${
                Number(fixture.awayScore) > Number(fixture.homeScore) ? 'text-white' : 'text-gray-500'
              }`}>{fixture.awayScore}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <h1 className="page-header flex items-center gap-3">
          <Calendar className="w-6 h-6 text-brand-purple" />
          {t('pages.fixtures.title')}
        </h1>
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className={`p-2 rounded-full transition-colors ${showFilters ? 'bg-brand-purple text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Filter Bar - Livescore/Sofascore Style */}
      <div className="flex gap-2 overflow-x-auto px-6 pb-1 scrollbar-hide">
        {[
          { id: 'all', label: 'All', icon: null },
          { id: 'live', label: 'Live', icon: Radio, pulse: liveFixturesCount > 0 },
          { id: 'completed', label: 'Finished', icon: CheckCircle2 },
          { id: 'upcoming', label: 'Upcoming', icon: Clock },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setStatusFilter(filter.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              statusFilter === filter.id
                ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {filter.icon && (
              <filter.icon className={`w-4 h-4 ${filter.pulse ? 'animate-pulse text-red-400' : ''}`} />
            )}
            {filter.label}
            {filter.id === 'live' && liveFixturesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full animate-pulse">
                {liveFixturesCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-full mx-4 sm:mx-2 relative">
        <motion.div
          className="absolute top-1 bottom-1 bg-brand-purple rounded-full shadow-lg"
          layoutId="fixtures-tab-indicator"
          initial={false}
          animate={{
            left: activeTab === 'fixtures' ? '4px' : '50%',
            width: 'calc(50% - 4px)',
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
        />
        <button
          onClick={() => setActiveTab('fixtures')}
          className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors relative z-10 ${
            activeTab === 'fixtures' ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('navigation.fixtures')}
        </button>
        <button
          onClick={() => setActiveTab('table')}
          className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors relative z-10 ${
            activeTab === 'table' ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('pages.fixtures.table')}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <SurfaceCard className="mx-4 sm:mx-2 space-y-4 animate-in fade-in slide-in-from-top-4">
          {seasons && seasons.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">{t('pages.fixtures.season')}</h3>
              <Select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                options={[
                  { value: 'all', label: t('stats.allSeasons') },
                  ...(seasons || []).map(season => ({
                    value: season.id,
                    label: `${season.name} (${season.year})`
                  }))
                ]}
              />
            </div>
          )}

          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">{t('pages.fixtures.filterByStatus')}</h3>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map(filter => (
                <PillChip
                  key={filter.id}
                  label={filter.label}
                  active={statusFilter === filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  size="sm"
                  variant={statusFilter === filter.id ? 'solid' : 'outline'}
                  tone="primary"
                />
              ))}
            </div>
          </div>
        </SurfaceCard>
      )}

      {activeTab === 'fixtures' && (
        <div className="flex items-center justify-end px-4 sm:px-2">
          <div className="flex bg-white/5 rounded-full p-1 gap-1 relative">
            <motion.div
              className="absolute top-1 bottom-1 bg-brand-purple rounded-full shadow-lg"
              layoutId="viewmode-tab-indicator"
              initial={false}
              animate={{
                left: viewMode === 'date' ? '4px' : 'calc(50% + 2px)',
                width: 'calc(50% - 6px)',
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
              }}
            />
            {[
              { id: 'date', label: t('pages.fixtures.byDate'), disabled: false },
              { id: 'group', label: t('pages.fixtures.byGroup'), disabled: !hasGroupData }
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => !option.disabled && setViewMode(option.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors relative z-10 ${
                  viewMode === option.id
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                } ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'fixtures' ? (
          <motion.div
            key="fixtures-content"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="space-y-6"
          >
          <AnimatePresence mode="wait">
          {viewMode === 'date' && (
            <motion.div
              key="date-view"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className="space-y-6"
            >
              {/* Live Matches Section - Always on top when available */}
              {liveFixtures.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 px-4">
                    <div className="relative">
                      <Radio className="w-5 h-5 text-red-500" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Live Now</h3>
                      <span className="text-[11px] text-white/40">{liveFixtures.length} match{liveFixtures.length > 1 ? 'es' : ''} in progress</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {groupFixturesByCompetition(liveFixtures).map((group) => (
                      <CompetitionGroup key={group.info.id} group={group} onFixtureClick={handleFixtureClick} />
                    ))}
                  </div>
                </section>
              )}

              {/* Last 3 Results - Prominent Section (Disabled/Merged) */}
              {/* {lastThreeResults.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between px-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <h3 className="text-base font-semibold text-white">Last {lastThreeResults.length} Results</h3>
                      </div>
                      <span className="text-[11px] text-white/40 ml-7">Most recently completed matches</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {groupFixturesByCompetition(lastThreeResults).map((group) => (
                      <CompetitionGroup key={group.info.id} group={group} onFixtureClick={handleFixtureClick} />
                    ))}
                  </div>
                </section>
              )} */}

              {/* Next Up - Show when no completed matches yet */}
              {nextUpcomingFixture && lastThreeResults.length === 0 && sortedRecentFixtures.length === 0 && (
                <section className="space-y-3 px-4 sm:px-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div>
                      <h3 className="text-base font-semibold text-white">Up Next</h3>
                      <span className="text-[11px] text-white/40">Displayed until the first result comes in</span>
                    </div>
                  </div>
                  <div className="bg-[#0a0a0a]/50 backdrop-blur-sm rounded-xl border border-white/[0.04] overflow-hidden">
                    <CompactFixtureRow
                      key={nextUpcomingFixture.id}
                      fixture={nextUpcomingFixture}
                      onClick={handleFixtureClick}
                    />
                  </div>
                </section>
              )}

              {/* More Recent Results - Carousel */}
              {(sortedRecentFixtures.length > 0 || pastDateGroups.length > 0) && (
                <section className="space-y-3">
                  <div className="flex flex-col items-start gap-3 px-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                        <h2 className="text-sm font-bold text-white tracking-wide">Results</h2>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {pastDateGroups.length > 0 && (
                        <label className="text-[11px] text-white/60 flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                          <span>Date</span>
                          <input
                            type="date"
                            value={pastDateFilter}
                            onChange={(e) => setPastDateFilter(e.target.value)}
                            min={minPastDateKey || undefined}
                            max={maxPastDateKey}
                            className="bg-transparent text-white text-xs focus:outline-none"
                          />
                        </label>
                      )}
                      {pastDateFilter && (
                        <button
                          type="button"
                          onClick={() => setPastDateFilter('')}
                          className="text-[11px] text-white/60 hover:text-white underline"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setRecentSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:text-white"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        {recentSortOrder === 'desc' ? 'Newest' : 'Oldest'}
                      </button>
                    </div>
                  </div>

                  {sortedRecentFixtures.length > 0 ? (
                    renderCarouselItems(sortedRecentFixtures)
                  ) : !pastDateFilter && lastThreeResults.length === 0 ? (
                    <SurfaceCard className="text-center text-xs text-white/50">
                      No fixtures have finished yet. Check back after the next match.
                    </SurfaceCard>
                  ) : null}

                  {pastDateFilter && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-white/40">
                        <span>{formatDate(pastDateFilter)}</span>
                        <span className="text-[10px] text-white/30">Filtered Results</span>
                      </div>
                      {filteredPastFixtures.length > 0 ? (
                        renderCarouselItems(filteredPastFixtures)
                      ) : (
                        <SurfaceCard className="text-center text-xs text-white/50">
                          No matches recorded for this date.
                        </SurfaceCard>
                      )}
                    </div>
                  )}
                </section>
              )}

              {upcomingGroups.length > 0 && (
                <section className="space-y-4">
                  {upcomingGroups.map((group) => (
                    <div key={group.key} className="space-y-3">
                      <div className="sticky top-16 z-20 bg-app/95 backdrop-blur-sm py-2 px-4 border-b border-white/5">
                        <h3 className="text-sm font-bold text-brand-purple uppercase tracking-wider">
                          {group.label}
                        </h3>
                      </div>

                      <div className="space-y-3 px-0 sm:px-2">
                        {groupFixturesByCompetition(group.fixtures).map((compGroup) => (
                          <CompetitionGroup key={compGroup.info.id} group={compGroup} onFixtureClick={handleFixtureClick} />
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {lastThreeResults.length === 0 && liveFixtures.length === 0 && recentFixtures.length === 0 && pastDateGroups.length === 0 && upcomingGroups.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>{t('pages.fixtures.noFixturesFound')}</p>
                </div>
              )}
            </motion.div>
          )}

          {viewMode === 'group' && (
            <motion.div
              key="group-view"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            >
              {!hasGroupData && (
                <SurfaceCard className="mx-2 text-center text-sm text-gray-400">
                  <div className="py-8 px-4">
                    {t('pages.fixtures.selectSeasonMessage')}
                  </div>
                </SurfaceCard>
              )}

              {hasGroupData && groupedByGroup.map(({ key, fixtures, meta }) => (
                <div key={key} className="space-y-3">
                  <div className="flex flex-col gap-1 px-4">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-sm font-bold text-white">
                        {meta?.name || (key === 'knockout' ? t('pages.fixtures.knockoutStage') : t('pages.fixtures.otherFixtures'))}
                      </h3>
                      {meta?.teams?.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {t('pages.fixtures.groupTeamCount', { count: meta.teams.length })}
                        </span>
                      )}
                    </div>
                    {meta?.teams?.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-[11px] text-gray-400">
                        {meta.teams.map((team) => (
                          <span key={team.id || team.name} className="px-2 py-0.5 rounded-full bg-white/5">
                            {abbreviateTeamName(team.name)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 px-0 sm:px-2">
                    {fixtures.map((fixture) => renderFixtureCard(fixture))}
                  </div>
                </div>
              ))}

              {hasGroupData && groupedByGroup.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>{t('pages.fixtures.noFixturesFound')}</p>
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          key="table-content"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="px-0 sm:px-2"
        >
          {showSeasonStandings ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 px-4 sm:px-0">
                <h3 className="text-lg font-bold text-white">{displayTableSeason.name}</h3>
                {seasons.length > 1 && (
                  <select
                    value={selectedTableSeasonId}
                    onChange={(e) => setSelectedTableSeasonId(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg text-xs px-2 py-1 text-white focus:outline-none"
                  >
                    {seasons.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <SeasonStandings season={displayTableSeason} teams={teams} fixtures={fixtures} />
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>{t('stats.noData')}</p>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Fixtures;
