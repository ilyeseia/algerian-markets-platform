import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createPriceEntrySchema = z.object({
  price: z.number().positive('Price must be positive'),
  currency: z.string().default('DZD'),
  notes: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  marketId: z.string().min(1, 'Market ID is required'),
  vendorId: z.string().min(1, 'Vendor ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
})

const updatePriceEntrySchema = z.object({
  price: z.number().positive('Price must be positive').optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  userId: z.string().min(1, 'User ID is required').optional(),
  marketId: z.string().min(1, 'Market ID is required').optional(),
  vendorId: z.string().min(1, 'Vendor ID is required').optional(),
  productId: z.string().min(1, 'Product ID is required').optional(),
})

// GET /api/price-entries - Get all price entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const productId = searchParams.get('productId') || ''
    const marketId = searchParams.get('marketId') || ''
    const vendorId = searchParams.get('vendorId') || ''
    const userId = searchParams.get('userId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (productId) where.productId = productId
    if (marketId) where.marketId = marketId
    if (vendorId) where.vendorId = vendorId
    if (userId) where.userId = userId

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const [priceEntries, total] = await Promise.all([
      db.priceEntry.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          market: {
            select: { id: true, name: true, location: true }
          },
          vendor: {
            select: { id: true, name: true }
          },
          product: {
            select: { id: true, name: true, unit: true },
            include: {
              category: {
                select: { id: true, name: true, color: true }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' }
      }),
      db.priceEntry.count({ where })
    ])

    return NextResponse.json({
      priceEntries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching price entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price entries' },
      { status: 500 }
    )
  }
}

// POST /api/price-entries - Create new price entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createPriceEntrySchema.parse(body)

    // Verify related entities exist
    const [user, market, vendor, product] = await Promise.all([
      db.user.findUnique({ where: { id: validatedData.userId } }),
      db.market.findUnique({ where: { id: validatedData.marketId } }),
      db.vendor.findUnique({ where: { id: validatedData.vendorId } }),
      db.product.findUnique({ where: { id: validatedData.productId } })
    ])

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const priceEntry = await db.priceEntry.create({
      data: validatedData,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        market: {
          select: { id: true, name: true, location: true }
        },
        vendor: {
          select: { id: true, name: true }
        },
        product: {
          select: { id: true, name: true, unit: true },
          include: {
            category: {
              select: { id: true, name: true, color: true }
            }
          }
        }
      }
    })

    return NextResponse.json(priceEntry, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating price entry:', error)
    return NextResponse.json(
      { error: 'Failed to create price entry' },
      { status: 500 }
    )
  }
}