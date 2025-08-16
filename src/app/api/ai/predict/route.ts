import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'
import { z } from 'zod'

const predictSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  marketId: z.string().min(1, 'Market ID is required'),
  predictionDays: z.number().int().min(1).max(365).default(30),
  includeFactors: z.boolean().default(true),
})

// POST /api/ai/predict - AI-powered price predictions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, marketId, predictionDays, includeFactors } = predictSchema.parse(body)

    // Verify product and market exist
    const [product, market] = await Promise.all([
      db.product.findUnique({
        where: { id: productId },
        include: {
          category: {
            select: { id: true, name: true }
          }
        }
      }),
      db.market.findUnique({
        where: { id: marketId }
      })
    ])

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    // Fetch historical price data
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const priceEntries = await db.priceEntry.findMany({
      where: {
        productId,
        marketId,
        date: {
          gte: ninetyDaysAgo
        }
      },
      include: {
        vendor: {
          select: { id: true, name: true }
        }
      },
      orderBy: { date: 'asc' }
    })

    if (priceEntries.length < 7) {
      return NextResponse.json(
        { error: 'Insufficient historical data for prediction. Need at least 7 days of data.' },
        { status: 400 }
      )
    }

    // Prepare data for AI prediction
    const predictionData = {
      product: {
        id: product.id,
        name: product.name,
        category: product.category.name,
        unit: product.unit
      },
      market: {
        id: market.id,
        name: market.name,
        location: market.location,
        region: market.region
      },
      historicalData: priceEntries.map(entry => ({
        date: entry.date.toISOString(),
        price: entry.price,
        vendor: entry.vendor.name
      })),
      predictionDays,
      currentPrice: priceEntries[priceEntries.length - 1]?.price || 0,
      statistics: {
        averagePrice: priceEntries.reduce((sum, entry) => sum + entry.price, 0) / priceEntries.length,
        minPrice: Math.min(...priceEntries.map(entry => entry.price)),
        maxPrice: Math.max(...priceEntries.map(entry => entry.price)),
        priceVolatility: calculateVolatility(priceEntries.map(entry => entry.price)),
        trend: calculateTrend(priceEntries.map(entry => entry.price))
      }
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Create prediction prompt
    const prompt = `You are a price prediction expert for Algerian markets. Analyze the following historical price data and provide price predictions:

${JSON.stringify(predictionData, null, 2)}

Please provide:
1. Detailed price prediction for the next ${predictionDays} days
2. Predicted price range (minimum and maximum expected prices)
3. Confidence level in your prediction (0-100%)
4. Key factors influencing your prediction
5. Potential risks and uncertainties
6. Recommended actions for market participants
7. Seasonal considerations if applicable

Format your response as a JSON object with the following structure:
{
  "predictedPrice": number,
  "priceRange": {"min": number, "max": number},
  "confidence": number,
  "factors": ["factor1", "factor2", ...],
  "risks": ["risk1", "risk2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...],
  "seasonalNotes": string,
  "analysis": string
}

The predicted price should be the expected average price for the prediction period.`

    // Get AI prediction
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert price prediction specialist with deep knowledge of Algerian market dynamics, seasonal patterns, and economic factors affecting prices.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 2500
    })

    const predictionContent = completion.choices[0]?.message?.content

    if (!predictionContent) {
      return NextResponse.json(
        { error: 'Failed to generate prediction' },
        { status: 500 }
      )
    }

    // Extract JSON from response
    let predictionDataParsed
    try {
      const jsonMatch = predictionContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        predictionDataParsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (error) {
      // Fallback if JSON parsing fails
      predictionDataParsed = {
        predictedPrice: predictionData.statistics.averagePrice,
        priceRange: {
          min: predictionData.statistics.minPrice,
          max: predictionData.statistics.maxPrice
        },
        confidence: 70,
        factors: ['تاريخ الأسعار', 'اتجاهات السوق'],
        risks: ['تقلبات السوق', 'عوامل خارجية'],
        recommendations: ['مراقبة السوق بانتظام'],
        seasonalNotes: 'تحليل موسمي مطلوب',
        analysis: predictionContent
      }
    }

    // Calculate valid until date
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + predictionDays)

    // Save prediction to database
    const prediction = await db.prediction.create({
      data: {
        title: `توقعات سعر ${product.name} - ${market.name}`,
        description: `توقعات سعرية لمدة ${predictionDays} يوم`,
        targetPrice: predictionDataParsed.predictedPrice,
        confidence: predictionDataParsed.confidence,
        productId,
        marketId,
        userId: 'system', // In a real app, this would be the authenticated user
        validUntil
      }
    })

    return NextResponse.json({
      prediction: {
        id: prediction.id,
        title: prediction.title,
        description: prediction.description,
        targetPrice: prediction.targetPrice,
        confidence: prediction.confidence,
        validUntil: prediction.validUntil,
        createdAt: prediction.createdAt
      },
      details: predictionDataParsed,
      metadata: {
        historicalDataPoints: priceEntries.length,
        predictionDays,
        currentPrice: predictionData.currentPrice,
        priceChange: ((predictionDataParsed.predictedPrice - predictionData.currentPrice) / predictionData.currentPrice * 100).toFixed(2)
      }
    })

  } catch (error) {
    console.error('Error in AI prediction:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}

function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0
  
  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length
  const squaredDiffs = prices.map(price => Math.pow(price - mean, 2))
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / prices.length
  
  return Math.sqrt(variance)
}

function calculateTrend(prices: number[]): 'up' | 'down' | 'stable' {
  if (prices.length < 2) return 'stable'
  
  const firstHalf = prices.slice(0, Math.floor(prices.length / 2))
  const secondHalf = prices.slice(Math.floor(prices.length / 2))
  
  const firstAvg = firstHalf.reduce((sum, price) => sum + price, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, price) => sum + price, 0) / secondHalf.length
  
  const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100
  
  if (Math.abs(changePercent) < 2) return 'stable'
  return changePercent > 0 ? 'up' : 'down'
}