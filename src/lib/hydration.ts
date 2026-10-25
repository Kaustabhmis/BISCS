/**
 * True during the first render of a pre-rendered page. Content that is
 * already painted from the static HTML must not be hidden and re-animated
 * (that would flash), so entrance animations skip it on the initial load.
 */
export const initialLoad = { prerendered: false }
