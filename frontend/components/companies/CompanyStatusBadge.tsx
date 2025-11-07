import { Badge } from '@/components/ui';
import { COMPANY_STATUS_LABELS, COMPANY_STATUS_COLORS } from '@/lib/constants';
import type { CompanyStatus } from '@/types';

interface CompanyStatusBadgeProps {
  status: CompanyStatus;
}

export function CompanyStatusBadge({ status }: CompanyStatusBadgeProps) {
  const colorMap: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'info'> = {
    green: 'success',
    yellow: 'warning',
    red: 'danger',
    gray: 'default',
    blue: 'info',
    orange: 'warning', // Use warning for orange
  };

  const color = COMPANY_STATUS_COLORS[status];
  const variant = colorMap[color] || 'default';

  return <Badge variant={variant}>{COMPANY_STATUS_LABELS[status]}</Badge>;
}

