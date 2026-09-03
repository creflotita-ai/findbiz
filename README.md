# FindBiz V4 — Real Business Search

FindBiz V4 upgrades the static demo into a real, user-triggered business search.

## Current features

- London default location
- Plumbers
- Restaurants
- Electricians
- Dentists
- Barbers
- Live OpenStreetMap/Nominatim search through a Cloudflare Worker
- Website-listed vs no-website-listed indicator
- Lead-priority score
- OpenStreetMap source link
- Clear disclaimer that missing website data is not proof of no website

## Data source

OpenStreetMap / Nominatim.

Nominatim is a best-match search service; it does not provide a complete list of all businesses in a city. For a larger commercial product, FindBiz should eventually move to a dedicated business-data provider or its own licensed data pipeline.

Nominatim policy:
https://operations.osmfoundation.org/policies/nominatim/

Cloudflare Workers free limits currently include 100,000 requests/day:
https://developers.cloudflare.com/workers/platform/limits/

## Setup

The GitHub Pages site is static. `app.js` must be pointed at the deployed Cloudflare Worker URL before live search will work.

See `worker/README.md`.
