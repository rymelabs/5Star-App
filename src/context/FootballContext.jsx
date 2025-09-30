import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  seasons: [],
  currentSeason: null,
  teams: [],
  fixtures: [],
  results: [],
  leagueTable: [],
  loading: false,
  error: null,
};

// Actions
const FOOTBALL_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SEASONS: 'SET_SEASONS',
  SET_CURRENT_SEASON: 'SET_CURRENT_SEASON',
  SET_TEAMS: 'SET_TEAMS',
  SET_FIXTURES: 'SET_FIXTURES',
  SET_RESULTS: 'SET_RESULTS',
  SET_LEAGUE_TABLE: 'SET_LEAGUE_TABLE',
  ADD_SEASON: 'ADD_SEASON',
  ADD_TEAM: 'ADD_TEAM',
  ADD_FIXTURE: 'ADD_FIXTURE',
  UPDATE_FIXTURE: 'UPDATE_FIXTURE',
  UPDATE_LEAGUE_TABLE: 'UPDATE_LEAGUE_TABLE',
};

// Reducer
const footballReducer = (state, action) => {
  switch (action.type) {
    case FOOTBALL_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case FOOTBALL_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case FOOTBALL_ACTIONS.SET_SEASONS:
      return { ...state, seasons: action.payload };
    case FOOTBALL_ACTIONS.SET_CURRENT_SEASON:
      return { ...state, currentSeason: action.payload };
    case FOOTBALL_ACTIONS.SET_TEAMS:
      return { ...state, teams: action.payload };
    case FOOTBALL_ACTIONS.SET_FIXTURES:
      return { ...state, fixtures: action.payload };
    case FOOTBALL_ACTIONS.SET_RESULTS:
      return { ...state, results: action.payload };
    case FOOTBALL_ACTIONS.SET_LEAGUE_TABLE:
      return { ...state, leagueTable: action.payload };
    case FOOTBALL_ACTIONS.ADD_SEASON:
      return { ...state, seasons: [...state.seasons, action.payload] };
    case FOOTBALL_ACTIONS.ADD_TEAM:
      return { ...state, teams: [...state.teams, action.payload] };
    case FOOTBALL_ACTIONS.ADD_FIXTURE:
      return { ...state, fixtures: [...state.fixtures, action.payload] };
    case FOOTBALL_ACTIONS.UPDATE_FIXTURE:
      return {
        ...state,
        fixtures: state.fixtures.map(fixture =>
          fixture.id === action.payload.id ? { ...fixture, ...action.payload } : fixture
        ),
      };
    case FOOTBALL_ACTIONS.UPDATE_LEAGUE_TABLE:
      return { ...state, leagueTable: action.payload };
    default:
      return state;
  }
};

// Context
const FootballContext = createContext();

