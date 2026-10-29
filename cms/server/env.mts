/** Reads an environment variable in Netlify Functions (and in tests via process.env). */
export function env(name: string): string {
  const fromNetlify = (globalThis as { Netlify?: { env: { get(n: string): string | undefined } } }).Netlify?.env.get(name)
  return (fromNetlify ?? process.env[name] ?? '').trim()
}
