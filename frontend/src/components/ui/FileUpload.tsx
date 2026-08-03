import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes, ChangeEvent } from 'react';
import { cn } from '../../utils/cn';
import { UploadCloud, X } from 'lucide-react';

export interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string;
  onChange?: (file: File | null) => void;
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ className, label, error, onChange, ...props }, ref) => {
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setFileName(file ? file.name : null);
      if (onChange) onChange(file);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault();
      setFileName(null);
      if (onChange) onChange(null);
    };

    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium mb-1.5 text-foreground">{label}</label>}
        <div
          className={cn(
            "relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            error ? "border-destructive bg-destructive/5" : "border-muted-foreground/25 hover:bg-muted/50 bg-background",
            className
          )}
        >
          {fileName ? (
            <div className="flex flex-col items-center justify-center p-2 text-center h-full w-full">
              {props.accept?.includes('image') ? (
                 <div className="relative w-full h-full p-2 flex flex-col items-center justify-center">
                   <div className="w-16 h-16 rounded-full overflow-hidden mb-2 bg-black/10 flex-shrink-0 relative">
                     {/* The preview image URL needs to be generated in the parent or here, but we don't have the File object available natively here to createObjectURL unless we store it in state. */}
                     <span className="text-xs text-muted-foreground flex items-center justify-center w-full h-full bg-secondary">Img</span>
                   </div>
                   <span className="text-xs font-medium text-foreground truncate max-w-[150px]">{fileName}</span>
                 </div>
              ) : (
                <span className="text-sm font-medium text-foreground truncate max-w-[200px] mb-2">{fileName}</span>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-destructive hover:underline flex items-center absolute bottom-2"
              >
                <X className="h-3 w-3 mr-1" /> Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
              <p className="mb-1 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG or PDF</p>
            </div>
          )}
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            ref={ref}
            onChange={handleFileChange}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
      </div>
    );
  }
);
FileUpload.displayName = "FileUpload";
