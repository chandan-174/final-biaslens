import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

const FileUploadZone = ({ onFileSelect, isLoading }: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ allowed extensions
  const allowedExtensions = ["csv", "xlsx", "xls", "pdf", "docx"];

  const isValidFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    return ext && allowedExtensions.includes(ext);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (isLoading) return;

      setIsDragging(false);

      const file = e.dataTransfer.files[0];

      if (file && isValidFile(file)) {
        onFileSelect(file);
      } else {
        alert("Unsupported file type");
      }
    },
    [onFileSelect, isLoading]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;

    const file = e.target.files?.[0];

    if (file && isValidFile(file)) {
      onFileSelect(file);
    } else {
      alert("Unsupported file type");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-8">
      <motion.div
        className="text-center max-w-lg w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer ${
            isDragging
              ? "border-analytics bg-analytics/5 glow-analytics"
              : "border-border hover:border-muted-foreground"
          }`}
          onClick={() => (!isLoading ? inputRef.current?.click() : null)}
        >
          <div className="w-16 h-16 rounded-2xl card-premium border border-border flex items-center justify-center mx-auto mb-6">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-analytics border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet size={28} className="text-muted-foreground" />
            )}
          </div>

          <h2 className="font-display font-bold text-xl mb-2">
            {isLoading ? "Parsing your data…" : "Upload your Data File"}
          </h2>

          <p className="text-xs text-muted-foreground mb-6 leading-relaxed max-w-sm mx-auto">
            Supports CSV, Excel, PDF, and Word files
          </p>

          {!isLoading && (
            <Button className="font-display text-xs">
              <Upload size={14} className="mr-2" /> Choose File
            </Button>
          )}
        </div>

        {/* ✅ IMPORTANT FIX */}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.pdf,.docx"
          className="hidden"
          onChange={handleChange}
        />
      </motion.div>
    </div>
  );
};

export default FileUploadZone;