import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createMarketSchema = z.object({
  name: z.string().min(1, 'Market name is required'),
  description: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  region: z.string().min(1, 'Region is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isActive: z.boolean().default(true),
})

const updateMarketSchema = z.object({
  name: z.string().min(1, 'Market name is required').optional(),
  description: z.string().optional(),
  location: z.string().min(1, 'Location is required').optional(),
  region: z.string().min(1, 'Region is required').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/markets - Get all markets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const region = searchParams.get('region') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (region) {
      where.region = { contains: region, mode: 'insensitive' }
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [markets, total] = await Promise.all([
      db.market.findMany({
        where,
        include: {
          vendors: {
            where: { isActive: true },
            select: { id: true, name: true }
          },
          _count: {
            select: {
              vendors: { where: { isActive: true } },
              priceEntries: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.market.count({ where })
    ])

    return NextResponse.json({
      markets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching markets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    )
  }
}

// POST /api/markets - Create new market
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createMarketSchema.parse(body)

    const market = await db.market.create({
      data: validatedData,
      include: {
        vendors: {
          where: { isActive: true },
          select: { id: true, name: true }
        },
        _count: {
          select: {
            vendors: { where: { isActive: true } },
            priceEntries: true
          }
        }
      }
    })

    return NextResponse.json(market, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating market:', error)
    return NextResponse.json(
      { error: 'Failed to create market' },
      { status: 500 }
    )
  }
}