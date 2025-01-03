import React, { useState, useEffect } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { TabPanel, TabContext } from '@mui/lab';
import ManualSalesEntry from '../../components/sales/ManualSalesEntry';
import SalesHistory from '../../components/sales/SalesHistory';
import SalesImport from '../../components/sales/SalesImport';
import SalesReportView from '../../components/sales/SalesReportView';
import { SalesService } from '../../services/salesService';
import { ProductDefinition } from '../../types';
import { SaleBatch, SalesReport } from '../../types/sales';
import { ShamsiDate } from '../../utils/shamsiDate';
import { db } from '../../database';

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState('1');
  const [products, setProducts] = useState<ProductDefinition[]>([]);
  const [salesData, setSalesData] = useState<SaleBatch[]>([]);
  const [report, setReport] = useState<SalesReport>({
    byDepartment: {},
    byProductionSegment: {},
    overall: {
      totalUnits: 0,
      totalRevenue: 0,
      totalCost: 0,
      netRevenue: 0
    },
    timeRange: {
      start: '',
      end: ''
    }
  });
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  useEffect(() => {
    loadSalesData();
    loadProducts();
  }, []);

  const loadSalesData = async () => {
    try {
      const data = await SalesService.getSalesHistory();
      setSalesData(data);
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  const loadProducts = () => {
    try {
      console.log('Loading products...');
      const definedProducts = db.getProductDefinitions();
      console.log('Loaded products:', definedProducts);
      setProducts(definedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleSalesEntry = async (entries: any[]) => {
    try {
      await SalesService.importSalesData(entries, products);
      await loadSalesData();
    } catch (error) {
      console.error('Error saving sales data:', error);
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

  const handleBatchSelect = async (batchIds: string[]) => {
    setSelectedBatches(batchIds);
    try {
      const newReport = await SalesService.getSalesReportForBatches(batchIds);
      setReport(newReport);
    } catch (error) {
      console.error('Error loading sales report for batches:', error);
    }
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="ثبت فروش دستی" value="1" />
            <Tab label="تاریخچه فروش" value="2" />
            <Tab label="وارد کردن فروش" value="3" />
            <Tab label="گزارش فروش" value="4" />
          </Tabs>
        </Box>

        <TabPanel value="1">
          <ManualSalesEntry onSave={handleSalesEntry} products={products} />
        </TabPanel>

        <TabPanel value="2">
          <SalesHistory salesData={salesData} />
        </TabPanel>

        <TabPanel value="3">
          <SalesImport
            onImport={handleSalesEntry}
            products={products}
          />
        </TabPanel>

        <TabPanel value="4">
          <SalesReportView
            report={report}
            salesBatches={salesData}
            onDateRangeChange={handleDateRangeChange}
            onBatchSelect={handleBatchSelect}
          />
        </TabPanel>
      </TabContext>
    </Box>
  );
} 