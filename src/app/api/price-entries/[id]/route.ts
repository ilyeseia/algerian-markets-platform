import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updatePriceEntrySchema = z.object({
  price: z.number().positive('Price must be positive').optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  userId: z.string().min(1, 'User ID is required').optional(),
  marketId: z.string().min(1, 'Market ID is required').optional(),
  vendorId: z.string().min(1, 'Vendor ID is required').optional(),
  productId: z.string().min(1, 'Product ID is required').optional(),
})

interface RouteParams {
  params: { id: string }
}

// GET /api/price-entries/[id] - Get single price entry
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const priceEntry = await db.priceEntry.findUnique({
      where: { id: params.id },
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

    if (!priceEntry) {
      return NextResponse.json(
        { error: 'Price entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(priceEntry)
  } catch (error) {
    console.error('Error fetching price entry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price entry' },
      { status: 500 }
    )
  }
}

// PUT /api/price-entries/[id] - Update price entry
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const validatedData = updatePriceEntrySchema.parse(body)

    // Verify related entities exist if IDs are provided
    if (validatedData.userId) {
      const user = await db.user.findUnique({ where: { id: validatedData.userId } })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    }

    if (validatedData.marketId) {
      const market = await db.market.findUnique({ where: { id: validatedData.marketId } })
      if (!market) {
        return NextResponse.json({ error: 'Market not found' }, { status: 404 })
      }
    }

    if (validatedData.vendorId) {
      const vendor = await db.vendor.findUnique({ where: { id: validatedData.vendorId } })
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
      }
    }

    if (validatedData.productId) {
      const product = await db.product.findUnique({ where: { id: validatedData.productId } })
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
    }

    const priceEntry = await db.priceEntry.update({
      where: { id: params.id },
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

    return NextResponse.json(priceEntry)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating price entry:', error)
    return NextResponse.json(
      { error: 'Failed to update price entry' },
      { status: 500 }
    )
  }
}

// DELETE /api/price-entries/[id] - Delete price entry
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await db.priceEntry.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Price entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting price entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete price entry' },
      { status: 500 }
    )
  }
}