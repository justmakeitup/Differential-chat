import os
import uuid
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageOps
from config import Config

def process_and_save_image(file_storage, folder: Path, thumbnail_folder: Path, max_dimension: int = 2048, thumb_dimension: int = 480):
    """
    Validates, strips privacy metadata (EXIF/GPS), compresses,
    and generates both full-res optimized and thumbnail images.
    Strictly rejects video and non-image files.
    """
    filename = file_storage.filename or ''
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    
    # Check explicitly for rejected video extensions
    if ext in Config.REJECTED_EXTENSIONS or file_storage.mimetype.startswith('video/'):
        return None, "Video uploads are strictly prohibited. Differential is a curated, image-only platform."
        
    if ext not in Config.ALLOWED_IMAGE_EXTENSIONS:
        return None, f"Unsupported file format '.{ext}'. Allowed formats: JPG, PNG, WEBP."

    # Read binary stream into memory for inspection
    try:
        image_bytes = file_storage.read()
        if len(image_bytes) > Config.MAX_CONTENT_LENGTH:
            return None, "Image file size exceeds the 8MB limit."
            
        stream = BytesIO(image_bytes)
        img = Image.open(stream)
        img.verify() # Verify file header and integrity
        
        # Re-open image after verify() closes the stream
        stream.seek(0)
        img = Image.open(stream)
    except Exception as e:
        return None, f"Invalid or corrupted image file: {str(e)}"

    # Ensure format is one of allowed formats
    img_format = (img.format or '').upper()
    if img_format not in ['JPEG', 'PNG', 'WEBP']:
        return None, f"Detected invalid image format ({img_format}). Only static JPG, PNG, and WEBP are supported."

    # Handle EXIF orientation rotation then strip all EXIF metadata for user privacy
    try:
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    # Convert to RGB (or RGBA if transparent PNG)
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        clean_img = Image.new('RGBA', img.size)
        clean_img.paste(img)
    else:
        clean_img = Image.new('RGB', img.size)
        clean_img.paste(img)

    width, height = clean_img.size
    
    # Calculate aspect ratio string
    ratio_val = width / max(height, 1)
    if 0.75 <= ratio_val <= 0.85:
        aspect_ratio = "4:5"
    elif 0.95 <= ratio_val <= 1.05:
        aspect_ratio = "1:1"
    elif 1.7 <= ratio_val <= 1.85:
        aspect_ratio = "16:9"
    elif 1.3 <= ratio_val <= 1.4:
        aspect_ratio = "4:3"
    elif ratio_val < 0.75:
        aspect_ratio = "9:16"
    else:
        aspect_ratio = f"{round(ratio_val, 2)}:1"

    # Resize full-size image if exceeds max_dimension
    full_img = clean_img.copy()
    if width > max_dimension or height > max_dimension:
        full_img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

    # Generate thumbnail
    thumb_img = clean_img.copy()
    thumb_img.thumbnail((thumb_dimension, thumb_dimension), Image.Resampling.LANCZOS)

    # Generate randomized file names (UUID) to prevent enumeration & path traversal
    file_id = uuid.uuid4().hex
    full_filename = f"{file_id}.webp"
    thumb_filename = f"{file_id}_thumb.webp"

    os.makedirs(folder, exist_ok=True)
    os.makedirs(thumbnail_folder, exist_ok=True)

    full_path = folder / full_filename
    thumb_path = thumbnail_folder / thumb_filename

    # Save as optimized WebP without EXIF metadata
    full_img.save(full_path, format='WEBP', quality=88, method=6)
    thumb_img.save(thumb_path, format='WEBP', quality=80, method=4)

    return {
        'filename': full_filename,
        'image_url': f"/api/uploads/{full_filename}",
        'thumbnail_url': f"/api/uploads/thumbnails/{thumb_filename}",
        'width': full_img.width,
        'height': full_img.height,
        'aspect_ratio': aspect_ratio
    }, None
