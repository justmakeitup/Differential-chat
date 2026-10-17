import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Upload,
  X,
  Sparkles,
  AlertCircle,
  Eye,
  Lock,
  Globe,
  Image as ImageIcon
} from 'lucide-react';

interface PostComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export const PostComposerModal: React.FC<PostComposerModalProps> = ({
  isOpen,
  onClose,
  onPostCreated
}) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'connections_only'>('public');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    setValidationError(null);

    // Strict rejection of video files
    if (file.type.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(file.name)) {
      setValidationError("Video uploads are strictly not supported. Differential is a curated, image-only platform.");
      return;
    }

    if (!file.type.startsWith('image/')) {
      setValidationError("Please select a valid static image file (JPG, PNG, or WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setValidationError("Image file exceeds the 8MB size limit.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError("Please select an image to upload.");
      return;
    }

    if (!altText.trim()) {
      setValidationError("Descriptive alt-text is required for accessibility.");
      return;
    }

    setLoading(true);
    setValidationError(null);

    try {
      await api.createPost({
        image: selectedFile,
        alt_text: altText.trim(),
        caption: caption.trim(),
        privacy_level: privacyLevel
      });

      addToast({
        type: 'gold',
        title: 'Photograph Exhibited',
        message: 'Your image has been processed with EXIF metadata stripped and published to the sanctuary.'
      });

      // Cleanup
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      setAltText('');
      onPostCreated();
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to publish image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl rounded-3xl bg-obsidian-900 border border-white/10 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-white">Publish to Gallery</h3>
              <p className="text-[11px] text-editorial-subtle">
                Curated visual art • EXIF scrubbing enforced
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Image Dropzone / Preview */}
          {!previewUrl ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-gold-400 bg-gold-500/10'
                  : 'border-white/15 bg-obsidian-950/50 hover:border-white/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-obsidian-800 text-gold-400 flex items-center justify-center mx-auto shadow-inner-glow">
                <Upload className="w-6 h-6" />
              </div>
              <p className="mt-3 text-xs font-medium text-white">
                Drag and drop a photograph, or <span className="text-gold-400 underline">browse files</span>
              </p>
              <p className="mt-1 text-[11px] text-editorial-subtle font-mono">
                JPG, PNG, WebP up to 8MB • Strict image-only (no video)
              </p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-obsidian-950 max-h-72 flex items-center justify-center group">
              <img
                src={previewUrl}
                alt="Upload preview"
                className="max-h-72 w-full object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-3 right-3 p-2 rounded-xl bg-obsidian-950/80 backdrop-blur-md text-white border border-white/20 hover:bg-rose-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mandatory Alt-Text Field */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-200">
                Accessibility Description (Alt Text) <span className="text-gold-400">*</span>
              </label>
              <span className="text-[10px] text-editorial-muted font-mono">Required</span>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Architectural photograph of a monolithic concrete pavilion in mist..."
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
            />
            <p className="mt-1 text-[10px] text-editorial-subtle">
              Provides essential context for vision-impaired members using screen readers.
            </p>
          </div>

          {/* Artistic Caption */}
          <div>
            <label className="block text-xs font-medium text-slate-200">
              Curator’s Note / Caption (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Reflections on geometry, process, film stock, or intent..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 resize-none"
            />
          </div>

          {/* Privacy Level Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5">
              Visibility Sphere
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPrivacyLevel('public')}
                className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2.5 ${
                  privacyLevel === 'public'
                    ? 'bg-gold-500/10 border-gold-500/40 text-gold-300'
                    : 'bg-obsidian-950 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4 shrink-0" />
                <div>
                  <p className="font-semibold text-white">Public Exhibition</p>
                  <p className="text-[10px] text-editorial-subtle">Visible to all discerning members</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPrivacyLevel('connections_only')}
                className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2.5 ${
                  privacyLevel === 'connections_only'
                    ? 'bg-electric-500/10 border-electric-500/40 text-electric-300'
                    : 'bg-obsidian-950 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4 shrink-0" />
                <div>
                  <p className="font-semibold text-white">Connections Only</p>
                  <p className="text-[10px] text-editorial-subtle">Restricted to mutual peers</p>
                </div>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile || !altText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 shadow-gold-glow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Scrubbing EXIF & Publishing...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish Photograph</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
