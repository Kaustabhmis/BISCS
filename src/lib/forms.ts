import { encodeForm, type FormValues } from './validation'

/**
 * Submits a form to Netlify Forms. Resolves only when Netlify accepts the
 * submission (2xx); otherwise throws, so the UI never shows a false success.
 *
 * Netlify only accepts submissions on a deployed site where the form was
 * detected at build time. Under `npm run dev` this request fails and the
 * form correctly shows its error state.
 */
export async function submitNetlifyForm(
  endpoint: string,
  formName: string,
  values: FormValues,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html' },
    body: encodeForm({ 'form-name': formName, ...values }),
    signal,
  })
  if (!res.ok) throw new Error(`Form submission failed with status ${res.status}`)
}
