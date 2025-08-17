'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Calendar,
  MapPin,
  DollarSign,
  ShoppingCart
} from 'lucide-react'

interface PriceTrendData {
  date: string
  price: number
  marketName: string
  productName: string
}

interface MarketComparisonData {
  marketName: string
  averagePrice: number
  totalEntries: number
  activeVendors: number
}

interface CategoryDistributionData {
  name: string
  value: number
  color: string
}

interface PriceVolatilityData {
  productName: string
  volatility: number
  averagePrice: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

const mockPriceTrendData: PriceTrendData[] = [
  { date: '2024-01-01', price: 180, marketName: 'سوق الجزائر المركزي', productName: 'طماطم' },
  { date: '2024-01-02', price: 185, marketName: 'سوق الجزائر المركزي', productName: 'طماطم' },
  { date: '2024-01-03', price: 190, marketName: 'سوق الجزائر المركزي', productName: 'طماطم' },
  { date: '2024-01-04', price: 195, marketName: 'سوق الجزائر المركزي', productName: 'طماطم' },
  { date: '2024-01-05', price: 200, marketName: 'سوق الجزائر المركزي', productName: 'طماطم' },
  { date: '2024-01-06', price: 210, marketName: 'سوق الجزائر المركزي', productName: 'طماطم' },
  { date: '2024-01-07', price: 220, marketName: 'سوق الجزائر المركزي', productName: 'طماطم' },
]

const mockMarketComparisonData: MarketComparisonData[] = [
  { marketName: 'سوق الجزائر المركزي', averagePrice: 1250, totalEntries: 245, activeVendors: 89 },
  { marketName: 'سوق وهران', averagePrice: 980, totalEntries: 189, activeVendors: 67 },
  { marketName: 'سوق قسنطينة', averagePrice: 1100, totalEntries: 156, activeVendors: 45 },
  { marketName: 'سوق عنابة', averagePrice: 1050, totalEntries: 134, activeVendors: 38 },
  { marketName: 'سوق بليدة', averagePrice: 920, totalEntries: 98, activeVendors: 29 },
]

const mockCategoryDistributionData: CategoryDistributionData[] = [
  { name: 'خضروات', value: 35, color: '#0088FE' },
  { name: 'فواكه', value: 25, color: '#00C49F' },
  { name: 'حبوب', value: 20, color: '#FFBB28' },
  { name: 'لحوم', value: 15, color: '#FF8042' },
  { name: 'ألبان', value: 5, color: '#8884D8' },
]

const mockPriceVolatilityData: PriceVolatilityData[] = [
  { productName: 'طماطم', volatility: 15.2, averagePrice: 195 },
  { productName: 'بطاطس', volatility: 8.7, averagePrice: 120 },
  { productName: 'برتقال', volatility: 12.1, averagePrice: 265 },
  { productName: 'تفاح', volatility: 6.3, averagePrice: 180 },
  { productName: 'جزر', volatility: 9.8, averagePrice: 95 },
]

export default function AnalyticsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')
  const [selectedMarket, setSelectedMarket] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(false)

  const handleTimeframeChange = (value: string) => {
    setSelectedTimeframe(value)
    // In a real app, this would trigger data fetching
  }

  const handleMarketChange = (value: string) => {
    setSelectedMarket(value)
    // In a real app, this would trigger data filtering
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    // In a real app, this would trigger data filtering
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-DZ', {
      month: 'short',
      day: 'numeric'
    })
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
                <h1 className="text-xl sm:text-2xl font-bold">تحليلات السوق</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
                <SelectTrigger className="w-28 sm:w-32">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 أيام</SelectItem>
                  <SelectItem value="30d">30 يوم</SelectItem>
                  <SelectItem value="90d">90 يوم</SelectItem>
                  <SelectItem value="1y">سنة</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedMarket} onValueChange={handleMarketChange}>
                <SelectTrigger className="w-32 sm:w-40">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأسواق</SelectItem>
                  <SelectItem value="1">سوق الجزائر</SelectItem>
                  <SelectItem value="2">سوق وهران</SelectItem>
                  <SelectItem value="3">سوق قسنطينة</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-28 sm:w-32">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الفئات</SelectItem>
                  <SelectItem value="vegetables">خضروات</SelectItem>
                  <SelectItem value="fruits">فواكه</SelectItem>
                  <SelectItem value="grains">حبوب</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <Tabs defaultValue="trends" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="trends" className="text-xs sm:text-sm">اتجاهات الأسعار</TabsTrigger>
            <TabsTrigger value="comparison" className="text-xs sm:text-sm">مقارنة الأسواق</TabsTrigger>
            <TabsTrigger value="distribution" className="text-xs sm:text-sm">توزيع الفئات</TabsTrigger>
            <TabsTrigger value="volatility" className="text-xs sm:text-sm">تقلبات الأسعار</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  اتجاهات الأسعار
                </CardTitle>
                <CardDescription>
                  تحليل اتجاهات الأسعار للمنتجات المختارة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockPriceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        fontSize={12}
                      />
                      <YAxis 
                        tickFormatter={formatPrice}
                        fontSize={12}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatPrice(value), 'السعر']}
                        labelFormatter={formatDate}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">متوسط السعر</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{formatPrice(195)}</div>
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">+22.2% من الأسبوع الماضي</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">أعلى سعر</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{formatPrice(220)}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    7 يناير 2024
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">أدنى سعر</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{formatPrice(180)}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    1 يناير 2024
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  مقارنة الأسواق
                </CardTitle>
                <CardDescription>
                  مقارنة متوسطات الأسعار والنشاط في مختلف الأسواق
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockMarketComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="marketName" fontSize={12} />
                      <YAxis tickFormatter={formatPrice} fontSize={12} />
                      <Tooltip formatter={(value: number) => [formatPrice(value), 'متوسط السعر']} />
                      <Legend />
                      <Bar dataKey="averagePrice" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {mockMarketComparisonData.map((market, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">{market.marketName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">متوسط السعر</span>
                        <span className="font-semibold text-sm">{formatPrice(market.averagePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">إجمالي المدخلات</span>
                        <span className="font-semibold text-sm">{market.totalEntries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">البائعين النشطين</span>
                        <span className="font-semibold text-sm">{market.activeVendors}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  توزيع الفئات
                </CardTitle>
                <CardDescription>
                  توزيع المنتجات حسب الفئات المختلفة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockCategoryDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mockCategoryDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
              {mockCategoryDistributionData.map((category, index) => (
                <Card key={index}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div 
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs sm:text-sm truncate">{category.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {category.value}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="volatility" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  تقلبات الأسعار
                </CardTitle>
                <CardDescription>
                  تحليل تقلبات الأسعار للمنتجات المختلفة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockPriceVolatilityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="productName" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'معدل التقلب']} />
                      <Legend />
                      <Bar dataKey="volatility" fill="#ff7300" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {mockPriceVolatilityData.map((product, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">{product.productName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">معدل التقلب</span>
                        <Badge variant={product.volatility > 10 ? "destructive" : "secondary"} className="text-xs">
                          {product.volatility.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">متوسط السعر</span>
                        <span className="font-semibold text-sm">{formatPrice(product.averagePrice)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(product.volatility * 2, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}