import { Server } from 'socket.io';
import { db } from './db';

interface PriceUpdateData {
  productId: string;
  marketId: string;
  vendorId: string;
  price: number;
  currency: string;
  notes?: string;
  userId: string;
}

interface SubscriptionData {
  productId?: string;
  marketId?: string;
  vendorId?: string;
}

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join market-specific rooms
    socket.on('join-market', (marketId: string) => {
      socket.join(`market-${marketId}`);
      console.log(`Client ${socket.id} joined market ${marketId}`);
    });

    // Leave market-specific rooms
    socket.on('leave-market', (marketId: string) => {
      socket.leave(`market-${marketId}`);
      console.log(`Client ${socket.id} left market ${marketId}`);
    });

    // Join product-specific rooms
    socket.on('join-product', (productId: string) => {
      socket.join(`product-${productId}`);
      console.log(`Client ${socket.id} joined product ${productId}`);
    });

    // Leave product-specific rooms
    socket.on('leave-product', (productId: string) => {
      socket.leave(`product-${productId}`);
      console.log(`Client ${socket.id} left product ${productId}`);
    });

    // Subscribe to price updates
    socket.on('subscribe-prices', async (data: SubscriptionData) => {
      const { productId, marketId, vendorId } = data;
      
      // Join appropriate rooms based on subscription
      if (marketId) {
        socket.join(`market-${marketId}`);
      }
      if (productId) {
        socket.join(`product-${productId}`);
      }
      if (vendorId) {
        socket.join(`vendor-${vendorId}`);
      }

      // Send recent price data for the subscription
      const where: any = {};
      if (productId) where.productId = productId;
      if (marketId) where.marketId = marketId;
      if (vendorId) where.vendorId = vendorId;

      const recentPrices = await db.priceEntry.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, unit: true }
          },
          market: {
            select: { id: true, name: true, location: true }
          },
          vendor: {
            select: { id: true, name: true }
          }
        },
        orderBy: { date: 'desc' },
        take: 10
      });

      socket.emit('recent-prices', recentPrices);
      console.log(`Client ${socket.id} subscribed to price updates`, data);
    });

    // Unsubscribe from price updates
    socket.on('unsubscribe-prices', (data: SubscriptionData) => {
      const { productId, marketId, vendorId } = data;
      
      if (marketId) {
        socket.leave(`market-${marketId}`);
      }
      if (productId) {
        socket.leave(`product-${productId}`);
      }
      if (vendorId) {
        socket.leave(`vendor-${vendorId}`);
      }

      console.log(`Client ${socket.id} unsubscribed from price updates`, data);
    });

    // Handle new price entry
    socket.on('new-price-entry', async (data: PriceUpdateData) => {
      try {
        // Verify the data and create price entry
        const { productId, marketId, vendorId, price, currency, notes, userId } = data;

        // Verify related entities exist
        const [product, market, vendor, user] = await Promise.all([
          db.product.findUnique({ where: { id: productId } }),
          db.market.findUnique({ where: { id: marketId } }),
          db.vendor.findUnique({ where: { id: vendorId } }),
          db.user.findUnique({ where: { id: userId } })
        ]);

        if (!product || !market || !vendor || !user) {
          socket.emit('price-entry-error', { error: 'Invalid data provided' });
          return;
        }

        // Create price entry
        const priceEntry = await db.priceEntry.create({
          data: {
            productId,
            marketId,
            vendorId,
            price,
            currency,
            notes,
            userId,
            date: new Date()
          },
          include: {
            product: {
              select: { id: true, name: true, unit: true }
            },
            market: {
              select: { id: true, name: true, location: true }
            },
            vendor: {
              select: { id: true, name: true }
            },
            user: {
              select: { id: true, name: true }
            }
          }
        });

        // Emit to relevant rooms
        io.to(`market-${marketId}`).emit('price-update', priceEntry);
        io.to(`product-${productId}`).emit('price-update', priceEntry);
        io.to(`vendor-${vendorId}`).emit('price-update', priceEntry);

        // Send confirmation to the client who created the entry
        socket.emit('price-entry-created', priceEntry);

        console.log('New price entry created and broadcasted:', priceEntry.id);
      } catch (error) {
        console.error('Error creating price entry:', error);
        socket.emit('price-entry-error', { error: 'Failed to create price entry' });
      }
    });

    // Request market summary
    socket.on('request-market-summary', async (marketId: string) => {
      try {
        const summary = await getMarketSummary(marketId);
        socket.emit('market-summary', summary);
      } catch (error) {
        console.error('Error generating market summary:', error);
        socket.emit('market-summary-error', { error: 'Failed to generate market summary' });
      }
    });

    // Request product summary
    socket.on('request-product-summary', async (productId: string) => {
      try {
        const summary = await getProductSummary(productId);
        socket.emit('product-summary', summary);
      } catch (error) {
        console.error('Error generating product summary:', error);
        socket.emit('product-summary-error', { error: 'Failed to generate product summary' });
      }
    });

    // Handle price alerts
    socket.on('set-price-alert', (data: {
      productId: string;
      marketId: string;
      targetPrice: number;
      condition: 'above' | 'below';
    }) => {
      const { productId, marketId, targetPrice, condition } = data;
      
      // Join alert room
      socket.join(`alert-${productId}-${marketId}`);
      
      socket.emit('price-alert-set', {
        productId,
        marketId,
        targetPrice,
        condition,
        message: `Price alert set for ${condition} ${targetPrice}`
      });
      
      console.log(`Price alert set by client ${socket.id}`, data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'مرحباً بك في منصة الأسواق الجزائرية - متصل بالخدمة الفورية!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};

// Helper function to get market summary
async function getMarketSummary(marketId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [totalEntries, todayEntries, vendors, products] = await Promise.all([
    db.priceEntry.count({ where: { marketId } }),
    db.priceEntry.count({ 
      where: { 
        marketId,
        date: { gte: today }
      }
    }),
    db.vendor.findMany({
      where: { marketId, isActive: true },
      select: { id: true, name: true }
    }),
    db.product.findMany({
      where: {
        priceEntries: {
          some: { marketId }
        }
      },
      select: { id: true, name: true }
    })
  ]);

  const latestPrices = await db.priceEntry.findMany({
    where: { marketId },
    include: {
      product: {
        select: { id: true, name: true, unit: true }
      }
    },
    orderBy: { date: 'desc' },
    take: 5
  });

  return {
    marketId,
    totalEntries,
    todayEntries,
    activeVendors: vendors.length,
    availableProducts: products.length,
    latestPrices
  };
}

// Helper function to get product summary
async function getProductSummary(productId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [totalEntries, todayEntries, markets] = await Promise.all([
    db.priceEntry.count({ where: { productId } }),
    db.priceEntry.count({ 
      where: { 
        productId,
        date: { gte: today }
      }
    }),
    db.market.findMany({
      where: {
        priceEntries: {
          some: { productId }
        }
      },
      select: { id: true, name: true, location: true }
    })
  ]);

  const latestPrices = await db.priceEntry.findMany({
    where: { productId },
    include: {
      market: {
        select: { id: true, name: true, location: true }
      }
    },
    orderBy: { date: 'desc' },
    take: 5
  });

  const priceStats = await db.priceEntry.aggregate({
    where: { productId },
    _avg: { price: true },
    _min: { price: true },
    _max: { price: true }
  });

  return {
    productId,
    totalEntries,
    todayEntries,
    availableMarkets: markets.length,
    averagePrice: priceStats._avg.price,
    minPrice: priceStats._min.price,
    maxPrice: priceStats._max.price,
    latestPrices
  };
}