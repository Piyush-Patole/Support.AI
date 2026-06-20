import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  label?: string;
  subtitle?: string;
  multiple?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  accept = {
    'text/csv': ['.csv'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls'],
  },
  label = 'Drop files here or click to browse',
  subtitle = 'Supports .xlsx, .csv files',
  multiple = true,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={`drop-zone ${isDragActive ? 'active' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="drop-zone-icon">
        {isDragActive ? (
          <FileSpreadsheet size={28} />
        ) : (
          <Upload size={28} />
        )}
      </div>
      <div className="drop-zone-title">
        {isDragActive ? 'Drop files to upload' : label}
      </div>
      <div className="drop-zone-subtitle">{subtitle}</div>
    </div>
  );
};
