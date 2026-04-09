import { cookies } from 'next/headers'

const COOKIE_NAME = 'holding_id'

export async function setHoldingId(id: string) {
  const store = await cookies()
  store.set(COOKIE_NAME, id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function getHoldingId(): Promise<string | null> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value ?? null
}

export async function clearHoldingId() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
