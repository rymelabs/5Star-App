import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useRecycleBin } from '../../context/RecycleBinContext';
import { getFirebaseDb } from '../../firebase/config';
import { collection, getDocs, doc, query, where, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, AlertTriangle, Trash2, Database, RotateCcw } from 'lucide-react';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import Toast from '../../components/Toast';

const AdvancedSettings = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { retentionDays, recycleBinItems } = useRecycleBin();
  const [modalConfig, setModalConfig] = useState(null);
  const [toast, setToast] = useState(null);

  const ownerId = user?.uid || null;
  const ownerName = user?.displayName || user?.email || 'Unknown';

  // Soft delete - moves items to recycle bin instead of permanent deletion
  const softDeleteOwnedFromCollection = async (collectionName, itemType) => {
    if (!ownerId) {
      throw new Error('User not authenticated');
    }
    const database = getFirebaseDb();
    const collectionRef = collection(database, collectionName);
    const q = query(collectionRef, where('ownerId', '==', ownerId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return 0; // No documents to delete
    }

    let count = 0;
    for (const docSnapshot of querySnapshot.docs) {
      const item = { ...docSnapshot.data(), id: docSnapshot.id };
      const recycleBinId = `${collectionName}_${item.id}_${Date.now()}_${count}`;
      
      // Move to recycle bin
      await setDoc(doc(database, 'recycleBin', recycleBinId), {
        ...item,
        originalId: item.id,
        originalCollection: collectionName,
        itemType: itemType,
        ownerId: item.ownerId || ownerId,
        ownerName: item.ownerName || ownerName,
        deletedAt: serverTimestamp(),
        deletedBy: ownerId,
        deletedByName: ownerName,
        expiresAt: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
      });

      // Delete from original collection
      await deleteDoc(doc(database, collectionName, item.id));
      count++;
    }

    return count;
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
      message: `${t('advancedSettings.deleteMessage').replace('{type}', label.toLowerCase())} Items will be moved to the recycle bin for ${retentionDays} days.`,
      confirmText: `DELETE ${dataType.toUpperCase()}`,
      onConfirm: async () => {
        try {
          let totalDeleted = 0;
          
          switch (dataType) {
            case 'seasons':
              totalDeleted = await softDeleteOwnedFromCollection('seasons', 'season');
              break;
            case 'leagues':
              totalDeleted = await softDeleteOwnedFromCollection('leagues', 'league');
              break;
            case 'teams':
              totalDeleted = await softDeleteOwnedFromCollection('teams', 'team');
              break;
            case 'fixtures':
              totalDeleted = await softDeleteOwnedFromCollection('fixtures', 'fixture');
              break;
            case 'tables':
              totalDeleted = await softDeleteOwnedFromCollection('leagueTable', 'table');
              break;
            case 'articles':
              totalDeleted = await softDeleteOwnedFromCollection('news', 'article');
              break;
            case 'everything':
              const results = await Promise.all([
                softDeleteOwnedFromCollection('seasons', 'season'),
                softDeleteOwnedFromCollection('leagues', 'league'),
                softDeleteOwnedFromCollection('teams', 'team'),
                softDeleteOwnedFromCollection('fixtures', 'fixture'),
                softDeleteOwnedFromCollection('leagueTable', 'table'),
                softDeleteOwnedFromCollection('news', 'article'),
              ]);
              totalDeleted = results.reduce((sum, count) => sum + count, 0);
              break;
          }
          
          setToast({
            type: 'success',
            message: `${totalDeleted} ${label.toLowerCase()} moved to recycle bin`,
          });
          
          // Reload after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
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
        {/* Recycle Bin Link */}
        <button
          onClick={() => navigate('/admin/recycle-bin')}
          className="w-full flex items-center justify-between p-4 mb-6 bg-brand-purple/10 hover:bg-brand-purple/20 border border-brand-purple/20 hover:border-brand-purple/30 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-brand-purple" />
            <div className="text-left">
              <p className="text-white font-medium">Recycle Bin</p>
              <p className="text-gray-400 text-sm">
                {recycleBinItems.length} {recycleBinItems.length === 1 ? 'item' : 'items'} • Auto-deletes after {retentionDays} days
              </p>
            </div>
          </div>
          <ArrowLeft className="w-5 h-5 text-brand-purple rotate-180" />
        </button>

        {/* Info Banner */}
        <div className="flex items-start gap-3 mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <Database className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium text-sm">
              These actions only affect <span className="text-white font-semibold">your own data</span>. Data created by other admins will not be affected.
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Deleted items are moved to the Recycle Bin for {retentionDays} days before permanent deletion.
            </p>
          </div>
        </div>

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
                  <p className="text-blue-400 text-xs mt-1">Only deletes your own data, not other admins' data</p>
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
