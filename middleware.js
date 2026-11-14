// Escudo Delta: registra varredura e bloqueia IP banido (fail-open). Ver escudo-edge.js.
import { escudo } from './escudo-edge.js'

export const config = {
  matcher: ['/((?!assets/|_next/static|_next/image|favicon|.*\.(?:png|jpe?g|gif|svg|webp|ico|woff2?|ttf|css|mp4|webm)$).*)'],
}

export default function middleware(req, ctx) {
  return escudo(req, ctx, ['/config.js'])
}
