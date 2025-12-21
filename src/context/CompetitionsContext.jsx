import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { competitionsCollection, adminActivityCollection } from '../firebase/firestore';
import useCachedState from '../hooks/useCachedState';
import { useAuth } from './AuthContext';

const CompetitionsContext = createContext();

export const useCompetitions = () => {
  const context = useContext(CompetitionsContext);
  if (!context) {
    throw new Error('useCompetitions must be used within a CompetitionsProvider');
  }
  return context;
};

export const CompetitionsProvider = ({ children }) => {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useCachedState('competitions:list', []);
  const [loading, setLoading] = useState(true);
  const ownerId = user?.uid || null;
  const ownerName = user?.displayName || user?.name || user?.email || 'Unknown Admin';
  const isSuperAdmin = user?.isSuperAdmin;
  const isAdmin = user?.isAdmin;

  // Load competitions
  useEffect(() => {
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      setLoading(false);
      return;
    }

    const unsubscribe = competitionsCollection.onSnapshot((updatedCompetitions) => {
      setCompetitions(updatedCompetitions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addCompetition = async (competitionData) => {
    if (!isAdmin) {
      throw new Error('Only admins can add competitions');
    }

    try {
      const payload = {
        ...competitionData,
        ownerId,
        ownerName
      };

      const competitionId = await competitionsCollection.add(payload);
      
      // Log activity
      if (user) {
        await adminActivityCollection.log({
          action: 'add',
          type: 'competition',
          itemId: competitionId,
          itemName: payload.name,
          userId: user.uid,
          userName: user.displayName || user.email
        });
      }
      
      return competitionId;
    } catch (error) {
      throw error;
    }
  };

  const updateCompetition = async (competitionId, updates) => {
    try {
      await competitionsCollection.update(competitionId, updates);
      
      // Log activity
      if (user) {
        const competition = competitions.find(c => c.id === competitionId);
        await adminActivityCollection.log({
          action: 'update',
          type: 'competition',
          itemId: competitionId,
          itemName: competition?.name || 'Unknown Competition',
          userId: user.uid,
          userName: user.displayName || user.email
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const deleteCompetition = async (competitionId) => {
    try {
      const competition = competitions.find(c => c.id === competitionId);
      await competitionsCollection.delete(competitionId);
      
      // Log activity
      if (user) {
        await adminActivityCollection.log({
          action: 'delete',
          type: 'competition',
          itemId: competitionId,
          itemName: competition?.name || 'Unknown Competition',
          userId: user.uid,
          userName: user.displayName || user.email
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const ownedCompetitions = useMemo(() => {
    if (isSuperAdmin) return competitions;
    if (!isAdmin) return [];
    return competitions.filter(competition => competition.ownerId === ownerId);
  }, [competitions, isAdmin, isSuperAdmin, ownerId]);

  const value = useMemo(() => ({
    competitions,
    ownedCompetitions,
    loading,
    addCompetition,
    updateCompetition,
    deleteCompetition
  }), [competitions, ownedCompetitions, loading, addCompetition, updateCompetition, deleteCompetition]);

  return (
    <CompetitionsContext.Provider value={value}>
      {children}
    </CompetitionsContext.Provider>
  );
};
