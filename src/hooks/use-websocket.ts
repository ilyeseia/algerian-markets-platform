'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface PriceEntry {
  id: string
  price: number
  currency: string
  date: string
  notes?: string
  product: {
    id: string
    name: string
    unit: string
  }
  market: {
    id: string
    name: string
    location: string
  }
  vendor: {
    id: string
    name: string
  }
  user: {
    id: string
    name: string
  }
}

interface MarketSummary {
  marketId: string
  totalEntries: number
  todayEntries: number
  activeVendors: number
  availableProducts: number
  latestPrices: PriceEntry[]
}

interface ProductSummary {
  productId: string
  totalEntries: number
  todayEntries: number
  availableMarkets: number
  averagePrice: number
  minPrice: number
  maxPrice: number
  latestPrices: PriceEntry[]
}

interface UseWebSocketOptions {
  autoConnect?: boolean
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true } = options
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [priceUpdates, setPriceUpdates] = useState<PriceEntry[]>([])
  const [marketSummaries, setMarketSummaries] = useState<Map<string, MarketSummary>>(new Map())
  const [productSummaries, setProductSummaries] = useState<Map<string, ProductSummary>>(new Map())
  const [recentPrices, setRecentPrices] = useState<PriceEntry[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [autoConnect])

  const connect = () => {
    if (socketRef.current?.connected) return

    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling']
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('Connected to WebSocket server')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
      setIsConnected(false)
    })

    socket.on('price-update', (priceEntry: PriceEntry) => {
      setPriceUpdates(prev => [priceEntry, ...prev.slice(0, 49)]) // Keep last 50 updates
    })

    socket.on('recent-prices', (prices: PriceEntry[]) => {
      setRecentPrices(prices)
    })

    socket.on('market-summary', (summary: MarketSummary) => {
      setMarketSummaries(prev => new Map(prev).set(summary.marketId, summary))
    })

    socket.on('product-summary', (summary: ProductSummary) => {
      setProductSummaries(prev => new Map(prev).set(summary.productId, summary))
    })

    socket.on('price-entry-created', (priceEntry: PriceEntry) => {
      setPriceUpdates(prev => [priceEntry, ...prev.slice(0, 49)])
    })

    socket.on('price-entry-error', (error: { error: string }) => {
      console.error('Price entry error:', error.error)
      setAlerts(prev => [...prev, { type: 'error', message: error.error, timestamp: new Date() }])
    })

    socket.on('price-alert-set', (alert: any) => {
      setAlerts(prev => [...prev, { type: 'success', message: alert.message, timestamp: new Date() }])
    })

    socket.on('market-summary-error', (error: { error: string }) => {
      console.error('Market summary error:', error.error)
      setAlerts(prev => [...prev, { type: 'error', message: error.error, timestamp: new Date() }])
    })

    socket.on('product-summary-error', (error: { error: string }) => {
      console.error('Product summary error:', error.error)
      setAlerts(prev => [...prev, { type: 'error', message: error.error, timestamp: new Date() }])
    })

    socket.on('message', (message: { text: string; senderId: string; timestamp: string }) => {
      if (message.senderId === 'system') {
        setAlerts(prev => [...prev, { type: 'info', message: message.text, timestamp: new Date(message.timestamp) }])
      }
    })
  }

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }

  const joinMarket = (marketId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-market', marketId)
    }
  }

  const leaveMarket = (marketId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-market', marketId)
    }
  }

  const joinProduct = (productId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-product', productId)
    }
  }

  const leaveProduct = (productId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-product', productId)
    }
  }

  const subscribeToPrices = (data: { productId?: string; marketId?: string; vendorId?: string }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe-prices', data)
    }
  }

  const unsubscribeFromPrices = (data: { productId?: string; marketId?: string; vendorId?: string }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe-prices', data)
    }
  }

  const createPriceEntry = (data: {
    productId: string
    marketId: string
    vendorId: string
    price: number
    currency: string
    notes?: string
    userId: string
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('new-price-entry', data)
    }
  }

  const requestMarketSummary = (marketId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('request-market-summary', marketId)
    }
  }

  const requestProductSummary = (productId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('request-product-summary', productId)
    }
  }

  const setPriceAlert = (data: {
    productId: string
    marketId: string
    targetPrice: number
    condition: 'above' | 'below'
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('set-price-alert', data)
    }
  }

  const clearAlerts = () => {
    setAlerts([])
  }

  const clearPriceUpdates = () => {
    setPriceUpdates([])
  }

  return {
    isConnected,
    priceUpdates,
    marketSummaries,
    productSummaries,
    recentPrices,
    alerts,
    connect,
    disconnect,
    joinMarket,
    leaveMarket,
    joinProduct,
    leaveProduct,
    subscribeToPrices,
    unsubscribeFromPrices,
    createPriceEntry,
    requestMarketSummary,
    requestProductSummary,
    setPriceAlert,
    clearAlerts,
    clearPriceUpdates
  }
}