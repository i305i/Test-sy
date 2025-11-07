export enum NotificationType {
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  COMPANY_SHARED = 'COMPANY_SHARED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  DOCUMENT_EXPIRING = 'DOCUMENT_EXPIRING',
  SYSTEM = 'SYSTEM',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  relatedEntityType?: 'COMPANY' | 'DOCUMENT' | 'SHARE';
  relatedEntityId?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
}

