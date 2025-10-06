import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirebaseDb } from '../../firebase/config';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { ArrowLeft, AlertTriangle, Trash2, Database } from 'lucide-react';

const AdvancedSettings = () => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState('');

  // Delete handler functions
  const deleteAllFromCollection = async (collectionName) => {
    const database = getFirebaseDb();
    const querySnapshot = await getDocs(collection(database, collectionName));
    const batch = writeBatch(database);
    querySnapshot.docs.forEach((document) => {
      batch.delete(doc(database, collectionName, document.id));
    });
    await batch.commit();
  };

  const handleDeleteData = async (dataType) => {
    const confirmMessage = `Are you sure you want to delete ALL ${dataType}? This action CANNOT be undone!`;
    const doubleConfirm = `Type "DELETE ${dataType.toUpperCase()}" to confirm:`;
    
    if (!confirm(confirmMessage)) return;
    
    const userInput = prompt(doubleConfirm);
    if (userInput !== `DELETE ${dataType.toUpperCase()}`) {
      alert('Deletion cancelled. Text did not match.');
      return;
    }

    try {
      setDeleting(dataType);
      
      switch (dataType) {
        case 'seasons':
          await deleteAllFromCollection('seasons');
          break;
        case 'leagues':
          await deleteAllFromCollection('leagues');
          break;
        case 'teams':
          await deleteAllFromCollection('teams');
          break;
        case 'fixtures':
          await deleteAllFromCollection('fixtures');
          break;
        case 'tables':
          await deleteAllFromCollection('leagueTable');
          break;
        case 'articles':
          await deleteAllFromCollection('news');
          break;
        case 'everything':
          await Promise.all([
            deleteAllFromCollection('seasons'),
            deleteAllFromCollection('leagues'),
            deleteAllFromCollection('teams'),
            deleteAllFromCollection('fixtures'),
            deleteAllFromCollection('leagueTable'),
            deleteAllFromCollection('news'),
            deleteAllFromCollection('adminActivity'),
          ]);
          break;
      }
      
      alert(`Successfully deleted all ${dataType}!`);
      window.location.reload(); // Refresh to show updated data
    } catch (error) {
      console.error(`Error deleting ${dataType}:`, error);
      alert(`Failed to delete ${dataType}. Error: ${error.message}`);
    } finally {
      setDeleting('');
    }
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="ml-2 flex items-center gap-2">
            <Database className="w-5 h-5 text-red-500" />
            <div>
              <h1 className="admin-header">Advanced Settings</h1>
              <p className="text-sm text-gray-400">Manage system data and danger zone operations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 mb-8 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-500 font-semibold text-lg mb-2">⚠️ Danger Zone</p>
            <p className="text-gray-400">
              These actions are <strong className="text-white">irreversible</strong>. All deleted data will be permanently removed from the database.
              Please proceed with extreme caution.
            </p>
          </div>
        </div>

        {/* Delete Options */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Delete Individual Collections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleDeleteData('seasons')}
                disabled={deleting}
                className="flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Delete All Seasons</p>
                    <p className="text-gray-400 text-sm">Remove all season data</p>
                  </div>
                </div>
                {deleting === 'seasons' && <div className="spinner" />}
              </button>

              <button
                onClick={() => handleDeleteData('leagues')}
                disabled={deleting}
                className="flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Delete All Leagues</p>
                    <p className="text-gray-400 text-sm">Remove all league data</p>
                  </div>
                </div>
                {deleting === 'leagues' && <div className="spinner" />}
              </button>

              <button
                onClick={() => handleDeleteData('teams')}
                disabled={deleting}
                className="flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Delete All Teams</p>
                    <p className="text-gray-400 text-sm">Remove all team data</p>
                  </div>
                </div>
                {deleting === 'teams' && <div className="spinner" />}
              </button>

              <button
                onClick={() => handleDeleteData('fixtures')}
                disabled={deleting}
                className="flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Delete All Fixtures</p>
                    <p className="text-gray-400 text-sm">Remove all fixture data</p>
                  </div>
                </div>
                {deleting === 'fixtures' && <div className="spinner" />}
              </button>

              <button
                onClick={() => handleDeleteData('tables')}
                disabled={deleting}
                className="flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Delete All Tables</p>
                    <p className="text-gray-400 text-sm">Remove all league table data</p>
                  </div>
                </div>
                {deleting === 'tables' && <div className="spinner" />}
              </button>

              <button
                onClick={() => handleDeleteData('articles')}
                disabled={deleting}
                className="flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Delete All Articles</p>
                    <p className="text-gray-400 text-sm">Remove all news articles</p>
                  </div>
                </div>
                {deleting === 'articles' && <div className="spinner" />}
              </button>
            </div>
          </div>

          {/* Nuclear Option */}
          <div className="pt-6 border-t border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Nuclear Option</h2>
            <button
              onClick={() => handleDeleteData('everything')}
              disabled={deleting}
              className="w-full flex items-center justify-between p-6 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 hover:border-red-600/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div className="text-left">
                  <p className="text-white font-semibold text-lg">Delete All Data</p>
                  <p className="text-gray-400 text-sm">Remove all data from all collections (seasons, leagues, teams, fixtures, tables, articles, activity logs)</p>
                </div>
              </div>
              {deleting === 'everything' && <div className="spinner" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;
