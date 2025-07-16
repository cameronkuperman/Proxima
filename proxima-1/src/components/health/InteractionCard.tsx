import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  FileText, 
  Camera, 
  Calendar, 
  Clock, 
  ChevronRight,
  AlertCircle,
  Activity,
  TrendingUp
} from 'lucide-react';
import { HealthInteraction, QuickScanSession, DeepDiveSession, PhotoSession } from '@/services/healthInteractionsService';

interface InteractionCardProps {
  interaction: HealthInteraction;
  onClick: (interaction: HealthInteraction) => void;
}

export const InteractionCard: React.FC<InteractionCardProps> = ({ interaction, onClick }) => {
  const getIcon = () => {
    switch (interaction.type) {
      case 'quick_scan':
        return <Brain className="w-6 h-6" />;
      case 'deep_dive':
        return <FileText className="w-6 h-6" />;
      case 'photo_session':
        return <Camera className="w-6 h-6" />;
      case 'symptom_tracking':
        return <TrendingUp className="w-6 h-6" />;
      default:
        return <Activity className="w-6 h-6" />;
    }
  };

  const getTypeColor = () => {
    switch (interaction.type) {
      case 'quick_scan':
        return 'from-purple-600 to-pink-600';
      case 'deep_dive':
        return 'from-blue-600 to-cyan-600';
      case 'photo_session':
        return 'from-cyan-600 to-teal-600';
      case 'symptom_tracking':
        return 'from-teal-600 to-green-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const getTypeLabel = () => {
    switch (interaction.type) {
      case 'quick_scan':
        return 'Quick Scan';
      case 'deep_dive':
        return 'Deep Dive Analysis';
      case 'photo_session':
        return 'Photo Session';
      case 'symptom_tracking':
        return 'Symptom Tracking';
      default:
        return 'Health Session';
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

  const renderQuickScanContent = (data: QuickScanSession) => (
    <>
      <div className="flex items-center gap-2 mb-3">
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getTypeColor()} text-white text-xs font-medium`}>
          {data.body_part.replace(/_/g, ' ')}
        </div>
        {data.analysis?.confidence && (
          <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
            {Math.round(data.analysis.confidence * 100)}% confidence
          </div>
        )}
      </div>
      <p className="text-white font-medium mb-2 line-clamp-2">{data.symptoms}</p>
      {data.analysis?.primary_condition && (
        <p className="text-sm text-gray-300 mb-3">
          <span className="font-medium text-purple-400">Likely condition:</span> {data.analysis.primary_condition}
        </p>
      )}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Pain level: {data.pain_level}/10
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {data.duration}
        </span>
      </div>
    </>
  );

  const renderDeepDiveContent = (data: DeepDiveSession) => (
    <>
      <div className="flex items-center gap-2 mb-3">
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getTypeColor()} text-white text-xs font-medium`}>
          {data.body_part.replace(/_/g, ' ')}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          data.status === 'completed' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {data.status === 'completed' ? 'Completed' : 'In Progress'}
        </div>
      </div>
      <p className="text-white font-medium mb-2 line-clamp-2">{data.initial_symptoms}</p>
      {data.final_analysis?.diagnosis && (
        <p className="text-sm text-gray-300 mb-3">
          <span className="font-medium text-blue-400">Diagnosis:</span> {data.final_analysis.diagnosis}
        </p>
      )}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Brain className="w-3 h-3" />
          {data.questions_asked} questions asked
        </span>
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          AI Model: {data.model}
        </span>
      </div>
    </>
  );

  const renderPhotoSessionContent = (data: PhotoSession) => (
    <>
      <div className="flex items-center gap-2 mb-3">
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getTypeColor()} text-white text-xs font-medium`}>
          {data.photos_count} photos
        </div>
      </div>
      <p className="text-white font-medium mb-2">{data.condition_name}</p>
      {data.analysis_summary && (
        <p className="text-sm text-gray-300 mb-3 line-clamp-2">{data.analysis_summary}</p>
      )}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Started {formatDate(data.created_at)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Updated {formatDate(data.last_updated)}
        </span>
      </div>
    </>
  );

  const renderContent = () => {
    switch (interaction.type) {
      case 'quick_scan':
        return renderQuickScanContent(interaction.data as QuickScanSession);
      case 'deep_dive':
        return renderDeepDiveContent(interaction.data as DeepDiveSession);
      case 'photo_session':
        return renderPhotoSessionContent(interaction.data as PhotoSession);
      default:
        return null;
    }
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
      onClick={() => onClick(interaction)}
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
              <p className="text-sm text-gray-400">{formatDate(interaction.timestamp)}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white 
            transition-all group-hover:translate-x-1 transform duration-200" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          {renderContent()}
        </div>
      </div>

      {/* Gradient accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${getTypeColor()} transform scale-x-0 
          group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
      </div>
    </motion.div>
  );
};