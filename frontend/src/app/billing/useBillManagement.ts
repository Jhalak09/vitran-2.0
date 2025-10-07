import { useState, useEffect } from 'react';
import { startOfYear, eachMonthOfInterval, format, startOfMonth, endOfMonth } from 'date-fns';
import { BillApiService, Customer, Bill, BillPreview } from './billApi';

export const useBillManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [includeDeliveryCharges, setIncludeDeliveryCharges] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [billPreview, setBillPreview] = useState<BillPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState<number | null>(null);

  // Generate month options
  const generateMonthOptions = () => {
    const currentDate = new Date();
    const startOfCurrentYear = startOfYear(currentDate);
    
    const months = eachMonthOfInterval({
      start: startOfCurrentYear,
      end: currentDate
    });
    
    const options = months.map(date => ({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    }));
    
    return options.reverse();
  };

  const monthOptions = generateMonthOptions();

  // Get date range from month
  const getDateRangeFromMonth = (monthValue: string) => {
    const [year, month] = monthValue.split('-').map(Number);
    const monthDate = new Date(year, month - 1, 1);
    
    return { 
      start: format(startOfMonth(monthDate), 'yyyy-MM-dd'), 
      end: format(endOfMonth(monthDate), 'yyyy-MM-dd')
    };
  };

  // Load initial data
  useEffect(() => {
    const loadCustomers = async () => {
      const customerData = await BillApiService.fetchCustomers();
      setCustomers(customerData);
    };
    loadCustomers();
  }, []);

  // Load bills when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerBills();
    } else {
      setBills([]);
    }
  }, [selectedCustomer]);

  const loadCustomerBills = async () => {
    if (!selectedCustomer) return;
    
    const billData = await BillApiService.fetchCustomerBills(selectedCustomer);
    setBills(billData);
  };

  const handlePreviewBill = async () => {
    if (!selectedCustomer) {
      return;
    }

    const dateRange = useCustomRange 
      ? customDateRange 
      : selectedMonth 
        ? getDateRangeFromMonth(selectedMonth)
        : null;

    if (!dateRange || !dateRange.start || !dateRange.end) {
      return;
    }

    setLoading(true);
    const preview = await BillApiService.previewBill({
      customerId: selectedCustomer,
      startDate: dateRange.start,
      endDate: dateRange.end,
      includeDeliveryCharges
    });
    setBillPreview(preview);
    setLoading(false);
  };

  const handleGenerateBill = async () => {
    if (!selectedCustomer || !billPreview) {
      return;
    }

    const dateRange = useCustomRange 
      ? customDateRange 
      : getDateRangeFromMonth(selectedMonth);

    setLoading(true);
    const success = await BillApiService.generateBill({
      customerId: selectedCustomer,
      startDate: dateRange.start,
      endDate: dateRange.end,
      includeDeliveryCharges,
      createdBy: 'admin'
    });

    if (success) {
      setBillPreview(null);
      setSelectedMonth('');
      setCustomDateRange({ start: '', end: '' });
      await loadCustomerBills();
    }
    setLoading(false);
  };

  const handleSendWhatsApp = async (billId: number, customerName: string) => {
    setSendingWhatsApp(billId);
    const success = await BillApiService.sendBillViaWhatsApp(billId, customerName);
    setSendingWhatsApp(null);
    return success;
  };

  const handleMarkPaid = async (billId: number) => {
    const success = await BillApiService.markBillPaid(billId);
    if (success) {
      await loadCustomerBills();
    }
  };

  const handleDeleteFile = async (billId: number) => {
    const success = await BillApiService.deleteBillFile(billId);
    if (success) {
      await loadCustomerBills();
    }
  };

  return {
    // State
    customers,
    selectedCustomer,
    selectedMonth,
    customDateRange,
    includeDeliveryCharges,
    bills,
    billPreview,
    loading,
    useCustomRange,
    sendingWhatsApp,
    monthOptions,
    
    // Actions
    setSelectedCustomer,
    setSelectedMonth,
    setCustomDateRange,
    setIncludeDeliveryCharges,
    setUseCustomRange,
    handlePreviewBill,
    handleGenerateBill,
    handleSendWhatsApp,
    handleMarkPaid,
    handleDeleteFile,
    downloadBill: BillApiService.downloadBill,
    previewBillPDF: BillApiService.previewBillPDF,
  };
};
