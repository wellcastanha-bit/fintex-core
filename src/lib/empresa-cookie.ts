import { cookies } from 'next/headers'

const COOKIE_NAME = 'empresa_id'

export async function setEmpresaId(id: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function getEmpresaId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

export async function clearEmpresaId() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
