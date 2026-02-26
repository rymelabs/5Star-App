import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Target, TrendingUp, Activity, Shield, Clock, Award, ChevronDown } from 'lucide-react';
import { useFootball } from '../context/FootballContext';
import SurfaceCard from '../components/ui/SurfaceCard';
import BackButton from '../components/ui/BackButton';
import NewTeamAvatar from '../components/NewTeamAvatar';

const PlayerComparison = () => {
    const navigate = useNavigate();
    const { teams, fixtures } = useFootball();
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    // Get all players from all teams
    const allPlayers = useMemo(() => {
        const players = [];
        teams.forEach(team => {
            (team.players || []).forEach(player => {
                players.push({ ...player, teamId: team.id, teamName: team.name, team });
            });
        });
        return players;
    }, [teams]);

    // Filter players by search query
    const filteredPlayers = useMemo(() => {
        if (!searchQuery.trim()) return allPlayers.slice(0, 20);
        const q = searchQuery.toLowerCase();
        return allPlayers.filter(p =>
            p.name?.toLowerCase().includes(q) || p.teamName?.toLowerCase().includes(q)
        ).slice(0, 20);
    }, [allPlayers, searchQuery]);

    // Calculate stats for a player
    const getPlayerStats = (playerId) => {
        const stats = { matchesPlayed: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0 };
        fixtures.forEach(fixture => {
            if (!fixture.events || fixture.status !== 'completed') return;
            fixture.events.forEach(event => {
                if (event.playerId === playerId) {
                    if (event.type === 'goal') stats.goals++;
                    if (event.type === 'yellow_card' || event.type === 'yellowCard') stats.yellowCards++;
                    if (event.type === 'red_card' || event.type === 'redCard') stats.redCards++;
                }
                if (event.type === 'goal' && event.assistById === playerId) stats.assists++;
            });
            const inLineup = (fixture.homeLineup || []).includes(playerId) || (fixture.awayLineup || []).includes(playerId);
            if (inLineup) stats.matchesPlayed++;
        });
        return stats;
    };

    const addPlayer = (player) => {
        if (selectedPlayers.length >= 3) return;
        if (selectedPlayers.find(p => p.id === player.id)) return;
        setSelectedPlayers(prev => [...prev, player]);
        setShowSearch(false);
        setSearchQuery('');
    };

    const removePlayer = (playerId) => {
        setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
    };

    const comparisonStats = selectedPlayers.map(p => ({
        player: p,
        stats: getPlayerStats(p.id),
    }));

    const statRows = [
        { label: 'Matches', key: 'matchesPlayed', icon: Activity, color: 'text-purple-400' },
        { label: 'Goals', key: 'goals', icon: Target, color: 'text-green-400' },
        { label: 'Assists', key: 'assists', icon: TrendingUp, color: 'text-blue-400' },
        { label: 'Goals/Match', key: 'goalsPerMatch', icon: Target, color: 'text-emerald-400', computed: true },
        { label: 'Assists/Match', key: 'assistsPerMatch', icon: TrendingUp, color: 'text-cyan-400', computed: true },
        { label: 'Yellow Cards', key: 'yellowCards', icon: Award, color: 'text-yellow-400' },
        { label: 'Red Cards', key: 'redCards', icon: Shield, color: 'text-red-400' },
        { label: 'G+A', key: 'goalContributions', icon: Activity, color: 'text-amber-400', computed: true },
    ];

    const getStatValue = (statsObj, row) => {
        if (!row.computed) return statsObj[row.key];
        if (row.key === 'goalsPerMatch') return statsObj.matchesPlayed > 0 ? (statsObj.goals / statsObj.matchesPlayed).toFixed(2) : '0.00';
        if (row.key === 'assistsPerMatch') return statsObj.matchesPlayed > 0 ? (statsObj.assists / statsObj.matchesPlayed).toFixed(2) : '0.00';
        if (row.key === 'goalContributions') return statsObj.goals + statsObj.assists;
        return '-';
    };

    const getBestIdx = (row) => {
        if (comparisonStats.length < 2) return -1;
        let bestIdx = 0;
        let bestVal = parseFloat(getStatValue(comparisonStats[0].stats, row));
        comparisonStats.forEach((cs, i) => {
            const val = parseFloat(getStatValue(cs.stats, row));
            if (val > bestVal) { bestVal = val; bestIdx = i; }
        });
        return bestIdx;
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="px-4 sm:px-6 pt-safe-top">
                <div className="flex items-center justify-between mb-6 pt-4">
                    <BackButton />
                    <h1 className="text-lg font-bold text-white">Compare Players</h1>
                    <div className="w-9" />
                </div>

                {/* Player Selection Slots */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[0, 1, 2].map(i => (
                        <div key={i}>
                            {selectedPlayers[i] ? (
                                <SurfaceCard className="p-3 rounded-2xl text-center relative">
                                    <button
                                        onClick={() => removePlayer(selectedPlayers[i].id)}
                                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center"
                                    >
                                        <X className="w-3 h-3 text-red-400" />
                                    </button>
                                    <div className="w-12 h-12 rounded-full bg-brand-purple/20 mx-auto mb-2 flex items-center justify-center overflow-hidden">
                                        {selectedPlayers[i].photo ? (
                                            <img src={selectedPlayers[i].photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-bold text-white">{selectedPlayers[i].jerseyNumber}</span>
                                        )}
                                    </div>
                                    <div className="text-xs font-semibold text-white truncate">{selectedPlayers[i].name}</div>
                                    <div className="text-[10px] text-white/40 truncate">{selectedPlayers[i].teamName}</div>
                                </SurfaceCard>
                            ) : (
                                <button
                                    onClick={() => setShowSearch(true)}
                                    className="w-full p-3 rounded-2xl border-2 border-dashed border-white/10 hover:border-brand-purple/40 transition-colors flex flex-col items-center justify-center min-h-[100px]"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-1">
                                        <Search className="w-4 h-4 text-white/30" />
                                    </div>
                                    <span className="text-[10px] text-white/30">Add Player</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Search Modal */}
                {showSearch && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                        <div className="bg-elevated rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col border border-white/10">
                            <div className="p-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <Search className="w-4 h-4 text-white/40" />
                                    <input
                                        type="text"
                                        placeholder="Search players..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                        className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                                    />
                                    <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                                        <X className="w-4 h-4 text-white/40" />
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-1 p-2">
                                {filteredPlayers.map(player => (
                                    <button
                                        key={`${player.teamId}-${player.id}`}
                                        onClick={() => addPlayer(player)}
                                        disabled={selectedPlayers.find(p => p.id === player.id)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left disabled:opacity-30"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {player.photo ? (
                                                <img src={player.photo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-white">{player.jerseyNumber}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{player.name}</div>
                                            <div className="text-[10px] text-white/40">{player.teamName} • {player.position}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Comparison Table */}
                {comparisonStats.length >= 2 && (
                    <SurfaceCard className="rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/5">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Activity className="w-4 h-4 text-brand-purple" />
                                Head-to-Head Statistics
                            </h3>
                        </div>
                        <div className="divide-y divide-white/5">
                            {statRows.map((row) => {
                                const bestIdx = getBestIdx(row);
                                const Icon = row.icon;
                                return (
                                    <div key={row.key} className="flex items-center">
                                        <div className="flex-1 p-3 text-center">
                                            <div className={`text-base font-bold ${bestIdx === 0 ? row.color : 'text-white/70'}`}>
                                                {getStatValue(comparisonStats[0].stats, row)}
                                            </div>
                                        </div>
                                        <div className="w-28 flex-shrink-0 text-center py-3 px-2">
                                            <div className="text-[10px] text-white/50 uppercase tracking-wider flex items-center justify-center gap-1">
                                                <Icon className={`w-3 h-3 ${row.color}`} />
                                                {row.label}
                                            </div>
                                        </div>
                                        <div className="flex-1 p-3 text-center">
                                            <div className={`text-base font-bold ${bestIdx === 1 ? row.color : 'text-white/70'}`}>
                                                {getStatValue(comparisonStats[1].stats, row)}
                                            </div>
                                        </div>
                                        {comparisonStats[2] && (
                                            <div className="flex-1 p-3 text-center">
                                                <div className={`text-base font-bold ${bestIdx === 2 ? row.color : 'text-white/70'}`}>
                                                    {getStatValue(comparisonStats[2].stats, row)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </SurfaceCard>
                )}

                {comparisonStats.length < 2 && (
                    <div className="text-center py-12 text-white/40">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Select at least 2 players to compare</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerComparison;
