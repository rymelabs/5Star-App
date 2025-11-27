import { useRecycleBin } from '../context/RecycleBinContext';
import { useAuth } from '../context/AuthContext';

/**
 * Hook for soft-deleting items to recycle bin
 * Use this hook in admin components to delete items safely
 */
export const useSoftDelete = () => {
  const { moveToRecycleBin } = useRecycleBin();
  const { user } = useAuth();

  /**
   * Soft delete a team (moves to recycle bin)
   */
  const softDeleteTeam = async (team, onSuccess) => {
    try {
      await moveToRecycleBin(team, 'team', 'teams');
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      console.error('Error soft-deleting team:', error);
      throw error;
    }
  };

  /**
   * Soft delete a fixture (moves to recycle bin)
   */
  const softDeleteFixture = async (fixture, onSuccess) => {
    try {
      await moveToRecycleBin(fixture, 'fixture', 'fixtures');
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      console.error('Error soft-deleting fixture:', error);
      throw error;
    }
  };

  /**
   * Soft delete an article/news (moves to recycle bin)
   */
  const softDeleteArticle = async (article, onSuccess) => {
    try {
      await moveToRecycleBin(article, 'article', 'news');
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      console.error('Error soft-deleting article:', error);
      throw error;
    }
  };

  /**
   * Soft delete a season (moves to recycle bin)
   */
  const softDeleteSeason = async (season, onSuccess) => {
    try {
      await moveToRecycleBin(season, 'season', 'seasons');
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      console.error('Error soft-deleting season:', error);
      throw error;
    }
  };

  /**
   * Soft delete a league (moves to recycle bin)
   */
  const softDeleteLeague = async (league, onSuccess) => {
    try {
      await moveToRecycleBin(league, 'league', 'leagues');
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      console.error('Error soft-deleting league:', error);
      throw error;
    }
  };

  /**
   * Soft delete a competition (moves to recycle bin)
   */
  const softDeleteCompetition = async (competition, onSuccess) => {
    try {
      await moveToRecycleBin(competition, 'competition', 'competitions');
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      console.error('Error soft-deleting competition:', error);
      throw error;
    }
  };

  /**
   * Soft delete a league table entry (moves to recycle bin)
   */
  const softDeleteLeagueTable = async (tableEntry, onSuccess) => {
    try {
      await moveToRecycleBin(tableEntry, 'table', 'leagueTable');
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      console.error('Error soft-deleting league table:', error);
      throw error;
    }
  };

  /**
   * Generic soft delete for any item type
   */
  const softDelete = async (item, itemType, collectionName, onSuccess) => {
    try {
      await moveToRecycleBin(item, itemType, collectionName);
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      console.error(`Error soft-deleting ${itemType}:`, error);
      throw error;
    }
  };

  return {
    softDeleteTeam,
    softDeleteFixture,
    softDeleteArticle,
    softDeleteSeason,
    softDeleteLeague,
    softDeleteCompetition,
    softDeleteLeagueTable,
    softDelete
  };
};

export default useSoftDelete;
