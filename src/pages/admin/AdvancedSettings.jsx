import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { getFirebaseDb } from '../../firebase/config';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { ArrowLeft, AlertTriangle, Trash2, Database } from 'lucide-react';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import Toast from '../../components/Toast';

const AdvancedSettings = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [modalConfig, setModalConfig] = useState(null);
  const [toast, setToast] = useState(null);

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

  const handleDeleteData = (dataType) => {
    const dataTypeLabels = {
      seasons: t('advancedSettings.seasons'),
      leagues: t('advancedSettings.leagues'),
      teams: t('advancedSettings.teams'),
      fixtures: t('advancedSettings.fixtures'),
      tables: t('advancedSettings.tables'),
      articles: t('advancedSettings.articles'),
      everything: t('advancedSettings.allData'),
    };

    const label = dataTypeLabels[dataType];
    
    setModalConfig({
      title: t('advancedSettings.deleteTitle').replace('{type}', label),
      message: t('advancedSettings.deleteMessage').replace('{type}', label.toLowerCase()),
      confirmText: `DELETE ${dataType.toUpperCase()}`,
      onConfirm: async () => {
        try {
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
          
          setToast({
            type: 'success',
            message: t('advancedSettings.deleteSuccess').replace('{type}', label.toLowerCase()),
          });
          
          // Reload after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error(`Error deleting ${dataType}:`, error);
          setToast({
            type: 'error',
            message: t('advancedSettings.deleteFailed').replace('{type}', label.toLowerCase()).replace('{error}', error.message),
          });
          throw error;
        }
      },
    });
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
              <h1 className="admin-header">{t('advancedSettings.title')}</h1>
              <p className="text-sm text-gray-400">{t('advancedSettings.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 mb-8 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-500 font-semibold text-lg mb-2">⚠️ {t('advancedSettings.dangerZone')}</p>
            <p className="text-gray-400">
              {t('advancedSettings.dangerWarning')}
            </p>
          </div>
        </div>

        {/* Delete Options */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">{t('advancedSettings.deleteIndividual')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleDeleteData('seasons')}
                className="flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">{t('advancedSettings.deleteAllSeasons')}</p>
                    <p className="text-gray-400 text-sm">{t('advancedSettings.deleteAllSeasonsDesc')}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleDeleteData('leagues')}
                className="flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">{t('advancedSettings.deleteAllLeagues')}</p>
                    <p className="text-gray-400 text-sm">{t('advancedSettings.deleteAllLeaguesDesc')}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleDeleteData('teams')}
                className="flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">{t('advancedSettings.deleteAllTeams')}</p>
                    <p className="text-gray-400 text-sm">{t('advancedSettings.deleteAllTeamsDesc')}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleDeleteData('fixtures')}
                className="flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">{t('advancedSettings.deleteAllFixtures')}</p>
                    <p className="text-gray-400 text-sm">{t('advancedSettings.deleteAllFixturesDesc')}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleDeleteData('tables')}
                className="flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">{t('advancedSettings.deleteAllTables')}</p>
                    <p className="text-gray-400 text-sm">{t('advancedSettings.deleteAllTablesDesc')}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleDeleteData('articles')}
                className="flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">{t('advancedSettings.deleteAllArticles')}</p>
                    <p className="text-gray-400 text-sm">{t('advancedSettings.deleteAllArticlesDesc')}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Nuclear Option */}
          <div className="pt-6 border-t border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">{t('advancedSettings.nuclearOption')}</h2>
            <button
              onClick={() => handleDeleteData('everything')}
              className="w-full flex items-center justify-between p-6 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 hover:border-red-600/50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div className="text-left">
                  <p className="text-white font-semibold text-lg">{t('advancedSettings.deleteAllData')}</p>
                  <p className="text-gray-400 text-sm">{t('advancedSettings.deleteAllDataDesc')}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modalConfig && (
        <ConfirmDeleteModal
          isOpen={!!modalConfig}
          onClose={() => setModalConfig(null)}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdvancedSettings;
