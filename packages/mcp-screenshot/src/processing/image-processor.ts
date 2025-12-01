/**
 * Image processing implementation using sharp
 */

import sharp from "sharp";
import { IImageProcessor } from "../interfaces";
import { ImageFormat } from "../types";
import { UnsupportedFormatError } from "../errors";

/**
 * Image processor implementation
 */
export class ImageProcessor implements IImageProcessor {
  /**
   * Encode an image buffer to a specific format
   */
  async encode(
    buffer: Buffer,
    format: ImageFormat,
    quality?: number
  ): Promise<Buffer> {
    const image = sharp(buffer);

    switch (format) {
      case "png":
        return image
          .png({ compressionLevel: quality ? Math.floor(quality / 10) : 9 })
          .toBuffer();
      case "jpeg":
        return image.jpeg({ quality: quality || 90 }).toBuffer();
      case "webp":
        return image.webp({ quality: quality || 90 }).toBuffer();
      case "bmp":
        // Sharp doesn't support BMP output directly, convert to PNG first
        throw new UnsupportedFormatError(
          "BMP format encoding not yet implemented"
        );
      default:
        throw new UnsupportedFormatError(`Unsupported format: ${format}`);
    }
  }

  /**
   * Crop an image to a specific region
   */
  async crop(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<Buffer> {
    return sharp(buffer).extract({ left: x, top: y, width, height }).toBuffer();
  }

  /**
   * Resize an image
   */
  async resize(buffer: Buffer, width: number, height: number): Promise<Buffer> {
    return sharp(buffer).resize(width, height).toBuffer();
  }

  /**
   * Get image metadata
   */
  async getMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || "unknown",
      size: buffer.length,
    };
  }

  /**
   * Convert image format
   */
  async convertFormat(
    buffer: Buffer,
    targetFormat: ImageFormat
  ): Promise<Buffer> {
    return this.encode(buffer, targetFormat);
  }
}
