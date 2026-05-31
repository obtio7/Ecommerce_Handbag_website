import { Router, Request, Response } from 'express';
import Order from '../../models/Order.js';
import adminAuth from '../../middleware/adminAuth.js';

const router = Router();

// Apply adminAuth middleware to all routes
router.use(adminAuth);

/**
 * GET /api/admin/reports
 * Generate sales report for a date range
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);
    
    // Fetch orders in date range
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $nin: ['cancelled', 'refunded'] },
    }).lean();
    
    // Calculate summary
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Unique customers
    const uniqueEmails = new Set(orders.map(o => o.customer?.email).filter(Boolean));
    const totalCustomers = uniqueEmails.size;
    
    // Orders by status with revenue
    const statusData: Record<string, { count: number; revenue: number }> = {};
    orders.forEach(o => {
      if (!statusData[o.status]) {
        statusData[o.status] = { count: 0, revenue: 0 };
      }
      statusData[o.status].count += 1;
      statusData[o.status].revenue += o.totalAmount;
    });
    const ordersByStatus = Object.entries(statusData).map(([status, data]) => ({
      status,
      count: data.count,
      revenue: data.revenue,
    }));
    
    // Top products
    const productRevenue: Record<string, { productId: string; productName: string; unitsSold: number; revenue: number }> = {};
    orders.forEach(o => {
      o.items.forEach((item: any) => {
        const key = item.productId?.toString() || item.name;
        if (!productRevenue[key]) {
          productRevenue[key] = { 
            productId: key, 
            productName: item.name, 
            unitsSold: 0, 
            revenue: 0 
          };
        }
        productRevenue[key].unitsSold += item.quantity;
        productRevenue[key].revenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);
    
    // Daily breakdown
    const dailyData: Record<string, { orders: number; revenue: number }> = {};
    orders.forEach(o => {
      const dateKey = new Date(o.createdAt).toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { orders: 0, revenue: 0 };
      }
      dailyData[dateKey].orders += 1;
      dailyData[dateKey].revenue += o.totalAmount;
    });
    
    // Fill in missing dates and sort
    const dailyBreakdown: { date: string; orders: number; revenue: number }[] = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyBreakdown.push({
        date: dateKey,
        orders: dailyData[dateKey]?.orders || 0,
        revenue: dailyData[dateKey]?.revenue || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json({
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        totalCustomers,
      },
      ordersByStatus,
      topProducts,
      dailyData: dailyBreakdown,
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/admin/reports/download
 * Download report as PDF or CSV
 */
router.get('/download', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, format } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);
    
    // Fetch orders
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $nin: ['cancelled', 'refunded'] },
    }).lean();
    
    if (format === 'csv') {
      // Generate CSV
      const headers = ['Date', 'Order ID', 'Customer', 'Email', 'Items', 'Total', 'Status'];
      const rows = orders.map(o => [
        new Date(o.createdAt).toISOString().split('T')[0],
        o.orderNumber || o._id.toString().slice(-8).toUpperCase(),
        o.customer?.name || 'N/A',
        o.customer?.email || 'N/A',
        o.items.map((i: any) => `${i.name} x${i.quantity}`).join('; '),
        o.totalAmount.toFixed(2),
        o.status,
      ]);
      
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="zarevielle-report-${startDate}-to-${endDate}.csv"`);
      return res.send(csv);
    }
    
    if (format === 'pdf') {
      // Generate simple HTML for PDF printing
      const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Zarevielle Sales Report</title>
  <style>
    body { font-family: 'Georgia', serif; padding: 40px; color: #333; }
    h1 { color: #8B7355; border-bottom: 2px solid #8B7355; padding-bottom: 10px; }
    h2 { color: #666; margin-top: 30px; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .stat { background: #f9f7f4; padding: 15px 20px; border-radius: 8px; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .stat-value { font-size: 24px; color: #8B7355; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f9f7f4; font-weight: 600; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <h1>ZAREVIELLE Sales Report</h1>
  <p>Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}</p>
  
  <div class="summary">
    <div class="stat">
      <div class="stat-label">Total Orders</div>
      <div class="stat-value">${orders.length}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Total Revenue</div>
      <div class="stat-value">₹${totalRevenue.toLocaleString('en-IN')}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Avg Order Value</div>
      <div class="stat-value">₹${avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
    </div>
  </div>
  
  <h2>Order Details</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Order ID</th>
        <th>Customer</th>
        <th>Total</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${orders.slice(0, 100).map(o => `
        <tr>
          <td>${new Date(o.createdAt).toLocaleDateString()}</td>
          <td>${o.orderNumber || o._id.toString().slice(-8).toUpperCase()}</td>
          <td>${o.customer?.name || 'N/A'}</td>
          <td>₹${o.totalAmount.toLocaleString('en-IN')}</td>
          <td>${o.status}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ${orders.length > 100 ? `<p style="color: #999; font-style: italic;">Showing first 100 of ${orders.length} orders</p>` : ''}
  
  <div class="footer">
    Generated on ${new Date().toLocaleString()} | ZAREVIELLE
  </div>
</body>
</html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="zarevielle-report-${startDate}-to-${endDate}.html"`);
      return res.send(html);
    }
    
    res.status(400).json({ error: 'Invalid format. Use csv or pdf.' });
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ error: 'Failed to download report' });
  }
});

export default router;
