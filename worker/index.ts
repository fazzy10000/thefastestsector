import { createRemoteJWKSet, jwtVerify } from 'jose'

interface Env {
  IMAGES: R2Bucket
  FIREBASE_PROJECT_ID: string
  R2_PUBLIC_URL: string
}

const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

async function verifyFirebaseIdToken(token: string, env: Env) {
  jwks ??= createRemoteJWKSet(new URL(FIREBASE_JWKS_URL))
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
    audience: env.FIREBASE_PROJECT_ID,
  })
  return payload
}

async function handleUpload(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
  if (!token) {
    return Response.json({ error: 'Missing Authorization header' }, { status: 401 })
  }

  try {
    await verifyFirebaseIdToken(token, env)
  } catch {
    return Response.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  const formData = await request.formData()
  // workers-types' FormData.get() is typed as string | null, but the Workers runtime
  // actually returns a File for multipart file fields.
  const file = formData.get('file') as unknown as File | null
  if (!file) {
    return Response.json({ error: 'Missing file' }, { status: 400 })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `images/${Date.now()}_${safeName}`

  await env.IMAGES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  })

  return Response.json({ url: `${env.R2_PUBLIC_URL}/${key}` })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/upload' && request.method === 'POST') {
      return handleUpload(request, env)
    }

    return new Response('Not found', { status: 404 })
  },
}
