const APP_HOST = 'app.hartsdigitalhub.com';

const MAIN_ONLY_PATHS = new Set([
  '/index.html',
  '/about.html',
  '/services.html',
  '/training.html',
  '/whatsapp-automation.html',
]);

const APP_ONLY_PATHS = new Set(['/training-hub.html', '/verify.html', '/login.html', '/dashboard.html']);

export default function middleware(request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';
  const onAppHost = host === APP_HOST;

  if (onAppHost && url.pathname === '/') {
    const rewriteUrl = new URL('/login.html', request.url);
    return new Response(null, {
      headers: { 'x-middleware-rewrite': rewriteUrl.toString() },
    });
  }

  if (onAppHost && MAIN_ONLY_PATHS.has(url.pathname)) {
    return Response.redirect(`https://hartsdigitalhub.com${url.pathname}`, 308);
  }

  if (!onAppHost && APP_ONLY_PATHS.has(url.pathname)) {
    return Response.redirect(`https://${APP_HOST}${url.pathname}`, 308);
  }

  return undefined;
}

export const config = {
  matcher: '/:path*',
};
