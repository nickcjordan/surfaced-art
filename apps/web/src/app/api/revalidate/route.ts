import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { CATEGORIES } from '@/lib/categories'

export async function POST(request: Request) {
  const secret = process.env.REVALIDATION_SECRET
  const authHeader = request.headers.get('authorization')

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const revalidated: string[] = []

  if (body.paths && Array.isArray(body.paths)) {
    for (const path of body.paths) {
      revalidatePath(path)
      revalidated.push(path)
    }
  } else if (body.type === 'artist' && body.slug) {
    revalidatePath(`/artist/${body.slug}`)
    revalidatePath('/')
    revalidated.push(`/artist/${body.slug}`, '/')
    for (const cat of CATEGORIES) {
      revalidatePath(`/category/${cat.slug}`)
      revalidated.push(`/category/${cat.slug}`)
    }
  } else if (body.type === 'listing' && body.id) {
    revalidatePath(`/listing/${body.id}`)
    revalidatePath('/')
    revalidated.push(`/listing/${body.id}`, '/')
    if (body.category) {
      revalidatePath(`/category/${body.category}`)
      revalidated.push(`/category/${body.category}`)
    } else {
      for (const cat of CATEGORIES) {
        revalidatePath(`/category/${cat.slug}`)
        revalidated.push(`/category/${cat.slug}`)
      }
    }
  } else if (body.type === 'all') {
    revalidatePath('/', 'layout')
    revalidated.push('/ (all pages via layout)')
  } else {
    return NextResponse.json(
      { error: 'Invalid request. Provide "paths" array, or "type" with required fields.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true, revalidated })
}
