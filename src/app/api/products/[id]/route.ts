import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  isActive: z.boolean().optional(),
})

interface RouteParams {
  params: { id: string }
}

// GET /api/products/[id] - Get single product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        category: {
          select: { id: true, name: true, color: true }
        },
        _count: {
          select: { priceEntries: true }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)

    // If categoryId is provided, check if category exists
    if (validatedData.categoryId) {
      const category = await db.category.findUnique({
        where: { id: validatedData.categoryId }
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
    }

    const product = await db.product.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        category: {
          select: { id: true, name: true, color: true }
        },
        _count: {
          select: { priceEntries: true }
        }
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await db.product.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}