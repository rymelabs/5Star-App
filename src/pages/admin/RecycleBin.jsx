import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useRecycleBin } from '../../context/RecycleBinContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Trash2, RotateCcw, Clock, AlertTriangle, ChevronDown, ChevronUp, Package, Calendar, Users, FileText, Trophy, Layers } from 'lucide-react';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import Toast from '../../components/Toast';
import NewTeamAvatar from '../../components/NewTeamAvatar';

const RecycleBin = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    recycleBinItems,
    groupedItems,
    loading,
    retentionDays,
    restoreFromRecycleBin,
    permanentlyDelete,
    emptyRecycleBin,
    getDaysUntilExpiration
  } = useRecycleBin();

  const [toast, setToast] = useState(null);
  const [modalConfig, setModalConfig] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [processingItem, setProcessingItem] = useState(null);

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const getItemTypeIcon = (itemType) => {
    switch (itemType) {
      case 'team': return Users;
      case 'fixture': return Calendar;
      case 'article': case 'news': return FileText;
      case 'season': return Trophy;
      case 'league': return Layers;
      case 'competition': return Trophy;
      default: return Package;
    }
  };

  const getItemTypeLabel = (itemType) => {
    const labels = {
      team: 'Teams',
      fixture: 'Fixtures',
      article: 'Articles',
      news: 'Articles',
      season: 'Seasons',
      league: 'Leagues',
      competition: 'Competitions',
      table: 'League Tables'
    };
    return labels[itemType] || itemType;
  };

  const getItemName = (item) => {
    return item.name || item.title || item.originalId || 'Unnamed Item';
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRestore = async (item) => {
    setProcessingItem(item.recycleBinId);
    try {
      await restoreFromRecycleBin(item.recycleBinId);
      setToast({
        type: 'success',
        message: `${getItemName(item)} has been restored successfully.`
      });
    } catch (error) {
      setToast({
        type: 'error',
        message: `Failed to restore: ${error.message}`
      });
    } finally {
      setProcessingItem(null);
    }
  };

  const handlePermanentDelete = (item) => {
    setModalConfig({
      title: 'Permanently Delete',
      message: `Are you sure you want to permanently delete "${getItemName(item)}"? This action cannot be undone.`,
      confirmText: 'DELETE FOREVER',
      onConfirm: async () => {
        setProcessingItem(item.recycleBinId);
        try {
          await permanentlyDelete(item.recycleBinId);
          setToast({
            type: 'success',
            message: `${getItemName(item)} has been permanently deleted.`
          });
        } catch (error) {
          setToast({
            type: 'error',
            message: `Failed to delete: ${error.message}`
          });
        } finally {
          setProcessingItem(null);
          setModalConfig(null);
        }
      }
    });
  };

  const handleEmptyRecycleBin = () => {
    if (recycleBinItems.length === 0) return;

    setModalConfig({
      title: 'Empty Recycle Bin',
      message: `Are you sure you want to permanently delete all ${recycleBinItems.length} items? This action cannot be undone.`,
      confirmText: 'EMPTY RECYCLE BIN',
      onConfirm: async () => {
        try {
          await emptyRecycleBin();
          setToast({
            type: 'success',
            message: 'Recycle bin has been emptied.'
          });
        } catch (error) {
          setToast({
            type: 'error',
            message: `Failed to empty recycle bin: ${error.message}`
          });
        } finally {
          setModalConfig(null);
        }
      }
    });
  };

  const renderItemCard = (item) => {
    const Icon = getItemTypeIcon(item.itemType);
    const daysLeft = getDaysUntilExpiration(item.deletedAt);
    const isExpiringSoon = daysLeft <= 7;
    const isProcessing = processingItem === item.recycleBinId;

    return (
      <div 
        key={item.recycleBinId}
        className={`relative overflow-hidden rounded-xl border bg-[#0b1020] transition-all ${
          isExpiringSoon ? 'border-yellow-500/30' : 'border-white/5'
        } hover:border-white/10 hover:bg-[#111629]`}
      >
        {/* Background Gradients */}
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-brand-purple/5 blur-3xl" />
        <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {item.itemType === 'team' && item.logo ? (
                <NewTeamAvatar team={item} size={40} className="flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white truncate">{getItemName(item)}</h3>
                <p className="text-xs text-gray-400 capitalize">{item.itemType}</p>
              </div>
            </div>

            {/* Expiration Badge */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isExpiringSoon 
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                : 'bg-white/5 text-gray-400 border border-white/10'
            }`}>
              <Clock className="w-3 h-3" />
              {daysLeft}d left
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1 mb-4 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Deleted:</span>
              <span>{formatDate(item.deletedAt)}</span>
            </div>
            {item.deletedByName && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">By:</span>
                <span>{item.deletedByName}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRestore(item)}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              Restore
            </button>
            <button
              onClick={() => handlePermanentDelete(item)}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="ml-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-brand-purple" />
              <div>
                <h1 className="text-lg font-bold text-white">Recycle Bin</h1>
                <p className="text-xs text-gray-400">Items auto-delete after {retentionDays} days</p>
              </div>
            </div>
          </div>
          
          {recycleBinItems.length > 0 && (
            <button
              onClick={handleEmptyRecycleBin}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Empty All
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Info Banner */}
        <div className="flex items-start gap-3 mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium text-sm mb-1">
              Items are kept for {retentionDays} days before permanent deletion
            </p>
            <p className="text-gray-400 text-xs">
              You can restore deleted items anytime before they expire, or permanently delete them immediately.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recycleBinItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Recycle Bin is Empty</h3>
            <p className="text-gray-400 text-sm">
              Items you delete will appear here for {retentionDays} days before permanent deletion.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <span className="text-sm text-gray-400">
                {recycleBinItems.length} {recycleBinItems.length === 1 ? 'item' : 'items'} in recycle bin
              </span>
              <span className="text-xs text-gray-500">
                {Object.keys(groupedItems).length} {Object.keys(groupedItems).length === 1 ? 'category' : 'categories'}
              </span>
            </div>

            {/* Grouped Items */}
            {Object.entries(groupedItems).map(([itemType, items]) => {
              const Icon = getItemTypeIcon(itemType);
              const isExpanded = expandedGroups[itemType] !== false; // Default to expanded

              return (
                <div key={itemType} className="rounded-xl border border-white/5 bg-[#0b1020]/50 overflow-hidden">
                  <button
                    onClick={() => toggleGroup(itemType)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-brand-purple/20 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-brand-purple" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-white">{getItemTypeLabel(itemType)}</h3>
                        <p className="text-xs text-gray-400">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-white/5 mt-2">
                      {items.map(renderItemCard)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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

export default RecycleBin;
