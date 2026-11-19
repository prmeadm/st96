export const config = { runtime: 'edge' }

// Страна посетителя для маски телефона: Vercel сообщает её по IP (заголовок x-vercel-ip-country), без запроса доступа к геолокации.
export default function handler(req: Request) {
  const c = (req.headers.get('x-vercel-ip-country') ?? '').toUpperCase()
  return new Response(JSON.stringify({ country: /^[A-Z]{2}$/.test(c) ? c : null }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=3600' } })
}
