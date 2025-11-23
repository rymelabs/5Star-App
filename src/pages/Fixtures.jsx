import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Filter, Trophy, ArrowUpDown } from 'lucide-react';
import { useFootball } from '../context/FootballContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDate, isToday } from '../utils/dateUtils';
import { abbreviateTeamName } from '../utils/helpers';
import SeasonStandings from '../components/SeasonStandings';
import SurfaceCard from '../components/ui/SurfaceCard';
import PillChip from '../components/ui/PillChip';
import FixtureCard from '../components/FixtureCard';

const RECENT_RESULTS_LIMIT = 6;

const Fixtures = () => {
  const navigate = useNavigate();
  const { fixtures = [], leagueTable = [], leagueSettings = {}, seasons = [], activeSeason = null, teams = [] } = useFootball();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('fixtures');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSeasonId, setSelectedSeasonId] = useState(activeSeason?.id || 'all');
  const [selectedTableSeasonId, setSelectedTableSeasonId] = useState(activeSeason?.id || null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('date'); // 'date' | 'group'
  const [pastDateFilter, setPastDateFilter] = useState('');
  const [recentSortOrder, setRecentSortOrder] = useState('desc');

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

  // Groupings
  const { recentFixtures, pastDateGroups, upcomingGroups } = useMemo(() => {
    if (!filteredFixtures.length) {
      return { recentFixtures: [], pastDateGroups: [], upcomingGroups: [] };
    }

    const now = new Date();
    const pastFixtures = [];
    const upcomingGroupsMap = {};

    filteredFixtures.forEach((fixture) => {
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

    const recent = completedPastFixtures.slice(0, RECENT_RESULTS_LIMIT);

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

    return { recentFixtures: recent, pastDateGroups, upcomingGroups };
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
    <FixtureCard
      key={fixture.id}
      fixture={fixture}
      onClick={handleFixtureClick}
    />
  );

  const renderCarouselItems = (fixtures) => (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
      {fixtures.map((fixture) => (
        <div
          key={fixture.id}
          className="min-w-[260px] sm:min-w-[320px] flex-shrink-0 snap-start rounded-[22px] bg-gradient-to-r from-brand-purple via-indigo-500 to-blue-500 p-[1px]"
        >
          <FixtureCard fixture={fixture} onClick={handleFixtureClick} compact={true} />
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
          <Calendar className="w-8 h-8 text-brand-purple" />
          {t('pages.fixtures.title')}
        </h1>
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className={`p-2 rounded-full transition-colors ${showFilters ? 'bg-brand-purple text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-full mx-4 sm:mx-2">
        <button
          onClick={() => setActiveTab('fixtures')}
          className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
            activeTab === 'fixtures' ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('navigation.fixtures')}
        </button>
        <button
          onClick={() => setActiveTab('table')}
          className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
            activeTab === 'table' ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'
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
              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-purple transition-colors"
              >
                <option value="all">{t('stats.allSeasons')}</option>
                {seasons.map(season => (
                  <option key={season.id} value={season.id}>
                    {season.name} ({season.year})
                  </option>
                ))}
              </select>
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
          <div className="flex bg-white/5 rounded-full p-1 gap-1">
            {[
              { id: 'date', label: t('pages.fixtures.byDate'), disabled: false },
              { id: 'group', label: t('pages.fixtures.byGroup'), disabled: !hasGroupData }
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => !option.disabled && setViewMode(option.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  viewMode === option.id
                    ? 'bg-brand-purple text-white shadow-lg'
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
      {activeTab === 'fixtures' ? (
        <div className="space-y-6">
          {viewMode === 'date' && (
            <>
              {nextUpcomingFixture && sortedRecentFixtures.length === 0 && (
                <section className="space-y-3 px-4 sm:px-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Up Next</p>
                    <h3 className="text-base font-semibold text-white">Upcoming Fixture</h3>
                    <span className="text-[11px] text-white/40">Displayed until the first result comes in</span>
                  </div>
                  <FixtureCard
                    key={nextUpcomingFixture.id}
                    fixture={nextUpcomingFixture}
                    onClick={handleFixtureClick}
                    compact={true}
                  />
                </section>
              )}

              {(sortedRecentFixtures.length > 0 || pastDateGroups.length > 0 || nextUpcomingFixture) && (
                <section className="space-y-3 px-4 sm:px-2">
                  <div className="flex flex-col items-start gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Just Finished</p>
                      <h3 className="text-base font-semibold text-white">Recent Results</h3>
                      <span className="text-[11px] text-white/40">Latest completed fixtures</span>
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
                  ) : (
                    <SurfaceCard className="text-center text-xs text-white/50">
                      No fixtures have finished yet. Check back after the next match.
                    </SurfaceCard>
                  )}

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
                        {group.fixtures.map((fixture) => (
                          <FixtureCard
                            key={fixture.id}
                            fixture={fixture}
                            onClick={handleFixtureClick}
                            compact={true}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {recentFixtures.length === 0 && pastDateGroups.length === 0 && upcomingGroups.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>{t('pages.fixtures.noFixturesFound')}</p>
                </div>
              )}
            </>
          )}

          {viewMode === 'group' && (
            <>
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
            </>
          )}
        </div>
      ) : (
        <div className="px-0 sm:px-2">
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
        </div>
      )}
    </motion.div>
  );
};

export default Fixtures;
