import React, { useRef } from 'react';
import { Card } from './Card';

/**
 * PhotoUpload component - dropzone-style image upload
 */
export const PhotoUpload = ({ 
  image, 
  imageDisplay, 
  onImageSelect, 
  onImageRemove,
  accept = 'image/png, image/gif, image/jpeg',
  className = ''
}) => {
  const inputRef = useRef(null);
  
  const handleClick = () => {
    inputRef.current?.click();
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
    // Reset input value so the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  return (
    <Card className={className}>
      {/* Hidden file input - always rendered so "Change photo" button works */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload photo"
      />
      
      {imageDisplay ? (
        <div className="space-y-4">
          <div className="relative group">
            <img 
              src={imageDisplay} 
              alt="Preview" 
              className="w-full h-64 object-cover rounded-lg border border-[var(--color-border)]"
            />
            {onImageRemove && (
              <button
                type="button"
                onClick={onImageRemove}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                aria-label="Remove image"
              >
                <svg className="w-5 h-5 text-[var(--color-danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="w-full py-2.5 px-4 text-sm font-medium text-[var(--color-primary)] border border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-light)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            Change photo
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-12 text-center cursor-pointer transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] focus-within:border-[var(--color-primary)] focus-within:bg-[var(--color-primary-light)]"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <svg 
            className="mx-auto h-12 w-12 text-[var(--color-muted)] mb-4" 
            stroke="currentColor" 
            fill="none" 
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-base font-medium text-[var(--color-text)] mb-1">
            Upload photos
          </p>
          <p className="text-sm text-[var(--color-muted)]">
            PNG, GIF, or JPEG
          </p>
        </div>
      )}
    </Card>
  );
};

export default PhotoUpload;

