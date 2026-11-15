// Two hosts, one deployment.
//
//   hartsdigitalhub.com       the cinematic site, the build log, training,
//                             legal pages
//   app.hartsdigitalhub.com   the assistant, as a full page, at its root.
//                             The training portal pages (login, dashboard,
//                             verify) stay reachable at their
//                             own paths on this host: magic-link emails,
//                             certificate emails and the bot's answers all
//                             point there.

const APP_HOST = 'app.hartsdigitalhub.com';
const MAIN_HOST = 'hartsdigitalhub.com';

// Pages that belong to the main site only.
const MAIN_ONLY_PATHS = new Set([
  '/index.html',
  '/training.html',
  '/insights.html',
  '/insights-response-time.html',
  '/insights-connect-existing-systems.html',
  '/insights-what-automation-costs.html',
  '/insights-chart-harmoniser.html',
  '/privacy-policy.html',
  '/terms.html',
  '/reviews.html',
]);

// Pages that belong to the app host only.
const APP_ONLY_PATHS = new Set(['/chat.html', '/verify.html', '/login.html', '/dashboard.html']);

export default function middleware(request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';
  const onAppHost = host === APP_HOST;

  // The old Training Hub overview page is retired: the hub runs one course
  // now, described on the main site's training page.
  if (url.pathname === '/training-hub.html') {
    return Response.redirect(`https://${MAIN_HOST}/training.html`, 308);
  }

  if (onAppHost) {
    // The root of the app host is the assistant. The query survives the
    // rewrite, so /?chat=growth still prefills the message box.
    if (url.pathname === '/') {
      const rewriteUrl = new URL('/chat.html', request.url);
      rewriteUrl.search = url.search;
      return new Response(null, {
        headers: { 'x-middleware-rewrite': rewriteUrl.toString() },
      });
    }
    // One address for the assistant, not two.
    if (url.pathname === '/chat.html') {
      return Response.redirect(`https://${APP_HOST}/${url.search}`, 308);
    }
    if (MAIN_ONLY_PATHS.has(url.pathname)) {
      return Response.redirect(`https://${MAIN_HOST}${url.pathname}`, 308);
    }
    return undefined;
  }

  if (APP_ONLY_PATHS.has(url.pathname)) {
    const target = url.pathname === '/chat.html' ? '/' : url.pathname;
    return Response.redirect(`https://${APP_HOST}${target}${url.search}`, 308);
  }

  return undefined;
}

export const config = {
  matcher: '/:path*',
};
