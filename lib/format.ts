export function truncateAddress(addr: string, lead = 6, tail = 5): string {
  if (!addr) return ''
  if (addr.length <= lead + tail + 3) return addr
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`
}

export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '$0.00'
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatAmount(v: string | number, max = 6): string {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (!Number.isFinite(n)) return '0'
  return n.toLocaleString('en-US', { maximumFractionDigits: max })
}
