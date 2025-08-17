import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'
import { z } from 'zod'

const analyzeSchema = z.object({
  productId: z.string().optional(),
  marketId: z.string().optional(),
  timeframe: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  analysisType: z.enum(['PRICE_TREND', 'MARKET_INSIGHT', 'SUPPLY_DEMAND', 'SEASONAL_ANALYSIS', 'COMPETITIVE_ANALYSIS']).default('PRICE_TREND'),
})

// POST /api/ai/analyze - AI-powered market analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, marketId, timeframe, analysisType } = analyzeSchema.parse(body)

    // Fetch relevant data for analysis
    const where: any = {}
    
    if (productId) where.productId = productId
    if (marketId) where.marketId = marketId

    // Calculate date range based on timeframe
    const now = new Date()
    const startDate = new Date()
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    where.date = {
      gte: startDate,
      lte: now
    }

    const priceEntries = await db.priceEntry.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, unit: true },
          include: {
            category: {
              select: { id: true, name: true }
            }
          }
        },
        market: {
          select: { id: true, name: true, location: true, region: true }
        },
        vendor: {
          select: { id: true, name: true }
        }
      },
      orderBy: { date: 'asc' }
    })

    if (priceEntries.length === 0) {
      return NextResponse.json(
        { error: 'No price data found for the specified criteria' },
        { status: 404 }
      )
    }

    // Prepare data for AI analysis
    const analysisData = {
      priceEntries,
      timeframe,
      analysisType,
      summary: {
        totalEntries: priceEntries.length,
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString()
        },
        averagePrice: priceEntries.reduce((sum, entry) => sum + entry.price, 0) / priceEntries.length,
        priceRange: {
          min: Math.min(...priceEntries.map(entry => entry.price)),
          max: Math.max(...priceEntries.map(entry => entry.price))
        }
      }
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Create prompt based on analysis type
    let prompt = ''
    switch (analysisType) {
      case 'PRICE_TREND':
        prompt = `You are a market analyst specializing in Algerian markets. Analyze the following price data and provide insights on price trends:

${JSON.stringify(analysisData, null, 2)}

Please provide:
1. Overall price trend analysis
2. Key price movements and patterns
3. Factors that might have influenced these changes
4. Short-term price forecast
5. Confidence level in your analysis (0-100%)

Respond in Arabic language as this is for the Algerian market.`
        break

      case 'MARKET_INSIGHT':
        prompt = `You are a market intelligence expert for Algerian markets. Analyze the following market data and provide comprehensive insights:

${JSON.stringify(analysisData, null, 2)}

Please provide:
1. Market overview and current conditions
2. Key market dynamics and trends
3. Competitive landscape analysis
4. Market opportunities and challenges
5. Strategic recommendations
6. Confidence level in your analysis (0-100%)

Respond in Arabic language as this is for the Algerian market.`
        break

      case 'SUPPLY_DEMAND':
        prompt = `You are a supply and demand analyst for Algerian agricultural markets. Analyze the following price data to infer supply and demand dynamics:

${JSON.stringify(analysisData, null, 2)}

Please provide:
1. Supply and demand analysis based on price movements
2. Seasonal patterns and their impact
3. Supply chain observations
4. Demand trends and drivers
5. Market equilibrium assessment
6. Confidence level in your analysis (0-100%)

Respond in Arabic language as this is for the Algerian market.`
        break

      case 'SEASONAL_ANALYSIS':
        prompt = `You are a seasonal market analyst for Algerian markets. Analyze the following price data for seasonal patterns:

${JSON.stringify(analysisData, null, 2)}

Please provide:
1. Seasonal price patterns and trends
2. Peak and low seasons identification
3. Weather and climate impact analysis
4. Harvest cycles and their effects
5. Seasonal forecasting
6. Confidence level in your analysis (0-100%)

Respond in Arabic language as this is for the Algerian market.`
        break

      case 'COMPETITIVE_ANALYSIS':
        prompt = `You are a competitive market analyst for Algerian markets. Analyze the following price data across different vendors and markets:

${JSON.stringify(analysisData, null, 2)}

Please provide:
1. Competitive landscape overview
2. Price competitiveness analysis
3. Market share insights
4. Vendor performance comparison
5. Competitive positioning recommendations
6. Confidence level in your analysis (0-100%)

Respond in Arabic language as this is for the Algerian market.`
        break
    }

    // Get AI analysis
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert market analyst specializing in Algerian markets with deep knowledge of local economic conditions, seasonal patterns, and market dynamics.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const analysisContent = completion.choices[0]?.message?.content

    if (!analysisContent) {
      return NextResponse.json(
        { error: 'Failed to generate analysis' },
        { status: 500 }
      )
    }

    // Extract confidence level from AI response
    const confidenceMatch = analysisContent.match(/مستوى الثقة في التحليل.*?(\d+)/)
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 75

    // Save analysis to database
    const analysis = await db.marketAnalysis.create({
      data: {
        title: `تحليل ${getAnalysisTypeTitle(analysisType)} - ${timeframe}`,
        content: analysisContent,
        type: analysisType,
        confidence,
        userId: 'system' // In a real app, this would be the authenticated user
      }
    })

    return NextResponse.json({
      analysis: {
        id: analysis.id,
        title: analysis.title,
        content: analysis.content,
        type: analysis.type,
        confidence: analysis.confidence,
        createdAt: analysis.createdAt
      },
      metadata: {
        dataPoints: priceEntries.length,
        timeframe,
        analysisType
      }
    })

  } catch (error) {
    console.error('Error in AI analysis:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to perform AI analysis' },
      { status: 500 }
    )
  }
}

function getAnalysisTypeTitle(type: string): string {
  switch (type) {
    case 'PRICE_TREND': return 'اتجاهات الأسعار'
    case 'MARKET_INSIGHT': return 'رؤى السوق'
    case 'SUPPLY_DEMAND': return 'العرض والطلب'
    case 'SEASONAL_ANALYSIS': return 'التحليل الموسمي'
    case 'COMPETITIVE_ANALYSIS': return 'التحليل التنافسي'
    default: return 'تحليل السوق'
  }
}