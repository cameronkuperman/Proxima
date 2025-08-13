'use client';

import { motion } from 'framer-motion';
import { Download, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface BillingHistoryCardProps {
  invoices: any[];
}

export default function BillingHistoryCard({ invoices }: BillingHistoryCardProps) {
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'open':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'void':
      case 'uncollectible':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'open':
        return 'Pending';
      case 'void':
        return 'Void';
      case 'uncollectible':
        return 'Failed';
      default:
        return status;
    }
  };
  
  if (!invoices || invoices.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">Billing History</h3>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No invoices yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Your invoices will appear here after your first payment
          </p>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
    >
      <h3 className="text-xl font-bold text-white mb-4">Billing History</h3>
      
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <motion.div
            key={invoice.id}
            whileHover={{ x: 2 }}
            className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/[0.05] hover:border-white/[0.1] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-white font-medium">
                  ${invoice.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  {format(new Date(invoice.created), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {getStatusIcon(invoice.status)}
                <span className="text-sm text-gray-300">
                  {getStatusText(invoice.status)}
                </span>
              </div>
              
              {invoice.invoice_pdf && (
                <a
                  href={invoice.invoice_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/[0.05] hover:bg-white/[0.08] rounded-lg transition-all group"
                  title="Download Invoice"
                >
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/[0.05]">
        <p className="text-xs text-gray-500">
          Showing last {invoices.length} invoices • All amounts in USD
        </p>
      </div>
    </motion.div>
  );
}