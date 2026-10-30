const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']

export function formatNumber(value, decimals = 1) {
  if (!Number.isFinite(value)) return '∞'
  const abs = Math.abs(value)
  if (abs < 1000) {
    return abs < 10 && !Number.isInteger(value) ? value.toFixed(decimals) : Math.floor(value).toString()
  }
  const tier = Math.min(Math.floor(Math.log10(abs) / 3), SUFFIXES.length - 1)
  const scaled = value / 1000 ** tier
  return `${scaled.toFixed(scaled < 100 ? decimals : 0)}${SUFFIXES[tier]}`
}
