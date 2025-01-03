import { SaleBatch, SaleEntry, SalesReport } from '../types/sales';
import { ProductDefinition } from '../types';
import { db } from '../database';

export class SalesService {
  static async saveSalesBatch(batch: SaleBatch): Promise<void> {
    const history = db.getSalesHistory();
    history.push(batch);
    db.saveSalesHistory(history);
  }

  static async getSalesHistory(): Promise<SaleBatch[]> {
    return db.getSalesHistory();
  }

  static async getSalesReport(
    startDate: string,
    endDate: string
  ): Promise<SalesReport> {
    // TODO: Implement database fetch and aggregation logic
    const sales = await this.getSalesHistory();
    
    const filteredSales = sales.filter(
      (batch) =>
        batch.startDate >= startDate && batch.endDate <= endDate
    );

    const report: SalesReport = {
      byDepartment: {},
      byProductionSegment: {},
      overall: {
        totalUnits: 0,
        totalRevenue: 0,
        totalCost: 0,
        netRevenue: 0,
      },
      timeRange: {
        start: startDate,
        end: endDate,
      },
    };

    filteredSales.forEach((batch) => {
      batch.entries.forEach((entry) => {
        if (!entry.product) return;

        // Aggregate by department
        const dept = entry.product.saleDepartment;
        if (!report.byDepartment[dept]) {
          report.byDepartment[dept] = {
            totalUnits: 0,
            totalRevenue: 0,
            totalCost: 0,
            netRevenue: 0,
            products: []
          };
        }
        report.byDepartment[dept].totalUnits += entry.quantity;
        report.byDepartment[dept].totalRevenue += entry.totalPrice;
        // TODO: Calculate cost based on product recipe

        // Aggregate by production segment
        const segment = entry.product.productionSegment;
        if (!report.byProductionSegment[segment]) {
          report.byProductionSegment[segment] = {
            totalUnits: 0,
            totalRevenue: 0,
            totalCost: 0,
            netRevenue: 0,
            products: []
          };
        }
        report.byProductionSegment[segment].totalUnits += entry.quantity;
        report.byProductionSegment[segment].totalRevenue += entry.totalPrice;
        // TODO: Calculate cost based on product recipe

        // Update overall totals
        report.overall.totalUnits += entry.quantity;
        report.overall.totalRevenue += entry.totalPrice;
      });
    });

    // Calculate net revenue
    Object.values(report.byDepartment).forEach((dept) => {
      dept.netRevenue = dept.totalRevenue - dept.totalCost;
    });

    Object.values(report.byProductionSegment).forEach((segment) => {
      segment.netRevenue = segment.totalRevenue - segment.totalCost;
    });

    report.overall.netRevenue =
      report.overall.totalRevenue - report.overall.totalCost;

    return report;
  }

  static async importSalesData(
    mappedData: any[],
    products: ProductDefinition[]
  ): Promise<void> {
    const batch: SaleBatch = {
      id: Date.now().toString(),
      entries: mappedData.map((data) => ({
        id: `${Date.now()}-${Math.random()}`,
        productId: data.product.id,
        product: data.product,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice: data.quantity * data.unitPrice,
        saleDate: data.date,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })),
      startDate: mappedData[0].date,
      endDate: mappedData[mappedData.length - 1].date,
      totalRevenue: mappedData.reduce(
        (sum, data) => sum + data.quantity * data.unitPrice,
        0
      ),
      totalCost: 0, // TODO: Calculate based on product recipes
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.saveSalesBatch(batch);
  }

  static async getSalesReportForBatches(batchIds: string[]): Promise<SalesReport> {
    const sales = await this.getSalesHistory();
    const selectedBatches = sales.filter(batch => batchIds.includes(batch.id));

    const report: SalesReport = {
      byDepartment: {},
      byProductionSegment: {},
      overall: {
        totalUnits: 0,
        totalRevenue: 0,
        totalCost: 0,
        netRevenue: 0,
      },
      timeRange: {
        start: selectedBatches[0]?.startDate || '',
        end: selectedBatches[selectedBatches.length - 1]?.endDate || '',
      },
    };

    selectedBatches.forEach((batch) => {
      batch.entries.forEach((entry) => {
        if (!entry.product) return;

        // Get active recipe for the product
        const activeRecipe = db.getActiveRecipe(entry.product.id);
        const materialCost = activeRecipe ? activeRecipe.materials.reduce((total, material) => total + material.totalPrice, 0) : 0;
        const totalCost = materialCost * entry.quantity;

        // Aggregate by department
        const dept = entry.product.saleDepartment;
        if (!report.byDepartment[dept]) {
          report.byDepartment[dept] = {
            totalUnits: 0,
            totalRevenue: 0,
            totalCost: 0,
            netRevenue: 0,
            products: []
          };
        }
        report.byDepartment[dept].totalUnits += entry.quantity;
        report.byDepartment[dept].totalRevenue += entry.totalPrice;
        report.byDepartment[dept].totalCost += totalCost;

        // Aggregate by production segment
        const segment = entry.product.productionSegment;
        if (!report.byProductionSegment[segment]) {
          report.byProductionSegment[segment] = {
            totalUnits: 0,
            totalRevenue: 0,
            totalCost: 0,
            netRevenue: 0,
            products: []
          };
        }
        report.byProductionSegment[segment].totalUnits += entry.quantity;
        report.byProductionSegment[segment].totalRevenue += entry.totalPrice;
        report.byProductionSegment[segment].totalCost += totalCost;

        // Update overall totals
        report.overall.totalUnits += entry.quantity;
        report.overall.totalRevenue += entry.totalPrice;
        report.overall.totalCost += totalCost;
      });
    });

    // Calculate net revenue
    Object.values(report.byDepartment).forEach((dept) => {
      dept.netRevenue = dept.totalRevenue - dept.totalCost;
    });

    Object.values(report.byProductionSegment).forEach((segment) => {
      segment.netRevenue = segment.totalRevenue - segment.totalCost;
    });

    report.overall.netRevenue = report.overall.totalRevenue - report.overall.totalCost;

    return report;
  }
} 