import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getUserHoldings } from '@/lib/require-holding'

export async function GET() {
  const user = await requireUser()
  const holdings = await getUserHoldings(user.id)
  return NextResponse.json({ ok: true, holdings })
}
