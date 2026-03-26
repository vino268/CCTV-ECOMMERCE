export function formatPrice(price: number): string {
  const value = Number(price);

  if (!Number.isFinite(value)) {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export const formatINRCurrency = formatPrice;