// Provider component
export const FootballProvider = ({ children }) => {
  const [state, dispatch] = useReducer(footballReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('5star_football_data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        dispatch({ type: FOOTBALL_ACTIONS.SET_SEASONS, payload: data.seasons || [] });
        dispatch({ type: FOOTBALL_ACTIONS.SET_CURRENT_SEASON, payload: data.currentSeason });
        dispatch({ type: FOOTBALL_ACTIONS.SET_TEAMS, payload: data.teams || [] });
        dispatch({ type: FOOTBALL_ACTIONS.SET_FIXTURES, payload: data.fixtures || [] });
        dispatch({ type: FOOTBALL_ACTIONS.SET_LEAGUE_TABLE, payload: data.leagueTable || [] });
      } catch (error) {
        console.error('Error loading football data:', error);
      }
    } else {
      // Initialize with mock data
      initializeMockData();
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const dataToSave = {
      seasons: state.seasons,
      currentSeason: state.currentSeason,
      teams: state.teams,
      fixtures: state.fixtures,
      leagueTable: state.leagueTable,
    };
    localStorage.setItem('5star_football_data', JSON.stringify(dataToSave));
  }, [state.seasons, state.currentSeason, state.teams, state.fixtures, state.leagueTable]);

  // Initialize with mock data
  const initializeMockData = () => {
    const mockSeason = {
      id: 1,
      name: '2024/25 Season',
      startDate: '2024-08-01',
      endDate: '2025-05-31',
      active: true,
    };

    const mockTeams = [
      { id: 1, name: 'Arsenal', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png' },
      { id: 2, name: 'Chelsea', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png' },
      { id: 3, name: 'Liverpool', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png' },
      { id: 4, name: 'Manchester City', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-City-Logo.png' },
      { id: 5, name: 'Manchester United', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-United-Logo.png' },
      { id: 6, name: 'Tottenham', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Tottenham-Logo.png' },
    ];

    const mockFixtures = [
      {
        id: 1,
        homeTeam: mockTeams[0],
        awayTeam: mockTeams[1],
        dateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        venue: 'Emirates Stadium',
        status: 'scheduled',
        comments: [],
      },
      {
        id: 2,
        homeTeam: mockTeams[2],
        awayTeam: mockTeams[3],
        dateTime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
        venue: 'Anfield',
        status: 'scheduled',
        comments: [],
      },
      {
        id: 3,
        homeTeam: mockTeams[4],
        awayTeam: mockTeams[5],
        dateTime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        venue: 'Old Trafford',
        status: 'completed',
        homeScore: 2,
        awayScore: 1,
        comments: [],
      },
      {
        id: 4,
        homeTeam: mockTeams[1],
        awayTeam: mockTeams[2],
        dateTime: new Date().toISOString(), // Today
        venue: 'Stamford Bridge',
        status: 'live',
        homeScore: 1,
        awayScore: 0,
        liveData: {
          minute: 67,
          events: [
            { minute: 23, type: 'Goal', player: 'N. Jackson', team: 'Chelsea' },
            { minute: 45, type: 'Yellow Card', player: 'V. van Dijk', team: 'Liverpool' },
          ],
        },
        comments: [],
      },
    ];

    const mockTable = mockTeams.map((team, index) => ({
      position: index + 1,
      team: team,
      played: 10,
      won: 7 - index,
      drawn: 2,
      lost: 1 + index,
      goalsFor: 25 - index * 2,
      goalsAgainst: 8 + index,
      goalDifference: (25 - index * 2) - (8 + index),
      points: (7 - index) * 3 + 2,
    }));

    dispatch({ type: FOOTBALL_ACTIONS.SET_SEASONS, payload: [mockSeason] });
    dispatch({ type: FOOTBALL_ACTIONS.SET_CURRENT_SEASON, payload: mockSeason });
    dispatch({ type: FOOTBALL_ACTIONS.SET_TEAMS, payload: mockTeams });
    dispatch({ type: FOOTBALL_ACTIONS.SET_FIXTURES, payload: mockFixtures });
    dispatch({ type: FOOTBALL_ACTIONS.SET_LEAGUE_TABLE, payload: mockTable });
  };

  // Add season
  const addSeason = (seasonData) => {
    const newSeason = {
      id: Date.now(),
      ...seasonData,
    };
    dispatch({ type: FOOTBALL_ACTIONS.ADD_SEASON, payload: newSeason });
    return newSeason;
  };

  // Add team
  const addTeam = (teamData) => {
    const newTeam = {
      id: Date.now(),
      ...teamData,
    };
    dispatch({ type: FOOTBALL_ACTIONS.ADD_TEAM, payload: newTeam });
    return newTeam;
  };

  // Bulk add teams
  const addBulkTeams = (teamsData) => {
    const newTeams = teamsData.map(teamData => ({
      id: Date.now() + Math.random(), // Ensure unique IDs
      logo: teamData.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(teamData.name)}&background=22c55e&color=fff&size=200`,
      stadium: teamData.stadium || '',
      founded: teamData.founded || '',
      manager: teamData.manager || '',
      ...teamData,
    }));

    // Add all teams to state
    newTeams.forEach(team => {
      dispatch({ type: FOOTBALL_ACTIONS.ADD_TEAM, payload: team });
    });

    return newTeams;
  };

  // Add fixture
  const addFixture = (fixtureData) => {
    const newFixture = {
      id: Date.now(),
      ...fixtureData,
      status: 'scheduled',
      liveData: {},
      comments: [],
    };
    dispatch({ type: FOOTBALL_ACTIONS.ADD_FIXTURE, payload: newFixture });
    return newFixture;
  };

  // Update fixture (for live updates)
  const updateFixture = (fixtureId, updates) => {
    dispatch({
      type: FOOTBALL_ACTIONS.UPDATE_FIXTURE,
      payload: { id: fixtureId, ...updates },
    });
  };

  // Calculate and update league table based on results
  const calculateLeagueTable = () => {
    const teamStats = {};
    
    // Initialize stats for all teams
    state.teams.forEach(team => {
      teamStats[team.id] = {
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      };
    });

    // Calculate stats from completed fixtures
    state.fixtures
      .filter(fixture => fixture.status === 'completed' && fixture.homeScore !== undefined && fixture.awayScore !== undefined)
      .forEach(fixture => {
        const homeStats = teamStats[fixture.homeTeam.id];
        const awayStats = teamStats[fixture.awayTeam.id];
        
        if (homeStats && awayStats) {
          homeStats.played++;
          awayStats.played++;
          homeStats.goalsFor += fixture.homeScore;
          homeStats.goalsAgainst += fixture.awayScore;
          awayStats.goalsFor += fixture.awayScore;
          awayStats.goalsAgainst += fixture.homeScore;

          if (fixture.homeScore > fixture.awayScore) {
            homeStats.won++;
            homeStats.points += 3;
            awayStats.lost++;
          } else if (fixture.homeScore < fixture.awayScore) {
            awayStats.won++;
            awayStats.points += 3;
            homeStats.lost++;
          } else {
            homeStats.drawn++;
            awayStats.drawn++;
            homeStats.points += 1;
            awayStats.points += 1;
          }

          homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst;
          awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst;
        }
      });

    // Convert to array and sort
    const table = Object.values(teamStats)
      .sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      })
      .map((stats, index) => ({
        ...stats,
        position: index + 1,
      }));

    dispatch({ type: FOOTBALL_ACTIONS.UPDATE_LEAGUE_TABLE, payload: table });
    return table;
  };

  const value = {
    ...state,
    addSeason,
    addTeam,
    addBulkTeams,
    addFixture,
    updateFixture,
    calculateLeagueTable,
  };

  return <FootballContext.Provider value={value}>{children}</FootballContext.Provider>;
};

// Hook to use football context
export const useFootball = () => {
  const context = useContext(FootballContext);
  if (!context) {
    throw new Error('useFootball must be used within a FootballProvider');
  }
  return context;
};

export default FootballContext;