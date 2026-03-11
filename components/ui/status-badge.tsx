interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  // Order statuses
  pending:        'bg-yellow-50  text-yellow-800  border-yellow-200',
  confirmed:      'bg-blue-50    text-blue-800    border-blue-200',
  shipped:        'bg-purple-50  text-purple-800  border-purple-200',
  'out for delivery': 'bg-orange-50 text-orange-800 border-orange-200',
  delivered:      'bg-green-50   text-green-800   border-green-200',
  cancelled:      'bg-red-50     text-red-800     border-red-200',
  processing:     'bg-sky-50     text-sky-800     border-sky-200',
  // Payment statuses
  paid:           'bg-green-50   text-green-800   border-green-200',
  unpaid:         'bg-red-50     text-red-800     border-red-200',
  refunded:       'bg-gray-50    text-gray-700    border-gray-200',
  // Stock statuses
  'in stock':     'bg-green-50   text-green-800   border-green-200',
  'out of stock': 'bg-red-50     text-red-800     border-red-200',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const key = (status ?? '').toLowerCase();
  const styles = statusStyles[key] ?? 'bg-gray-50 text-gray-700 border-gray-200';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles} ${className}`}
    >
      {status}
    </span>
  );
}
