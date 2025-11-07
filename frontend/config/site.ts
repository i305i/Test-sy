export const siteConfig = {
  name: 'نظام إدارة الشركات والوثائق',
  description: 'نظام إلكتروني لإدارة بيانات الشركات داخل المؤسسة وحفظ وثائقها',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  links: {
    github: 'https://github.com',
    docs: '/docs',
  },
  version: '1.0.0',
};

export const appConfig = {
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  currency: 'SAR',
  locale: 'ar-SA',
  timezone: 'Asia/Riyadh',
};

export const paginationConfig = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
};

export const fileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'],
};

