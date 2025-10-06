import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Filter, Trophy } from 'lucide-react';
import { useFootball } from '../context/FootballContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDate, getMatchDayLabel, isToday } from '../utils/dateUtils';
import { groupBy, abbreviateTeamName, isFixtureLive } from '../utils/helpers';
import SeasonStandings from '../components/SeasonStandings';

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
  // Track expanded sections (by date string or group key)
  const [expandedSections, setExpandedSections] = useState({});

  const displayTableSeason = seasons?.find(s => s.id === selectedTableSeasonId) || null;
  const showSeasonStandings = Boolean(seasons && seasons.length > 0 && displayTableSeason);

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
  const groupedByDate = useMemo(() => groupBy(filteredFixtures, f => formatDate(f.dateTime)), [filteredFixtures]);
  const groupViewSeasonId = useMemo(
    () => (selectedSeasonId && selectedSeasonId !== 'all') ? selectedSeasonId : (activeSeason?.id || null),
    [selectedSeasonId, activeSeason]
  );
  const groupViewSeason = useMemo(() => seasons?.find(s => s.id === groupViewSeasonId) || null, [seasons, groupViewSeasonId]);
  const groupedByGroup = useMemo(() => {
    if (!groupViewSeasonId) return {};
    const seasonFixtures = filteredFixtures.filter(f => f.seasonId === groupViewSeasonId);
    return seasonFixtures.reduce((acc, f) => {
      const key = f.stage === 'knockout' ? 'knockout' : (f.groupId || 'ungrouped');
      if (!acc[key]) acc[key] = [];
      acc[key].push(f);
      return acc;
    }, {});
  }, [filteredFixtures, groupViewSeasonId]);

  const handleFixtureClick = (fixture) => navigate(`/fixtures/${fixture.id}`);
  const isSectionExpanded = (key) => Boolean(expandedSections[key]);
  const toggleSection = (key) => setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">{t('pages.fixtures.title')}</h1>
        <button onClick={() => setShowFilters(!showFilters)} className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors">
          <Filter className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 mb-6 space-y-4">
          {seasons && seasons.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">{t('pages.fixtures.season')}</h3>
              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="all">All Seasons</option>
                {seasons.map(season => (
                  <option key={season.id} value={season.id}>
                    {season.name} ({season.year})
                    {season.isActive && ' - Active'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">{t('pages.fixtures.filterByStatus')}</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: t('pages.fixtures.allFixtures') },
                { key: 'today', label: t('pages.fixtures.today') },
                { key: 'live', label: t('pages.fixtures.live') },
                { key: 'upcoming', label: t('pages.fixtures.upcoming') },
                { key: 'completed', label: t('pages.fixtures.completed') },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === filter.key ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab('fixtures')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'fixtures' ? 'border-2 border-primary-500 text-primary-400' : 'border-2 border-dark-700 text-gray-400 hover:text-white hover:border-dark-600'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          {t('navigation.fixtures')}
        </button>
        <button
          onClick={() => setActiveTab('table')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'table' ? 'border-2 border-primary-500 text-primary-400' : 'border-2 border-dark-700 text-gray-400 hover:text-white hover:border-dark-600'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          {t('pages.fixtures.table')}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'fixtures' ? (
        <div className="space-y-6">
          {/* View mode toggle */}
          <div className="flex gap-2 mb-2 w-full max-w-sm">
            <button
              onClick={() => setViewMode('date')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'date' ? 'border-2 border-primary-400 text-primary-300' : 'border-2 border-dark-700 text-gray-400 hover:text-white hover:border-dark-600'
              }`}
            >
              By Date
            </button>
            <button
              onClick={() => setViewMode('group')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'group' ? 'border-2 border-primary-400 text-primary-300' : 'border-2 border-dark-700 text-gray-400 hover:text-white hover:border-dark-600'
              }`}
            >
              By Group
            </button>
          </div>

          {viewMode === 'date' ? (
            Object.entries(groupedByDate).length > 0 ? (
              // Sort groups by date asc for readability
              Object
                .entries(groupedByDate)
                .sort(([d1], [d2]) => new Date(d1) - new Date(d2))
                .map(([date, dayFixtures]) => {
                  const expanded = isSectionExpanded(date);
                  const items = expanded ? dayFixtures : dayFixtures.slice(0, 3);
                  const remaining = Math.max(0, dayFixtures.length - 3);
                  return (
                  <div key={date}>
                    <h3 className="text-lg font-semibold text-white mb-3 sticky top-16 bg-dark-900 py-2">
                      {getMatchDayLabel(dayFixtures[0].dateTime)}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {items.map((fixture) => {
                        const isSeasonFixture = fixture.seasonId && fixture.seasonId === activeSeason?.id;
                        const season = seasons?.find(s => s.id === fixture.seasonId);
                        const group = season?.groups?.find(g => g.id === fixture.groupId);
                        const homeName = fixture?.homeTeam?.name || 'Unknown Team';
                        const awayName = fixture?.awayTeam?.name || 'Unknown Team';
                        return (
                          <div
                            key={fixture.id}
                            onClick={() => handleFixtureClick(fixture)}
                            className={`card p-4 cursor-pointer hover:bg-dark-700 hover:scale-[1.01] transition-all duration-200 overflow-hidden ${
                              isSeasonFixture ? 'border-l-2 border-primary-500' : ''
                            }`}
                          >
                            {(fixture.seasonId || fixture.competition) && (
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {fixture.seasonId && season && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded">
                                    {season.name}
                                  </span>
                                )}
                                {group && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-accent-500/20 text-accent-400 border border-accent-500/30 rounded">
                                    {group.name}
                                  </span>
                                )}
                                {fixture.stage && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded capitalize">
                                    {fixture.stage === 'knockout' ? fixture.round || 'Knockout' : 'Group Stage'}
                                  </span>
                                )}
                                {!fixture.seasonId && fixture.competition && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded">
                                    {fixture.competition}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-6 flex-1 min-w-0">
                                <div className="flex items-center space-x-3 flex-1 justify-end min-w-0">
                                  <span className="font-medium text-white truncate max-w-[160px]" title={homeName}>
                                    {abbreviateTeamName(homeName)}
                                  </span>
                                  {fixture.homeTeam?.logo && (
                                    <img
                                      src={fixture.homeTeam.logo}
                                      alt={homeName}
                                      className="w-7 h-7 object-contain rounded-full flex-shrink-0"
                                      onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                  )}
                                </div>
                                <div className="flex flex-col items-center px-4 flex-shrink-0">
                                  {fixture.status === 'completed' ? (
                                    <div className="text-center">
                                      <div className="text-lg font-bold text-white">{fixture.homeScore} - {fixture.awayScore}</div>
                                      <div className="text-xs text-gray-500 mt-1">FT</div>
                                    </div>
                                  ) : isFixtureLive(fixture) ? (
                                    <div className="text-center">
                                      <div className="text-lg font-bold text-white">{fixture.homeScore || 0} - {fixture.awayScore || 0}</div>
                                      <div className="text-sm font-bold animate-live-pulse mt-1">LIVE</div>
                                    </div>
                                  ) : (
                                    <div className="text-center">
                                      <div className="text-sm font-semibold text-primary-500">VS</div>
                                      <div className="text-xs text-gray-400 mt-1">{new Date(fixture.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                                      <div className="text-xs text-gray-500 mt-0.5">{new Date(fixture.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  {fixture.awayTeam?.logo && (
                                    <img
                                      src={fixture.awayTeam.logo}
                                      alt={awayName}
                                      className="w-7 h-7 object-contain rounded-full flex-shrink-0"
                                      onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                  )}
                                  <span className="font-medium text-white truncate max-w-[160px]" title={awayName}>
                                    {abbreviateTeamName(awayName)}
                                  </span>
                                </div>
                              </div>
                              {fixture.venue && (
                                <div className="ml-6 text-right flex-shrink-0">
                                  <div className="text-xs text-gray-500 truncate max-w-[100px]">{fixture.venue}</div>
                                </div>
                              )}
                            </div>
                            {fixture.status === 'live' && (
                              <div className="mt-3 flex items-center justify-between text-sm">
                                <div className="flex items-center text-red-400">
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                                  Live • {fixture.liveData?.minute || 0}'
                                </div>
                                {fixture.liveData?.events && fixture.liveData.events.length > 0 && (
                                  <div className="text-gray-400">{fixture.liveData.events.length} events</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {dayFixtures.length > 3 && (
                        <div className="pt-1">
                          <button
                            onClick={() => toggleSection(date)}
                            className="px-3 py-1.5 text-sm rounded-md bg-dark-800 hover:bg-dark-700 text-gray-300 border border-dark-700"
                          >
                            {expanded ? 'See less' : `See more (${remaining} more)`}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
                })
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">{t('pages.fixtures.noFixturesFound')}</p>
                <p className="text-sm text-gray-500">{t('common.tryAdjustingFilters')}</p>
              </div>
            )
          ) : (
            <>
              {!groupViewSeason && (
                <div className="card p-3 text-sm text-gray-300">{t('pages.fixtures.selectSeasonMessage')}</div>
              )}
              {groupViewSeason && Object.keys(groupedByGroup).length > 0 ? (
                Object.entries(groupedByGroup).map(([groupKey, list]) => {
                  const isKnockout = groupKey === 'knockout';
                  const isUngrouped = groupKey === 'ungrouped';
                  const groupMeta = groupViewSeason?.groups?.find(g => g.id === groupKey);
                  const header = isKnockout ? 'Knockout Stage' : isUngrouped ? 'Other Fixtures' : (groupMeta?.name || 'Group');
                  const expanded = isSectionExpanded(groupKey);
                  const items = expanded ? list : list.slice(0, 3);
                  const remaining = Math.max(0, list.length - 3);
                  return (
                    <div key={groupKey} className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white">
                          {header}
                          <span className="ml-2 text-xs font-medium text-gray-400">{list.length}</span>
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {items.map((fixture) => {
                          const isSeasonFixture = fixture.seasonId && fixture.seasonId === activeSeason?.id;
                          const season = seasons?.find(s => s.id === fixture.seasonId);
                          const group = season?.groups?.find(g => g.id === fixture.groupId);
                          const homeName = fixture?.homeTeam?.name || 'Unknown Team';
                          const awayName = fixture?.awayTeam?.name || 'Unknown Team';
                          return (
                            <div
                              key={fixture.id}
                              onClick={() => handleFixtureClick(fixture)}
                              className={`card p-4 cursor-pointer hover:bg-dark-700 transition-colors duration-200 overflow-hidden ${
                                isSeasonFixture ? 'border-l-2 border-primary-500' : ''
                              }`}
                            >
                              {(fixture.seasonId || fixture.competition) && (
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  {fixture.seasonId && season && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded">{season.name}</span>
                                  )}
                                  {group && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-accent-500/20 text-accent-400 border border-accent-500/30 rounded">{group.name}</span>
                                  )}
                                  {fixture.stage && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded capitalize">{fixture.stage === 'knockout' ? fixture.round || 'Knockout' : 'Group Stage'}</span>
                                  )}
                                  {!fixture.seasonId && fixture.competition && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded">{fixture.competition}</span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6 flex-1 min-w-0">
                                  <div className="flex items-center space-x-3 flex-1 justify-end min-w-0">
                                    <span className="font-medium text-white truncate max-w-[160px]" title={homeName}>{abbreviateTeamName(homeName)}</span>
                                    {fixture.homeTeam?.logo && (
                                      <img src={fixture.homeTeam.logo} alt={homeName} className="w-7 h-7 object-contain rounded-full flex-shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    )}
                                  </div>
                                  <div className="flex flex-col items-center px-4 flex-shrink-0">
                                    {fixture.status === 'completed' ? (
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-white">{fixture.homeScore} - {fixture.awayScore}</div>
                                        <div className="text-xs text-gray-500 mt-1">FT</div>
                                      </div>
                                    ) : isFixtureLive(fixture) ? (
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-white">{fixture.homeScore || 0} - {fixture.awayScore || 0}</div>
                                        <div className="text-sm font-bold animate-live-pulse mt-1">LIVE</div>
                                      </div>
                                    ) : (
                                      <div className="text-center">
                                        <div className="text-sm font-semibold text-primary-500">VS</div>
                                        <div className="text-xs text-gray-400 mt-1">{new Date(fixture.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{new Date(fixture.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    {fixture.awayTeam?.logo && (
                                      <img src={fixture.awayTeam.logo} alt={awayName} className="w-7 h-7 object-contain rounded-full flex-shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    )}
                                    <span className="font-medium text-white truncate max-w-[160px]" title={awayName}>{abbreviateTeamName(awayName)}</span>
                                  </div>
                                </div>
                                {fixture.venue && (
                                  <div className="ml-6 text-right flex-shrink-0">
                                    <div className="text-xs text-gray-500 truncate max-w-[100px]">{fixture.venue}</div>
                                  </div>
                                )}
                              </div>
                              {fixture.status === 'live' && (
                                <div className="mt-3 flex items-center justify-between text-sm">
                                  <div className="flex items-center text-red-400"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>Live • {fixture.liveData?.minute || 0}'</div>
                                  {fixture.liveData?.events && fixture.liveData.events.length > 0 && (
                                    <div className="text-gray-400">{fixture.liveData.events.length} events</div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {list.length > 3 && (
                          <div className="pt-1">
                            <button
                              onClick={() => toggleSection(groupKey)}
                              className="px-3 py-1.5 text-sm rounded-md bg-dark-800 hover:bg-dark-700 text-gray-300 border border-dark-700"
                            >
                              {expanded ? 'See less' : `See more (${remaining} more)`}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">No fixtures found</p>
                  <p className="text-sm text-gray-500">Try adjusting your filters</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // League Table / Season Standings
        <div className="space-y-6">
          {/* Season Selector for Table Tab */}
          {seasons && seasons.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
                View Standings:
              </label>
              <div className="flex flex-wrap gap-2 flex-1">
                <button
                  onClick={() => setSelectedTableSeasonId(null)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !selectedTableSeasonId
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                  }`}
                >
                  League Table
                </button>
                {seasons.map(season => (
                  <button
                    key={season.id}
                    onClick={() => setSelectedTableSeasonId(season.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTableSeasonId === season.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                    }`}
                  >
                    {season.name} {season.isActive && '⭐'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Show Season Standings if selected */}
          {showSeasonStandings ? (
            <SeasonStandings season={displayTableSeason} teams={teams} />
          ) : (
            // Traditional League Table
            <div className="bg-transparent border border-gray-700 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[auto_1fr_repeat(6,auto)] gap-3 px-4 py-3 bg-dark-800/30 border-b border-gray-700 text-xs font-medium text-gray-400 uppercase tracking-wide">
                <div className="text-left">S/N</div>
                <div className="text-left">{t('pages.fixtures.team')}</div>
                <div className="text-center w-8">P</div>
                <div className="text-center w-8">W</div>
                <div className="text-center w-8">D</div>
                <div className="text-center w-8">L</div>
                <div className="text-center w-10">GD</div>
                <div className="text-center w-10">PTS</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-700/50">
                {leagueTable.map((team) => (
                  <div
                    key={team.team.id}
                    className="grid grid-cols-[auto_1fr_repeat(6,auto)] gap-3 px-4 py-3 hover:bg-dark-800/30 transition-colors duration-200"
                  >
                    <div className="flex items-center">
                      <span
                        className={`text-sm font-medium ${
                          team.position <= leagueSettings.qualifiedPosition
                            ? 'text-primary-400'
                            : team.position >= leagueSettings.relegationPosition
                            ? 'text-red-400'
                            : 'text-white'
                        }`}
                      >
                        {team.position}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 min-w-0">
                      {team.team.logo && (
                        <img
                          src={team.team.logo}
                          alt={team.team.name}
                          className="w-5 h-5 object-contain flex-shrink-0"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                      <span className="text-sm font-medium text-white truncate max-w-[180px]" title={team.team.name}>
                        {team.team.name}
                      </span>
                    </div>

                    <div className="text-center w-8 flex items-center justify-center">
                      <span className="text-sm text-gray-300">{team.played}</span>
                    </div>

                    <div className="text-center w-8 flex items-center justify-center">
                      <span className="text-sm text-gray-300">{team.won}</span>
                    </div>

                    <div className="text-center w-8 flex items-center justify-center">
                      <span className="text-sm text-gray-300">{team.drawn}</span>
                    </div>

                    <div className="text-center w-8 flex items-center justify-center">
                      <span className="text-sm text-gray-300">{team.lost}</span>
                    </div>

                    <div className="text-center w-10 flex items-center justify-center">
                      <span
                        className={`text-sm ${
                          team.goalDifference > 0
                            ? 'text-accent-400'
                            : team.goalDifference < 0
                            ? 'text-red-400'
                            : 'text-gray-300'
                        }`}
                      >
                        {team.goalDifference > 0 ? '+' : ''}
                        {team.goalDifference}
                      </span>
                    </div>

                    <div className="text-center w-10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">{team.points}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              {leagueSettings && (
                <div className="px-4 py-3 bg-dark-800/20 border-t border-gray-700 text-xs text-gray-400">
                  <div className="flex flex-wrap gap-4">
                    {leagueSettings.qualifiedPosition > 0 && (
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-primary-500 rounded-full mr-2"></div>
                        <span>Qualification</span>
                      </div>
                    )}
                    {leagueSettings.relegationPosition > 0 && (
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span>Relegation</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Fixtures;