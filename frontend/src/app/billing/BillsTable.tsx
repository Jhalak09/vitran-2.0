import React from 'react';
import { format } from 'date-fns';
import { Bill } from './billApi';

interface BillsTableProps {
  bills: Bill[];
  sendingWhatsApp: number | null;
  onDownload: (billId: number) => void;
  onPreview: (billId: number) => void;
  onSendWhatsApp: (billId: number, customerName: string) => void;
  onMarkPaid: (billId: number) => void;
  onDeleteFile: (billId: number) => void;
}

export const BillsTable: React.FC<BillsTableProps> = ({
  bills,
  sendingWhatsApp,
  onDownload,
  onSendWhatsApp,
  onMarkPaid,
}) => {
  // If no bills, show message (no table, no buttons)
  if (bills.length === 0) {
    return <p className="text-gray-500">No bills found for this customer.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill Number</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {bills.map(bill => {
            const customerName = bill.customer 
              ? `${bill.customer.firstName} ${bill.customer.lastName || ''}`.trim()
              : 'Customer';

            return (
              <tr key={bill.billId}>
                <td className="px-6 py-4 text-sm text-gray-900">{bill.billNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {format(new Date(bill.startDate), 'MMM dd, yyyy')} - {format(new Date(bill.endDate), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">₹{Number(bill.totalAmount).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    bill.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {bill.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    bill.fileExists ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {bill.fileExists ? 'Stored' : 'Generate'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  {/* Download Button - Always show when bill exists */}
                  <button
                    onClick={() => onDownload(bill.billId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Download
                  </button>
                  
                  {/* WhatsApp Button - Always show when bill exists */}
                  <button
                    onClick={() => onSendWhatsApp(bill.billId, customerName)}
                    disabled={sendingWhatsApp === bill.billId}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                  >
                    {sendingWhatsApp === bill.billId ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        📱 WhatsApp
                      </>
                    )}
                  </button>
                  
                  {/* Mark Paid Button - Only if bill is unpaid */}
                  {!bill.isPaid && (
                    <button
                      onClick={() => onMarkPaid(bill.billId)}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs"
                    >
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
