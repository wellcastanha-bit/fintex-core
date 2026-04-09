const PAGE_SIZE = 1000

type PageFn<T> = (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>

/**
 * Busca todos os registros de uma query Supabase em batches de PAGE_SIZE.
 * Uso:
 *   const rows = await fetchAll((from, to) =>
 *     supabase.from('table').select('...').eq('x', y).range(from, to)
 *   )
 */
export async function fetchAll<T>(queryFn: PageFn<T>): Promise<T[]> {
  let offset = 0
  const all: T[] = []

  while (true) {
    const { data, error } = await queryFn(offset, offset + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return all
}
