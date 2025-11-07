import { create } from 'zustand';
import apiClient from '@/lib/api';
import type { Notification } from '@/types';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearError: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getNotifications({ limit: 50 });
      const notifications = response.items || response;
      const unreadCount = notifications.filter((n: Notification) => !n.read).length;

      set({
        notifications,
        unreadCount,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'فشل في تحميل الإشعارات',
        isLoading: false,
      });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await apiClient.markNotificationAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.error?.message || 'فشل في تحديث الإشعار' });
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get();
    try {
      await Promise.all(
        notifications.filter((n) => !n.read).map((n) => apiClient.markNotificationAsRead(n.id))
      );
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          read: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.error?.message || 'فشل في تحديث الإشعارات' });
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await apiClient.deleteNotification(id);
      set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: notification && !notification.read 
            ? Math.max(0, state.unreadCount - 1) 
            : state.unreadCount,
        };
      });
    } catch (error: any) {
      set({ error: error.response?.data?.error?.message || 'فشل في حذف الإشعار' });
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  clearError: () => set({ error: null }),
}));

