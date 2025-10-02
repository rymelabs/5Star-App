import React, { createContext, useContext, useState, useEffect } from 'react';
import { competitionsCollection, adminActivityCollection } from '../firebase/firestore';
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
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

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
    try {
      const competitionId = await competitionsCollection.add(competitionData);
      
      // Log activity
      if (user) {
        await adminActivityCollection.log({
          action: 'add',
          type: 'competition',
          itemId: competitionId,
          itemName: competitionData.name,
          userId: user.uid,
          userName: user.displayName || user.email
        });
      }
      
      return competitionId;
    } catch (error) {
      console.error('Error adding competition:', error);
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
      console.error('Error updating competition:', error);
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
      console.error('Error deleting competition:', error);
      throw error;
    }
  };

  const value = {
    competitions,
    loading,
    addCompetition,
    updateCompetition,
    deleteCompetition
  };

  return (
    <CompetitionsContext.Provider value={value}>
      {children}
    </CompetitionsContext.Provider>
  );
};
