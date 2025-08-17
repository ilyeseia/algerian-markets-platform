import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().optional(),
  marketId: z.string().min(1, 'Market ID is required'),
  isActive: z.boolean().default(true),
})

const updateVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().optional(),
  marketId: z.string().min(1, 'Market ID is required').optional(),
  isActive: z.boolean().optional(),
})

// GET /api/vendors - Get all vendors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const marketId = searchParams.get('marketId') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (marketId) {
      where.marketId = marketId
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [vendors, total] = await Promise.all([
      db.vendor.findMany({
        where,
        include: {
          market: {
            select: { id: true, name: true, location: true }
          },
          _count: {
            select: { priceEntries: true }
          }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      db.vendor.count({ where })
    ])

    return NextResponse.json({
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

// POST /api/vendors - Create new vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createVendorSchema.parse(body)

    // Check if market exists
    const market = await db.market.findUnique({
      where: { id: validatedData.marketId }
    })

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    const vendor = await db.vendor.create({
      data: validatedData,
      include: {
        market: {
          select: { id: true, name: true, location: true }
        },
        _count: {
          select: { priceEntries: true }
        }
      }
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating vendor:', error)
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    )
  }
}