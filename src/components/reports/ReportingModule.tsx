import React, { useState, useEffect } from 'react';
import SalesReportView from './SalesReportView';
import { SalesService } from '../../services/salesService';
import { SalesReport, SaleBatch } from '../../types/sales';
import { ShamsiDate } from '../../utils/shamsiDate';

export default function ReportingModule() {
  const [report, setReport] = useState<SalesReport>({
    byDepartment: {},
    byProductionSegment: {},
    overall: { totalUnits: 0, totalRevenue: 0, totalCost: 0, netRevenue: 0 },
    timeRange: { start: ShamsiDate.getCurrentShamsiDate(), end: ShamsiDate.getCurrentShamsiDate() },
  });
  const [salesData, setSalesData] = useState<SaleBatch[]>([]);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      const data = await SalesService.getSalesHistory();
      setSalesData(data);
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  const handleDateRangeChange = async (startDate: string, endDate: string) => {
    try {
      const newReport = await SalesService.getSalesReport(startDate, endDate);
      setReport(newReport);
    } catch (error) {
      console.error('Error loading sales report:', error);
    }
  };

  const handleBatchSelect = async (selectedBatches: string[]) => {
    try {
      const newReport = await SalesService.getSalesReportForBatches(selectedBatches);
      setReport(newReport);
    } catch (error) {
      console.error('Error loading sales report for batches:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SalesReportView 
        report={report}
        salesBatches={salesData}
        onDateRangeChange={handleDateRangeChange}
        onBatchSelect={handleBatchSelect}
      />
    </div>
  );
} 