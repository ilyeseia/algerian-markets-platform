'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Store, 
  Users,
  Bell,
  Search,
  Plus,
  BarChart3,
  MapPin,
  Clock
} from 'lucide-react'

interface MarketData {
  id: string
  name: string
  location: string
  region: string
  totalProducts: number
  activeVendors: number
  avgPrice: number
  priceChange: number
}

interface PriceAlert {
  id: string
  productName: string
  marketName: string
  oldPrice: number
  newPrice: number
  change: number
  timestamp: string
}

interface MarketMetric {
  title: string
  value: string
  change: string
  icon: any
  trend: 'up' | 'down' | 'stable'
}

export default function Home() {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([])
  const [metrics, setMetrics] = useState<MarketMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate data fetching
    const fetchData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock market data
      const mockMarketData: MarketData[] = [
        {
          id: '1',
          name: 'سوق الجزائر المركزي',
          location: 'الجزائر العاصمة',
          region: 'الوسط',
          totalProducts: 245,
          activeVendors: 89,
          avgPrice: 1250.50,
          priceChange: 2.5
        },
        {
          id: '2',
          name: 'سوق وهران',
          location: 'وهران',
          region: 'الغرب',
          totalProducts: 189,
          activeVendors: 67,
          avgPrice: 980.75,
          priceChange: -1.2
        },
        {
          id: '3',
          name: 'سوق قسنطينة',
          location: 'قسنطينة',
          region: 'الشرق',
          totalProducts: 156,
          activeVendors: 45,
          avgPrice: 1100.25,
          priceChange: 0.8
        }
      ]

      // Mock price alerts
      const mockPriceAlerts: PriceAlert[] = [
        {
          id: '1',
          productName: 'طماطم',
          marketName: 'سوق الجزائر المركزي',
          oldPrice: 180,
          newPrice: 220,
          change: 22.2,
          timestamp: '2024-01-15 10:30'
        },
        {
          id: '2',
          productName: 'بطاطس',
          marketName: 'سوق وهران',
          oldPrice: 120,
          newPrice: 95,
          change: -20.8,
          timestamp: '2024-01-15 09:15'
        },
        {
          id: '3',
          productName: 'برتقال',
          marketName: 'سوق قسنطينة',
          oldPrice: 250,
          newPrice: 280,
          change: 12.0,
          timestamp: '2024-01-15 11:45'
        }
      ]

      // Mock metrics
      const mockMetrics: MarketMetric[] = [
        {
          title: 'إجمالي المنتجات',
          value: '1,247',
          change: '+12%',
          icon: ShoppingCart,
          trend: 'up'
        },
        {
          title: 'الأسواق النشطة',
          value: '24',
          change: '+3',
          icon: Store,
          trend: 'up'
        },
        {
          title: 'متوسط السعر',
          value: '1,125 دج',
          change: '+2.5%',
          icon: DollarSign,
          trend: 'up'
        },
        {
          title: 'البائعين النشطين',
          value: '342',
          change: '+18',
          icon: Users,
          trend: 'up'
        }
      ]

      setMarketData(mockMarketData)
      setPriceAlerts(mockPriceAlerts)
      setMetrics(mockMetrics)
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">جاري تحميل بيانات السوق...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <h1 className="text-xl sm:text-2xl font-bold">منصة الأسواق الجزائرية</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Search className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">بحث</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Bell className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">الإشعارات</span>
              </Button>
              <Button size="sm" className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">إضافة سعر</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{metric.value}</div>
                <p className={`text-xs ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.change} من الأسبوع الماضي
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Markets Overview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  نظرة عامة على الأسواق
                </CardTitle>
                <CardDescription>
                  أحدث البيانات من الأسواق الجزائرية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketData.map((market) => (
                    <div key={market.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                      <div className="flex items-center space-x-4 w-full sm:w-auto">
                        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base sm:text-lg truncate">{market.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{market.location}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">{market.region}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right w-full sm:w-auto">
                        <div className="flex items-center justify-end space-x-2">
                          <span className="font-semibold text-base sm:text-lg">{market.avgPrice.toFixed(2)} دج</span>
                          {market.priceChange > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                          ) : market.priceChange < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {market.activeVendors} بائع • {market.totalProducts} منتج
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Alerts */}
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  تنبيهات الأسعار
                </CardTitle>
                <CardDescription>
                  أحدث التغيرات في الأسعار
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80 sm:h-96">
                  <div className="space-y-4">
                    {priceAlerts.map((alert) => (
                      <div key={alert.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm sm:text-base">{alert.productName}</h4>
                          <Badge variant={alert.change > 0 ? "destructive" : "default"} className="text-xs">
                            {alert.change > 0 ? '+' : ''}{alert.change.toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.marketName}
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="line-through text-muted-foreground">
                              {alert.oldPrice} دج
                            </span>
                            <span className="font-semibold">
                              {alert.newPrice} دج
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{alert.timestamp.split(' ')[1]}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة منتج جديد
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  عرض التحليلات
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  التوقعات السعرية
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}