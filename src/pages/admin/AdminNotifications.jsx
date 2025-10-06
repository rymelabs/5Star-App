import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Send, Trash2, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { getFirebaseDb } from '../../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import Toast from '../../components/Toast';

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
  });

  const notificationTypes = [
    { value: 'info', label: 'Information', color: 'blue' },
    { value: 'announcement', label: 'Announcement', color: 'purple' },
    { value: 'warning', label: 'Warning', color: 'yellow' },
    { value: 'update', label: 'App Update', color: 'green' },
    { value: 'event', label: 'Special Event', color: 'orange' },
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority' },
    { value: 'normal', label: 'Normal Priority' },
    { value: 'high', label: 'High Priority' },
  ];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const db = getFirebaseDb();
      const notificationsRef = collection(db, 'adminNotifications');
      const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setSending(true);
      const db = getFirebaseDb();
      
      // Create admin notification
      const adminNotificationData = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        priority: formData.priority,
        createdAt: serverTimestamp(),
        active: true,
        viewCount: 0,
        dismissCount: 0,
      };

      await addDoc(collection(db, 'adminNotifications'), adminNotificationData);

      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'info',
        priority: 'normal',
      });

      showToast('Notification sent successfully!', 'success');
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      showToast('Failed to send notification', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      const db = getFirebaseDb();
      await deleteDoc(doc(db, 'adminNotifications', notificationId));
      showToast('Notification deleted', 'success');
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      showToast('Failed to delete notification', 'error');
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      announcement: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      update: 'text-green-400 bg-green-500/10 border-green-500/20',
      event: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    };
    return colors[type] || colors.info;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: { text: 'Low', color: 'bg-gray-500/20 text-gray-400' },
      normal: { text: 'Normal', color: 'bg-blue-500/20 text-blue-400' },
      high: { text: 'High', color: 'bg-red-500/20 text-red-400' },
    };
    return badges[priority] || badges.normal;
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
            <Bell className="w-5 h-5 text-primary-500" />
            <div>
              <h1 className="admin-header">Notifications Management</h1>
              <p className="text-sm text-gray-400">Send notifications to all users</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Create Notification Form */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-primary-400" />
            Create New Notification
          </h2>

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="input-field w-full"
                placeholder="Enter notification title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                className="input-field w-full resize-none"
                placeholder="Enter notification message"
                rows="4"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="input-field w-full"
                >
                  {notificationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="input-field w-full"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
              <p className="text-sm text-blue-300">
                This notification will be shown to all active users
              </p>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Notification
                </>
              )}
            </button>
          </form>
        </div>

        {/* Notification History */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-400" />
            Notification History
            <span className="ml-auto text-sm text-gray-400">
              {notifications.length} notifications
            </span>
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => {
                const priorityBadge = getPriorityBadge(notification.priority);
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${getTypeColor(notification.type)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">
                            {notification.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityBadge.color}`}>
                            {priorityBadge.text}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-dark-700 text-gray-400">
                            {notification.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {notification.createdAt?.toDate?.()?.toLocaleString() || 'Just now'}
                          </span>
                          <span>👁️ {notification.viewCount || 0} views</span>
                          <span>✕ {notification.dismissCount || 0} dismissed</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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

export default AdminNotifications;
