import axios, { AxiosInstance, AxiosError } from 'axios';
import type { 
  ApiResponse, 
  ApiError, 
  LoginResponse,
  PaginatedResponse,
  PaginationParams 
} from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.client.post<ApiResponse<LoginResponse>>('/auth/login', {
      email,
      password,
    });
    return response.data.data;
  }

  async register(data: any): Promise<any> {
    const response = await this.client.post<ApiResponse>('/auth/register', data);
    return response.data.data;
  }

  async me(): Promise<any> {
    const response = await this.client.get<ApiResponse>('/auth/me');
    return response.data.data;
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await this.client.post<ApiResponse<LoginResponse>>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data.data;
  }

  // Companies
  async getCompanies(params?: PaginationParams & any): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<ApiResponse<{ companies: any[]; pagination: any }>>('/companies', {
      params,
    });
    
    // Convert backend response to PaginatedResponse format
    const backendData = response.data.data;
    return {
      items: backendData.companies || [],
      meta: {
        total: backendData.pagination?.total || 0,
        page: backendData.pagination?.page || 1,
        limit: backendData.pagination?.limit || 20,
        totalPages: backendData.pagination?.totalPages || 1,
        hasNextPage: (backendData.pagination?.page || 1) < (backendData.pagination?.totalPages || 1),
        hasPreviousPage: (backendData.pagination?.page || 1) > 1,
      },
    };
  }

  async getCompany(id: string): Promise<any> {
    const response = await this.client.get<ApiResponse>(`/companies/${id}`);
    return response.data.data.company; // Return company directly
  }

  async createCompany(data: any): Promise<any> {
    const response = await this.client.post<ApiResponse>('/companies', data);
    return response.data.data.company; // Return company directly
  }

  async updateCompany(id: string, data: any): Promise<any> {
    const response = await this.client.patch<ApiResponse>(`/companies/${id}`, data);
    return response.data.data.company; // Return company directly
  }

  async deleteCompany(id: string): Promise<void> {
    await this.client.delete(`/companies/${id}`);
  }

  // Documents
  async getDocuments(companyId: string, params?: PaginationParams & any): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<ApiResponse<{ documents: any[]; pagination: any }>>(
      `/companies/${companyId}/documents`,
      { params }
    );
    
    // Convert backend response to PaginatedResponse format
    const backendData = response.data.data;
    return {
      items: backendData.documents || [],
      meta: {
        total: backendData.pagination?.total || 0,
        page: backendData.pagination?.page || 1,
        limit: backendData.pagination?.limit || 20,
        totalPages: backendData.pagination?.totalPages || 1,
        hasNextPage: (backendData.pagination?.page || 1) < (backendData.pagination?.totalPages || 1),
        hasPreviousPage: (backendData.pagination?.page || 1) > 1,
      },
    };
  }

  async getDocument(id: string): Promise<any> {
    const response = await this.client.get<ApiResponse>(`/documents/${id}`);
    return response.data.data;
  }

  async uploadDocument(file: File, data: any): Promise<any> {
    const { companyId, ...rest } = data;
    
    if (!companyId) {
      throw new Error('companyId is required');
    }

    const formData = new FormData();
    formData.append('file', file);
    
    // إضافة باقي البيانات
    Object.keys(rest).forEach(key => {
      if (rest[key] !== null && rest[key] !== undefined) {
        formData.append(key, rest[key]);
      }
    });

    const response = await this.client.post<ApiResponse>(
      `/companies/${companyId}/documents`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }

  async downloadDocument(id: string): Promise<Blob> {
    const response = await this.client.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async updateDocument(id: string, data: any): Promise<any> {
    const response = await this.client.patch<ApiResponse>(`/documents/${id}`, data);
    return response.data.data;
  }

  async deleteDocument(companyId: string, id: string): Promise<void> {
    await this.client.delete(`/companies/${companyId}/documents/${id}`);
  }

  // ============================================================================
  // Secure Token System (One-Time Use)
  // ============================================================================
  
  /**
   * Generate a secure one-time token for document preview or download
   * @param documentId - Document ID
   * @param purpose - 'PREVIEW' or 'DOWNLOAD'
   * @returns Token data with URL
   */
  async generateDocumentToken(
    documentId: string, 
    purpose: 'PREVIEW' | 'DOWNLOAD'
  ): Promise<{
    token: string;
    url: string;
    expiresAt: string;
    purpose: string;
    expiresIn: string;
  }> {
    const response = await this.client.post<ApiResponse>(
      `/documents/${documentId}/generate-token`,
      { purpose }
    );
    return response.data.data;
  }

  /**
   * Get a secure one-time download URL for a document
   * @param documentId - Document ID
   * @returns Token URL that expires after first use
   */
  async getDocumentDownloadUrl(documentId: string): Promise<{ url: string }> {
    const tokenData = await this.generateDocumentToken(documentId, 'DOWNLOAD');
    // Convert backend URL to frontend proxy URL
    const backendUrl = tokenData.url;
    const token = backendUrl.split('/').pop() || '';
    const proxyUrl = `/api/documents/download/${token}`;
    return { url: proxyUrl };
  }

  /**
   * Get a secure one-time preview URL for a document
   * @param documentId - Document ID
   * @returns Token URL that expires after first use
   */
  async getDocumentPreviewUrl(documentId: string): Promise<{ url: string }> {
    const tokenData = await this.generateDocumentToken(documentId, 'PREVIEW');
    // Convert backend URL to frontend proxy URL
    const backendUrl = tokenData.url;
    const token = backendUrl.split('/').pop() || '';
    const proxyUrl = `/api/documents/stream/${token}`;
    return { url: proxyUrl };
  }

  // Folders
  async createFolder(companyId: string, name: string, parentId: string | null): Promise<any> {
    const response = await this.client.post<ApiResponse>('/folders', {
      companyId,
      name,
      parentId,
    });
    return response.data.data;
  }

  async getFolderContents(companyId: string, folderId: string | null): Promise<any> {
    const response = await this.client.get<ApiResponse>(`/folders/company/${companyId}`, {
      params: { folderId },
    });
    return response.data.data;
  }

  async getFolderTree(companyId: string): Promise<any> {
    const response = await this.client.get<ApiResponse>(`/folders/company/${companyId}/tree`);
    return response.data.data;
  }

  async renameFolder(id: string, name: string): Promise<any> {
    const response = await this.client.patch<ApiResponse>(`/folders/${id}/rename`, { name });
    return response.data.data;
  }

  async moveFolder(id: string, parentId: string | null): Promise<any> {
    const response = await this.client.patch<ApiResponse>(`/folders/${id}/move`, { parentId });
    return response.data.data;
  }

  async deleteFolder(id: string): Promise<void> {
    await this.client.delete(`/folders/${id}`);
  }

  async searchFolders(companyId: string, query: string): Promise<any> {
    const response = await this.client.get<ApiResponse>(`/folders/company/${companyId}/search`, {
      params: { q: query },
    });
    return response.data.data;
  }

  // Users
  async getUsers(params?: PaginationParams): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<any>>>('/users', {
      params,
    });
    return response.data.data;
  }

  async getUser(id: string): Promise<any> {
    const response = await this.client.get<ApiResponse>(`/users/${id}`);
    return response.data.data;
  }

  async createUser(data: any): Promise<any> {
    const response = await this.client.post<ApiResponse>('/users', data);
    return response.data.data;
  }

  async updateUser(id: string, data: any): Promise<any> {
    const response = await this.client.patch<ApiResponse>(`/users/${id}`, data);
    return response.data.data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }

  // Shares
  async getShares(params?: any): Promise<any> {
    const response = await this.client.get<ApiResponse>('/shares', { params });
    return response.data.data;
  }

  async createShare(data: any): Promise<any> {
    const response = await this.client.post<ApiResponse>('/shares', data);
    return response.data.data;
  }

  async updateSharePermission(id: string, permissionLevel: string): Promise<any> {
    const response = await this.client.patch<ApiResponse>(`/shares/${id}/permission`, {
      permissionLevel,
    });
    return response.data.data;
  }

  async deleteShare(id: string): Promise<void> {
    await this.client.delete(`/shares/${id}`);
  }

  // Notifications
  async getNotifications(params?: any): Promise<any> {
    const response = await this.client.get<ApiResponse>('/notifications', { params });
    return response.data.data;
  }

  async markNotificationAsRead(id: string): Promise<any> {
    const response = await this.client.patch<ApiResponse>(`/notifications/${id}/read`);
    return response.data.data;
  }

  async deleteNotification(id: string): Promise<void> {
    await this.client.delete(`/notifications/${id}`);
  }

  // Dashboard
  async getDashboardStats(): Promise<any> {
    const response = await this.client.get<ApiResponse>('/dashboard/stats');
    return response.data.data;
  }

  async getMonthlyData(): Promise<any> {
    const response = await this.client.get<ApiResponse>('/dashboard/monthly');
    return response.data.data;
  }

  // Generic methods
  async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data.data;
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async delete(url: string): Promise<void> {
    await this.client.delete(url);
  }
}

export const apiClient = new ApiClient();
export default apiClient;

