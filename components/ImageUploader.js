import { useState, useRef } from 'react';
import { uploadMenuItemImage } from '../lib/firebaseHelpers';
import toast from 'react-hot-toast';
import { FiUpload, FiX, FiCamera } from 'react-icons/fi';

export default function ImageUploader({ itemId, currentImage, onImageSaved }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentImage || '');
  const inputRef = useRef();

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    setProgress(0);

    try {
      // Use itemId or a timestamp as the storage key
      const id = itemId || `temp-${Date.now()}`;
      const url = await uploadMenuItemImage(file, id, setProgress);
      setPreview(url);
      onImageSaved(url);
      toast.success('Photo uploaded!');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. Please try again.');
      setPreview(currentImage || '');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function clearImage() {
    setPreview('');
    onImageSaved('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <label className="text-xs font-bold text-text-muted mb-1.5 block">
        📸 Food Photo
      </label>

      {/* Upload area */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed overflow-hidden transition-all cursor-pointer
          ${uploading ? 'border-primary bg-orange-50' : 'border-orange-200 bg-orange-50/50 hover:border-primary hover:bg-orange-50'}`}
        style={{ aspectRatio: preview ? 'auto' : '16/7', minHeight: '80px' }}
      >
        {preview ? (
          /* Preview image */
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Food photo"
              className="w-full object-cover rounded-xl"
              style={{ maxHeight: '160px' }}
            />
            {/* Overlay on hover */}
            {!uploading && (
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                <div className="flex flex-col items-center text-white text-xs font-semibold">
                  <FiCamera size={20} className="mb-1" />
                  Change photo
                </div>
              </div>
            )}
            {/* Remove button */}
            {!uploading && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearImage(); }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
              >
                <FiX size={13} />
              </button>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-5 px-3 text-center">
            <FiUpload size={22} className="text-primary mb-2" />
            <p className="text-xs font-bold text-text-main">Tap to upload photo</p>
            <p className="text-xs text-text-muted mt-0.5">JPG, PNG — max 5MB</p>
          </div>
        )}

        {/* Upload progress overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-xl">
            <div className="w-3/4 bg-orange-100 rounded-full h-2 mb-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs font-bold text-primary">Uploading... {progress}%</p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* URL input as fallback */}
      <div className="mt-2">
        <p className="text-xs text-text-muted mb-1">Or paste an image URL:</p>
        <input
          type="url"
          value={(!uploading && preview && !preview.startsWith('blob:')) ? preview : ''}
          onChange={e => { setPreview(e.target.value); onImageSaved(e.target.value); }}
          placeholder="https://example.com/photo.jpg"
          className="w-full bg-bg-warm border border-orange-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}
