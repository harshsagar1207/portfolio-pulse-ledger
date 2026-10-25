<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- All backend calls go through `src/lib/api.ts` against `VITE_API_BASE_URL`; the existing Portfolio API is the source of truth, so never add a second data model or fake data.
- Features without a verified backend endpoint render `NotConnected` instead of simulated success, per the spec's data-integrity rules.
- Data reads use client-side TanStack Query (session token is in sessionStorage, unavailable during SSR).
- The app shell closes mobile navigation on route changes so destination pages are immediately visible.
- Disconnected dashboard values remain unavailable placeholders; workspace links are usable without inventing financial data.
