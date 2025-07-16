import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Calendar,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Camera,
  Stethoscope,
  Clock
} from 'lucide-react';
import { GeneratedReport } from '@/services/reportsService';

interface ReportCardProps {
  report: GeneratedReport;
  onClick: (report: GeneratedReport) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onClick }) => {
  const getIcon = () => {
    switch (report.report_type) {
      case 'comprehensive':
        return <FileText className="w-6 h-6" />;
      case 'urgent_triage':
        return <AlertCircle className="w-6 h-6" />;
      case 'symptom_timeline':
        return <TrendingUp className="w-6 h-6" />;
      case 'specialist_focused':
        return <Stethoscope className="w-6 h-6" />;
      case 'photo_progression':
        return <Camera className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getTypeColor = () => {
    switch (report.report_type) {
      case 'comprehensive':
        return 'from-purple-600 to-blue-600';
      case 'urgent_triage':
        return 'from-red-600 to-orange-600';
      case 'symptom_timeline':
        return 'from-blue-600 to-cyan-600';
      case 'specialist_focused':
        return 'from-indigo-600 to-purple-600';
      case 'photo_progression':
        return 'from-cyan-600 to-teal-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const getTypeLabel = () => {
    switch (report.report_type) {
      case 'comprehensive':
        return 'Comprehensive Report';
      case 'urgent_triage':
        return 'Urgent Assessment';
      case 'symptom_timeline':
        return 'Symptom Timeline';
      case 'specialist_focused':
        return 'Specialist Report';
      case 'photo_progression':
        return 'Photo Analysis';
      default:
        return 'Medical Report';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="relative backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl 
        hover:border-white/[0.1] hover:bg-white/[0.05] transition-all duration-300 cursor-pointer 
        overflow-hidden group shadow-lg shadow-black/10 hover:shadow-purple-500/5"
      onClick={() => onClick(report)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${getTypeColor()} text-white 
              shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-all`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-white">{getTypeLabel()}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <p className="text-sm text-gray-400">{formatDate(report.created_at)}</p>
                <span className="text-gray-600">•</span>
                <p className="text-sm text-gray-500">{getRelativeTime(report.created_at)}</p>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white 
            transition-all group-hover:translate-x-1 transform duration-200" />
        </div>

        {/* Title */}
        <h4 className="text-lg font-medium text-white mb-2">{report.title}</h4>

        {/* Summary */}
        <p className="text-sm text-gray-300 line-clamp-2 mb-4">
          {report.executive_summary}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Tags */}
          {report.tags && report.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {report.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-white/[0.05] border border-white/[0.1] 
                    rounded-full text-xs text-gray-400"
                >
                  {tag}
                </span>
              ))}
              {report.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{report.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Confidence Score */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs text-gray-400">
                {report.confidence_score}% confidence
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${getTypeColor()} transform scale-x-0 
          group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
      </div>

      {/* Urgent indicator for triage reports */}
      {report.report_type === 'urgent_triage' && (
        <div className="absolute top-4 right-4">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
            <div className="relative w-2 h-2 bg-red-500 rounded-full" />
          </div>
        </div>
      )}
    </motion.div>
  );
};