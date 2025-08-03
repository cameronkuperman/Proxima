'use client';

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Plus, X, Image, Camera, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface PhotoUploadZoneProps {
  onUpload: (files: File[]) => void;
  uploadedPhotos: File[];
  onRemovePhoto: (index: number) => void;
  maxPhotos?: number;
  isAnalyzing?: boolean;
}

export default function PhotoUploadZone({
  onUpload,
  uploadedPhotos,
  onRemovePhoto,
  maxPhotos = 5,
  isAnalyzing = false
}: PhotoUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const remainingSlots = maxPhotos - uploadedPhotos.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);
    
    if (filesToAdd.length < acceptedFiles.length) {
      alert(`Maximum ${maxPhotos} photos allowed. Only first ${filesToAdd.length} photos were added.`);
    }
    
    onUpload(filesToAdd);
  }, [maxPhotos, uploadedPhotos.length, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.heic', '.heif']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isAnalyzing || uploadedPhotos.length >= maxPhotos,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false)
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
        {uploadedPhotos.length === 0 ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-gray-600 hover:border-orange-500 hover:bg-white/[0.02]'
            } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center"
            >
              <Upload className="w-10 h-10 text-orange-500" />
            </motion.div>
            <p className="text-lg font-medium text-gray-300 mb-2">
              {isDragActive ? 'Drop photos here' : 'Drop photos or click to upload'}
            </p>
            <p className="text-sm text-gray-500">
              JPEG, PNG, or HEIC • Max 10MB per photo
            </p>
          </div>
        ) : (
          <div>
            {/* Photo Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
              <AnimatePresence>
                {uploadedPhotos.map((photo, index) => (
                  <motion.div
                    key={`${photo.name}-${index}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="relative group aspect-square"
                  >
                    <div className="w-full h-full rounded-lg bg-gray-800 overflow-hidden">
                      {photo.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Remove button */}
                    <button
                      onClick={() => onRemovePhoto(index)}
                      disabled={isAnalyzing}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    
                    {/* File info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-xs text-white truncate">{photo.name}</p>
                      <p className="text-xs text-gray-300">{formatFileSize(photo.size)}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Add more button */}
              {uploadedPhotos.length < maxPhotos && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <div
                    {...getRootProps()}
                    className={`aspect-square rounded-lg border-2 border-dashed border-gray-600 hover:border-orange-500 transition-all flex items-center justify-center cursor-pointer group ${
                      isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Plus className="w-8 h-8 text-gray-600 group-hover:text-orange-500" />
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Photo count */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {uploadedPhotos.length} / {maxPhotos} photos uploaded
              </span>
              {uploadedPhotos.length === maxPhotos && (
                <span className="text-orange-400">Maximum photos reached</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-[20px] bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
      >
        <div className="flex items-start gap-3">
          <Camera className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h5 className="text-sm font-medium text-blue-400 mb-2">Photo Tips for Best Results</h5>
            <ul className="space-y-1 text-xs text-gray-400">
              <li>• Use good, even lighting without flash</li>
              <li>• Include a ruler or coin for size reference</li>
              <li>• Take photos from the same angle for tracking</li>
              <li>• Ensure the affected area is in focus</li>
              <li>• For progress tracking, use similar lighting conditions</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Privacy Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="backdrop-blur-[20px] bg-gray-500/10 border border-gray-500/30 rounded-lg p-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="text-xs text-gray-400">
            <p className="mb-1">Your photos are encrypted and stored securely. Only you and your authorized healthcare providers can access them.</p>
            <p>Sensitive area photos can be analyzed without storage if preferred. <button className="text-blue-400 hover:text-blue-300 underline" onClick={() => window.dispatchEvent(new CustomEvent('showPrivacyInfo'))}>Learn more</button></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}