import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../firebase/config.js';

/**
 * AFCON 2025 Service
 * Fetches fixtures, standings, and live scores
 */

// Cache configuration
const CACHE_KEY = 'afcon2025_data';
const CACHE_DURATION = 60 * 1000; // 1 minute

class AfconService {
  constructor() {
    this.cache = null;
    this.cacheTime = 0;
  }

  /**
   * Get all AFCON data (fixtures, standings, live matches)
   */
  async getData(forceRefresh = false) {
    // Check cache
    if (!forceRefresh && this.cache && (Date.now() - this.cacheTime) < CACHE_DURATION) {
      return this.cache;
    }

    // Check localStorage cache
    if (!forceRefresh) {
      try {
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
          const { data, timestamp } = JSON.parse(stored);
          if (Date.now() - timestamp < CACHE_DURATION) {
            this.cache = data;
            this.cacheTime = timestamp;
            return data;
          }
        }
      } catch (e) {
        console.warn('Failed to read AFCON cache:', e);
      }
    }

    try {
      const functions = getFirebaseFunctions();
      const getAfconDataFn = httpsCallable(functions, 'getAfconData');
      const result = await getAfconDataFn();

      if (result.data?.success) {
        // Cache the result
        this.cache = result.data;
        this.cacheTime = Date.now();
        
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: result.data,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Failed to cache AFCON data:', e);
        }

        return result.data;
      }
      
      throw new Error(result.data?.error || 'Failed to fetch AFCON data');
    } catch (error) {
      console.error('Error fetching AFCON data:', error);
      
      // Return cached data if available
      if (this.cache) {
        return { ...this.cache, stale: true };
      }
      
      throw error;
    }
  }

  /**
   * Get fixtures only
   */
  async getFixtures(forceRefresh = false) {
    const data = await this.getData(forceRefresh);
    return data.fixtures || [];
  }

  /**
   * Get standings by group
   */
  async getStandings(forceRefresh = false) {
    const data = await this.getData(forceRefresh);
    return data.standings || {};
  }

  /**
   * Get live matches
   */
  async getLiveMatches(forceRefresh = false) {
    const data = await this.getData(forceRefresh);
    return data.liveMatches || [];
  }

  /**
   * Get upcoming fixtures (not started)
   */
  getUpcomingFixtures(fixtures) {
    const now = new Date();
    return fixtures
      .filter(f => f.status === 'NS' && new Date(f.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Get results (finished matches)
   */
  getResults(fixtures) {
    return fixtures
      .filter(f => f.status === 'FT' || f.status === 'AET' || f.status === 'PEN')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Get today's matches
   */
  getTodaysMatches(fixtures) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return fixtures.filter(f => {
      const matchDate = new Date(f.date);
      return matchDate >= today && matchDate < tomorrow;
    });
  }

  /**
   * Format match date for display
   */
  formatMatchDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const matchDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (matchDay.getTime() === today.getTime()) {
      return 'Today';
    } else if (matchDay.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format match time for display
   */
  formatMatchTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Get status display text
   */
  getStatusDisplay(match) {
    if (match.isLive) {
      return match.status === 'HT' ? 'HT' : `${match.status}'`;
    }
    
    switch (match.status) {
      case 'FT': return 'Full Time';
      case 'AET': return 'After ET';
      case 'PEN': return 'Penalties';
      case 'NS': return this.formatMatchTime(match.date);
      case 'PST': return 'TBD';
      case 'CANC': return 'CANC';
      default: return match.status;
    }
  }
}

export const afconService = new AfconService();
export default afconService;
