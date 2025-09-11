import * as fs from 'fs';
import * as path from 'path';

export interface ProcessedFile {
  filename: string;
  content: string;
  wordCount: number;
}

export class FileProcessor {
  async processFile(buffer: Buffer, filename: string): Promise<string> {
    const ext = filename.toLowerCase().split('.').pop();
    
    try {
      switch (ext) {
        case 'txt':
          return buffer.toString('utf-8');
        case 'pdf':
          return await this.processPDF(buffer);
        case 'doc':
        case 'docx':
          return await this.processWord(buffer);
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }
    } catch (error) {
      console.error('File processing error:', error);
      throw new Error(`Failed to process ${ext} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processPDF(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(buffer);
      return data.text;
    } catch (error) {
      throw new Error('PDF processing failed. Please ensure the file is a valid PDF.');
    }
  }

  private async processWord(buffer: Buffer): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error('Word document processing failed. Please ensure the file is a valid Word document.');
    }
  }

  // Legacy method for compatibility
  async processFile_old(filePath: string, originalName: string): Promise<ProcessedFile> {
    const ext = path.extname(originalName).toLowerCase();
    let content: string;

    try {
      switch (ext) {
        case '.txt':
          content = await this.processTxtFile(filePath);
          break;
        case '.pdf':
          content = await this.processPdfFile(filePath);
          break;
        case '.doc':
        case '.docx':
          content = await this.processWordFile(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }

      const wordCount = this.countWords(content);
      
      return {
        filename: originalName,
        content,
        wordCount,
      };
    } finally {
      // Clean up temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  private async processTxtFile(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf-8');
  }

  private async processPdfFile(filePath: string): Promise<string> {
    try {
      // For now, return a placeholder since pdf-parse requires additional setup
      // In production, would use pdf-parse library
      const pdfParse = await import('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse.default(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error('PDF processing failed. Please ensure the file is a valid PDF.');
    }
  }

  private async processWordFile(filePath: string): Promise<string> {
    try {
      // For now, return a placeholder since mammoth requires additional setup
      // In production, would use mammoth library
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      throw new Error('Word document processing failed. Please ensure the file is a valid Word document.');
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  async validateFile(file: Express.Multer.File): Promise<void> {
    const allowedTypes = ['.txt', '.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowedTypes.includes(ext)) {
      throw new Error(`File type ${ext} is not supported. Please upload a TXT, PDF, DOC, or DOCX file.`);
    }

    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 50MB limit.');
    }
  }
}

export const fileProcessorService = new FileProcessor();