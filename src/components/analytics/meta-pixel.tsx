import Script from "next/script";

/**
 * Meta (Facebook) Pixel — base code.
 *
 * App Router manages <head>, so the pixel is injected via `next/script` rather
 * than a raw <script> in the layout. The ID is overridable via
 * `NEXT_PUBLIC_META_PIXEL_ID` and falls back to the configured default; render
 * nothing when unset so non-prod environments stay clean.
 *
 * **Why the loader is hand-rolled rather than Meta's stock snippet.** The stock
 * snippet injects `fbevents.js` immediately, and that ~250KB library measured as
 * the single largest contributor to mobile Total Blocking Time: 1,237ms of a
 * 2,730ms TBT, more than every other third party combined. So the snippet is
 * split in two:
 *
 *  1. The `fbq` stub runs inline — a few hundred bytes, fetches nothing, and
 *     queues any calls made before the library arrives.
 *  2. `fbevents.js` loads on the visitor's first interaction (scroll, tap, key).
 *
 * Queued calls (`init`, `PageView`, any `Lead` fired meanwhile) flush once the
 * library loads, so nothing is dropped: `fbq` is always a function, which is
 * exactly what `fireBrowserLead` checks before firing. A Lead that flushes late
 * still dedups against the server-side Conversions API event via its shared
 * eventID — and a form submit implies interaction, so the library is always
 * loaded by then.
 *
 * **The tradeoff, deliberately taken.** There is no idle fallback: an idle
 * callback fires while the page is still settling, which put the 250KB straight
 * back into the blocking window and defeated the point. Interaction-only means a
 * visitor who bounces without scrolling or tapping sends no PageView. `scroll`
 * is a trigger, so this is limited to true zero-interaction bounces — the
 * cheapest traffic to lose, against ~1.2s of blocking on every mobile session.
 * If PageView completeness ever matters more than mobile Core Web Vitals, add
 * `requestIdleCallback(load, {timeout: 4000})` back below and accept the score.
 *
 * Note: the base pixel fires a single `PageView` on initial load. App Router
 * client-side navigations are not auto-tracked — add an `fbq('track','PageView')`
 * on route change if SPA pageviews are needed.
 */
const ENV_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "2378714735952830";

/** `pixelId` (from site settings) wins; falls back to the env/default id. */
export function MetaPixel({ pixelId }: { pixelId?: string } = {}) {
  const PIXEL_ID = pixelId || ENV_PIXEL_ID;
  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[]}(window,document,'script');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');
(function(){var done=false;
function load(){if(done)return;done=true;
var s=document.createElement('script');s.async=true;
s.src='https://connect.facebook.net/en_US/fbevents.js';
document.head.appendChild(s)}
var evts=['pointerdown','keydown','touchstart','scroll'];
function first(){evts.forEach(function(e){window.removeEventListener(e,first)});load()}
evts.forEach(function(e){window.addEventListener(e,first,{once:true,passive:true})})})();`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
          aria-hidden="true"
        />
      </noscript>
    </>
  );
}
