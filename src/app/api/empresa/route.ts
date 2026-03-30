import { NextResponse } from 'next/server'
import { requireContext } from '@/lib/require-context'

export async function GET() {
  const { context, nome, isHolding } = await requireContext()
  return NextResponse.json({ ok: true, data: { id: context.id, nome, isHolding } })
}
