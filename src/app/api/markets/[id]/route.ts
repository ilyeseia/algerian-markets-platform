import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateMarketSchema = z.object({
  name: z.string().min(1, 'Market name is required').optional(),
  description: z.string().optional(),
  location: z.string().min(1, 'Location is required').optional(),
  region: z.string().min(1, 'Region is required').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isActive: z.boolean().optional(),
})

interface RouteParams {
  params: { id: string }
}

// GET /api/markets/[id] - Get single market
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const market = await db.market.findUnique({
      where: { id: params.id },
      include: {
        vendors: {
          where: { isActive: true },
          include: {
            _count: {
              select: { priceEntries: true }
            }
          }
        },
        _count: {
          select: {
            vendors: { where: { isActive: true } },
            priceEntries: true
          }
        }
      }
    })

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(market)
  } catch (error) {
    console.error('Error fetching market:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market' },
      { status: 500 }
    )
  }
}

// PUT /api/markets/[id] - Update market
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const validatedData = updateMarketSchema.parse(body)

    const market = await db.market.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        vendors: {
          where: { isActive: true },
          include: {
            _count: {
              select: { priceEntries: true }
            }
          }
        },
        _count: {
          select: {
            vendors: { where: { isActive: true } },
            priceEntries: true
          }
        }
      }
    })

    return NextResponse.json(market)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating market:', error)
    return NextResponse.json(
      { error: 'Failed to update market' },
      { status: 500 }
    )
  }
}

// DELETE /api/markets/[id] - Delete market
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await db.market.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Market deleted successfully' })
  } catch (error) {
    console.error('Error deleting market:', error)
    return NextResponse.json(
      { error: 'Failed to delete market' },
      { status: 500 }
    )
  }
}