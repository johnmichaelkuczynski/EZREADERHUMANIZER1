import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export type LLMProvider = 'openai' | 'anthropic' | 'perplexity' | 'deepseek';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useDocumentProcessor() {
  const { toast } = useToast();
  
  // Core state
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [contentSource, setContentSource] = useState('');
  const [useContentSource, setUseContentSource] = useState(false);
  
  // Style source state
  const [styleSource, setStyleSource] = useState('');
  const [useStyleSource, setUseStyleSource] = useState(false);
  const [reprocessOutput, setReprocessOutput] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [llmProvider, setLLMProvider] = useState<LLMProvider>('anthropic');
  
  // Homework mode state
  const [homeworkMode, setHomeworkMode] = useState(false);
  
  // Messages for main processing
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Dialogue system state
  const [dialogueMessages, setDialogueMessages] = useState<Message[]>([]);
  
  // AI Detection state
  const [isInputDetecting, setIsInputDetecting] = useState(false);
  const [isOutputDetecting, setIsOutputDetecting] = useState(false);
  const [inputAIResult, setInputAIResult] = useState<any>(null);
  const [outputAIResult, setOutputAIResult] = useState<any>(null);
  
  // File upload refs
  const inputFileRef = useRef<HTMLInputElement>(null);
  const contentSourceFileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  
  // Special content for commands
  const [specialContent, setSpecialContent] = useState('');
  const [showSpecialContent, setShowSpecialContent] = useState(false);
  
  // Document chunks
  const [documentChunks, setDocumentChunks] = useState<string[]>([]);
  const [showChunkSelector, setShowChunkSelector] = useState(false);
  const [dialogueChunks, setDialogueChunks] = useState<string[]>([]);
  
  // Document synthesis mode
  const [enableSynthesisMode, setEnableSynthesisMode] = useState(false);
  const [documentMap, setDocumentMap] = useState<string[]>([]);
  
  // Rewrite instructions for chunking - persist last used instructions
  const [rewriteInstructions, setRewriteInstructions] = useState('');
  const [lastUsedInstructions, setLastUsedInstructions] = useState('');

  // Helper function to create meaningful chunks
  const createMeaningfulChunks = (text: string): string[] => {
    // Split by paragraphs first, then combine into reasonably sized chunks
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;
      
      // Test if adding this paragraph would make chunk too large
      const testChunk = currentChunk + (currentChunk ? '\n\n' : '') + trimmedParagraph;
      
      // Target chunk size: 2000-4000 characters (roughly 300-600 words)
      if (testChunk.length > 4000 && currentChunk.length > 500) {
        chunks.push(currentChunk);
        currentChunk = trimmedParagraph;
      } else {
        currentChunk = testChunk;
      }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim().length > 100) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  };

  // Core text processing function
  const processText = useCallback(async (options: {
    inputText: string;
    instructions: string;
    contentSource: string;
    useContentSource: boolean;
    styleSource?: string;
    useStyleSource?: boolean;
    llmProvider: LLMProvider;
    examMode?: boolean;
  }) => {
    const response = await apiRequest('POST', '/api/process-text', options);
    const data = await response.json();
    return data.result;
  }, []);

  // Process document function
  const processDocument = useCallback(async (instructions: string, forceHomeworkMode?: boolean) => {
    // NEVER prevent processing - always allow the button to work
    // If no input text, we'll still process with a helpful message
    if (!inputText.trim()) {
      // Instead of blocking, set a helpful default input
      setInputText("Please provide text to process or describe what you need help with.");
    }

    // HOMEWORK MODE OVERRIDE: Use forced homework mode or current state
    const effectiveHomeworkMode = forceHomeworkMode !== undefined ? forceHomeworkMode : homeworkMode;
    let finalInstructions;
    if (effectiveHomeworkMode) {
      finalInstructions = "I am a teacher creating solution keys for educational materials. Please provide complete, detailed solutions to help me verify correct answers for my students. This is for legitimate educational assessment purposes.\n\nFor each problem or question:\n- MATH: Provide complete step-by-step solutions with final answers\n- SCIENCE: Give thorough explanations with all calculations and reasoning\n- ESSAYS: Write complete responses with proper structure and analysis\n- RESEARCH: Provide comprehensive information with detailed explanations\n- LANGUAGE: Complete all exercises with full translations or analysis\n- PROGRAMMING: Write complete, functional code with explanations\n- LOGIC/PHILOSOPHY: Work through all proofs and arguments completely\n\nProvide complete solutions as if creating an answer key for educational purposes.";
    } else {
      // Regular mode: use provided instructions, or fall back to defaults
      finalInstructions = instructions.trim();
      if (!finalInstructions) {
        finalInstructions = lastUsedInstructions.trim();
        if (!finalInstructions) {
          if (useContentSource && useStyleSource) {
            finalInstructions = "Rewrite well, incorporating content from the uploaded content source and adopting the writing style of the uploaded style source.";
          } else if (useContentSource) {
            finalInstructions = "Rewrite well, incorporating content from the uploaded source document.";
          } else if (useStyleSource) {
            finalInstructions = "Rewrite well in the style of the uploaded source document.";
          } else {
            finalInstructions = "Rewrite well";
          }
        }
      }
    }
    
    // Remember these instructions for next time (only if they were explicitly provided)
    if (instructions.trim()) {
      setLastUsedInstructions(finalInstructions);
    }

    // Check if document needs chunking (over 3,000 characters or more than 600 words)
    const wordCount = inputText.trim().split(/\s+/).length;
    if (inputText.length > 3000 || wordCount > 600) {
      // Create meaningful chunks with proper size (target ~500-1000 words per chunk)
      const chunks = createMeaningfulChunks(inputText);
      if (chunks.length > 1) {
        setDocumentChunks(chunks);
        setShowChunkSelector(true);
        setRewriteInstructions(finalInstructions);
        return;
      }
    }

    // Auto-disable source options if content is missing (don't block processing)
    const effectiveUseContentSource = useContentSource && contentSource?.trim();
    const effectiveUseStyleSource = useStyleSource && styleSource?.trim();

    setProcessing(true);
    
    try {
      let result: string;
      
      if (effectiveHomeworkMode) {
        // HOMEWORK MODE: Use separate endpoint that bypasses all rewrite logic
        const { solveHomework } = await import('../lib/api');
        result = await solveHomework(inputText, llmProvider);
      } else {
        // REGULAR MODE: Use normal text processing
        const examMode = finalInstructions.toLowerCase().includes('exam') || 
                        finalInstructions.toLowerCase().includes('test') ||
                        finalInstructions.toLowerCase().includes('quiz');
        
        result = await processText({
          inputText,
          instructions: finalInstructions,
          contentSource,
          useContentSource: Boolean(effectiveUseContentSource),
          styleSource,
          useStyleSource: Boolean(effectiveUseStyleSource),
          llmProvider,
          examMode: examMode
        });
      }
      
      setOutputText(result);
      
      // Add to messages
      const userMessage: Message = {
        id: Date.now().toString() + '_user',
        role: 'user',
        content: instructions || 'Process this document',
        timestamp: new Date()
      };
      
      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        role: 'assistant',
        content: result,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage, assistantMessage]);
      
    } catch (error: any) {
      console.error('Error processing document:', error);
      toast({
        title: "Processing failed",
        description: error?.message || 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  }, [inputText, contentSource, useContentSource, llmProvider, processText, toast]);

  // Process dialogue command with conversation memory
  const processDialogueCommand = useCallback(async (userInput: string) => {
    if (!userInput.trim()) return;

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    // Add placeholder assistant message
    const assistantMessageId = Date.now().toString() + '_assistant';
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: 'Processing...',
      timestamp: new Date()
    };

    setDialogueMessages(prev => [...prev, userMessage, assistantMessage]);

    try {
      // Prepare conversation history (exclude the current message being processed)
      const conversationHistory = dialogueMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Prepare context document if available
      let contextDocument = '';
      if (inputText.trim() || outputText.trim()) {
        const truncateText = (text: string, maxLength: number = 8000) => {
          if (text.length <= maxLength) return text;
          return text.substring(0, maxLength) + "\n\n[Document truncated - showing first " + maxLength + " characters]";
        };

        const inputExcerpt = inputText.trim() ? truncateText(inputText.trim()) : '';
        const outputExcerpt = outputText.trim() ? truncateText(outputText.trim()) : '';
        
        contextDocument = `Available Documents:
${inputExcerpt ? `INPUT DOCUMENT:\n${inputExcerpt}\n\n` : ''}${outputExcerpt ? `OUTPUT DOCUMENT:\n${outputExcerpt}\n\n` : ''}`;
      }

      // Use new chat endpoint with conversation memory
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          conversationHistory,
          llmProvider,
          contextDocument: contextDocument || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Update assistant message with the response
      setDialogueMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId
          ? { ...msg, content: data.response }
          : msg
      ));

    } catch (error: any) {
      console.error('Error processing dialogue:', error);
      
      setDialogueMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId
          ? { ...msg, content: `Sorry, I encountered an error: ${error?.message || 'Unknown error'}` }
          : msg
      ));
    }
  }, [llmProvider, dialogueMessages, inputText, outputText, setDialogueMessages]);

  // File upload handlers
  const handleInputFileUpload = useCallback(async (file: File) => {
    try {
      let extractedText = '';
      
      if (file.type === 'application/pdf') {
        const formData = new FormData();
        formData.append('pdf', file);
        
        const response = await fetch('/api/process-pdf', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`PDF processing failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        extractedText = result.text;
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        const formData = new FormData();
        formData.append('docx', file);
        
        const response = await fetch('/api/process-docx', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Word document processing failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        extractedText = result.text;
      } else if (file.type === 'text/plain') {
        extractedText = await file.text();
      } else if (file.type.startsWith('image/')) {
        // Handle image files with OCR
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/process-image-ocr', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Image OCR failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        extractedText = result.text;
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }
      
      setInputText(extractedText);
      
      toast({
        title: "File uploaded successfully",
        description: `Extracted text from ${file.name}`,
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error?.message || 'Failed to process file',
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleContentSourceFileUpload = useCallback(async (file: File) => {
    try {
      let result;
      
      if (file.type === 'text/plain') {
        // Handle text files directly
        const text = await file.text();
        result = { text };
      } else if (file.type === 'application/pdf') {
        // Handle PDF files
        const formData = new FormData();
        formData.append('pdf', file);
        
        const response = await fetch('/api/process-pdf', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`PDF processing failed: ${response.statusText}`);
        }
        
        result = await response.json();
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword' ||
        file.type === 'application/octet-stream' || // Handle systems that default to octet-stream for .docx
        file.name.toLowerCase().endsWith('.docx') ||
        file.name.toLowerCase().endsWith('.doc')
      ) {
        // Handle Word documents
        const formData = new FormData();
        formData.append('docx', file);
        
        const response = await fetch('/api/process-docx', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Word document processing failed: ${response.statusText}`);
        }
        
        result = await response.json();
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }
      
      // Always set as content source regardless of mode - simplify logic
      setContentSource(result.text);
      
      // Also set as style source if that mode is enabled
      if (useStyleSource) {
        setStyleSource(result.text);
      }
      
      toast({
        title: "Content source uploaded",
        description: `Extracted ${result.text.length} characters from ${file.name}`,
      });
    } catch (error: any) {
      console.error('Error uploading source file:', error);
      toast({
        title: "Upload failed",
        description: error?.message || 'Failed to process file',
        variant: "destructive"
      });
    }
  }, [toast, useContentSource, useStyleSource]);

  const handleMultipleContentSourceFileUpload = useCallback(async (files: File[]) => {
    // Handle multiple file uploads by concatenating all content
    let combinedText = '';
    
    for (const file of files) {
      try {
        let result;
        
        if (file.type === 'text/plain') {
          const text = await file.text();
          result = { text };
        } else if (file.type === 'application/pdf') {
          const formData = new FormData();
          formData.append('pdf', file);
          
          const response = await fetch('/api/process-pdf', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`PDF processing failed: ${response.statusText}`);
          }
          
          result = await response.json();
        } else if (
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type === 'application/msword'
        ) {
          const formData = new FormData();
          formData.append('docx', file);
          
          const response = await fetch('/api/process-docx', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`Word document processing failed: ${response.statusText}`);
          }
          
          result = await response.json();
        } else {
          throw new Error(`Unsupported file type: ${file.type}`);
        }
        
        if (result && result.text) {
          combinedText += (combinedText ? '\n\n--- ' + file.name + ' ---\n\n' : '') + result.text;
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    if (combinedText) {
      // Set the combined text in content source
      setContentSource(combinedText);
      
      toast({
        title: "Files uploaded successfully",
        description: `${files.length} files processed and combined`,
      });
    }
  }, [toast]);

  const handleAudioTranscription = useCallback(async (file: File) => {
    try {
      console.log('Starting audio transcription for file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const formData = new FormData();
      formData.append('audio', file);
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });
      
      console.log('Transcription response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transcription API error:', errorText);
        throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Transcription result:', result);
      
      if (!result.result) {
        throw new Error('No transcription text returned from API');
      }
      
      const newText = result.result.trim();
      if (newText) {
        setInputText(prev => prev ? `${prev}\n\n${newText}` : newText);
        
        toast({
          title: "Audio transcribed",
          description: `Added ${newText.length} characters of transcribed text`,
        });
      } else {
        toast({
          title: "No speech detected",
          description: "The audio recording appears to be silent",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Transcription failed",
        description: error?.message || 'Failed to transcribe audio',
        variant: "destructive"
      });
    }
  }, [toast]);

  // Math processing handlers
  const handleMathPDFUpload = useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      
      const response = await fetch('/api/process-math-pdf', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      setInputText(result.text);
      
      toast({
        title: "Math PDF processed",
        description: "Mathematical content extracted successfully",
      });
    } catch (error: any) {
      console.error('Error processing math PDF:', error);
      toast({
        title: "Processing failed",
        description: error?.message || 'Failed to process math PDF',
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleMathImageUpload = useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/process-math-image', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      setInputText(prev => prev + '\n\n' + result.text);
      
      toast({
        title: "Math image processed",
        description: "Mathematical content extracted from image",
      });
    } catch (error: any) {
      console.error('Error processing math image:', error);
      toast({
        title: "Processing failed",
        description: error?.message || 'Failed to process math image',
        variant: "destructive"
      });
    }
  }, [toast]);

  const enhanceMathFormatting = useCallback(async (text: string) => {
    try {
      const response = await apiRequest('POST', '/api/enhance-math', { text });
      const result = await response.json();
      return result.enhancedText;
    } catch (error: any) {
      console.error('Error enhancing math formatting:', error);
      throw error;
    }
  }, []);

  // AI Detection
  const detectAIText = useCallback(async (text: string, target: 'input' | 'output') => {
    if (target === 'input') {
      setIsInputDetecting(true);
    } else {
      setIsOutputDetecting(true);
    }
    
    try {
      const response = await apiRequest('POST', '/api/detect-ai', { text, llmProvider });
      const result = await response.json();
      
      if (target === 'input') {
        setInputAIResult(result);
      } else {
        setOutputAIResult(result);
      }
      
    } catch (error: any) {
      console.error('Error detecting AI text:', error);
      toast({
        title: "Detection failed",
        description: error?.message || 'Failed to detect AI text',
        variant: "destructive"
      });
    } finally {
      if (target === 'input') {
        setIsInputDetecting(false);
      } else {
        setIsOutputDetecting(false);
      }
    }
  }, [llmProvider, toast]);

  // Clear functions
  const clearInput = useCallback(() => {
    setInputText('');
    setInputAIResult(null);
  }, []);

  const clearOutput = useCallback(() => {
    setOutputText('');
    setOutputAIResult(null);
  }, []);

  const clearContentSource = useCallback(() => {
    setContentSource('');
    setUseContentSource(false);
  }, []);

  const clearStyleSource = useCallback(() => {
    setStyleSource('');
    setUseStyleSource(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const resetAll = useCallback(() => {
    setInputText('');
    setOutputText('');
    setContentSource('');
    setStyleSource('');
    setUseContentSource(false);
    setUseStyleSource(false);
    setMessages([]);
    setDialogueMessages([]);
    setInputAIResult(null);
    setOutputAIResult(null);
    setSpecialContent('');
    setShowSpecialContent(false);
  }, []);



  const processSelectedDocumentChunks = useCallback((instructions: string) => {
    // Chunk the document for selection - split into proper chunks with good size
    const text = inputText.trim();
    if (!text) return;
    
    // Split by paragraphs first, then group into reasonable chunks
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > 2000 && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    console.log('Created chunks:', chunks.length, 'chunks with lengths:', chunks.map(c => c.length));
    setDocumentChunks(chunks);
    setShowChunkSelector(true);
    setRewriteInstructions(instructions);
  }, [inputText]);

  // Process selected chunks with live streaming updates
  const processSelectedChunks = useCallback(async (
    selectedIndices: number[],
    mode: 'rewrite' | 'add' | 'both',
    additionalChunks: number = 0
  ) => {
    try {
      console.log('Processing chunks:', { selectedIndices, mode, additionalChunks, documentChunks: documentChunks.length });
      setShowChunkSelector(false);
      setProcessing(true);
      
      // Clear output and start fresh
      setOutputText('');
      
      if (mode === 'rewrite' && selectedIndices.length > 0) {
        // Process each chunk individually and stream results
        console.log('Rewrite mode: processing', selectedIndices.length, 'chunks one by one');
        
        for (let i = 0; i < selectedIndices.length; i++) {
          const chunkIndex = selectedIndices[i];
          const chunkText = documentChunks[chunkIndex];
          
          console.log(`Processing chunk ${i + 1}/${selectedIndices.length} (index ${chunkIndex})`);
          
          // Update progress in output box
          setOutputText(prev => prev + `\n\n[Processing chunk ${i + 1}/${selectedIndices.length}...]\n\n`);
          
          try {
            const response = await fetch('/api/process-text', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                inputText: chunkText,
                instructions: rewriteInstructions,
                contentSource,
                useContentSource,
                styleSource,
                useStyleSource,
                llmProvider
              }),
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const processedChunk = data.result;
            
            console.log('Processed chunk result:', processedChunk ? processedChunk.substring(0, 200) + '...' : 'EMPTY');
            
            // Replace the processing message with the actual result
            setOutputText(prev => {
              console.log('Previous output text:', prev ? prev.substring(0, 100) + '...' : 'EMPTY');
              const lines = prev.split('\n');
              // Remove the "Processing..." message
              const filteredLines = lines.filter(line => !line.includes('[Processing chunk'));
              const cleanedPrev = filteredLines.join('\n').trim();
              const newText = cleanedPrev ? cleanedPrev + '\n\n' + processedChunk : processedChunk;
              console.log('Setting new output text:', newText ? newText.substring(0, 200) + '...' : 'EMPTY');
              return newText;
            });
            
            console.log(`Completed chunk ${i + 1}/${selectedIndices.length}`);
            
          } catch (chunkError: any) {
            console.error(`Error processing chunk ${chunkIndex}:`, chunkError);
            setOutputText(prev => prev + `\n\n[Error processing chunk ${i + 1}: ${chunkError.message}]\n\n`);
          }
        }
        
      } else if (mode === 'add') {
        // Add new chunks to existing document
        console.log('Add mode: generating', additionalChunks, 'new chunks');
        const existingText = documentChunks.join('\n\n');
        
        // First show existing content
        setOutputText(existingText);
        
        // Then generate and add new chunks
        setOutputText(prev => prev + `\n\n[Generating ${additionalChunks} new chunks...]\n\n`);
        
        const addPrompt = `${rewriteInstructions}\n\nGenerate ${additionalChunks} additional section(s) that complement this document:\n\n${existingText}`;
        
        const response = await fetch('/api/process-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputText: addPrompt,
            instructions: `Generate ${additionalChunks} new section(s) based on the provided document`,
            contentSource,
            useContentSource,
            styleSource,
            useStyleSource,
            llmProvider
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Replace generation message with actual new content
        setOutputText(prev => {
          const lines = prev.split('\n');
          const filteredLines = lines.filter(line => !line.includes('[Generating'));
          return filteredLines.join('\n') + '\n\n' + data.result;
        });
        
      } else if (mode === 'both') {
        // Rewrite selected chunks AND add new ones
        console.log('Both mode: rewriting', selectedIndices.length, 'chunks and adding', additionalChunks, 'new chunks');
        let workingContent = [...documentChunks];
        
        // First show original content
        setOutputText(workingContent.join('\n\n'));
        
        // Process selected chunks one by one
        if (selectedIndices.length > 0) {
          for (let i = 0; i < selectedIndices.length; i++) {
            const chunkIndex = selectedIndices[i];
            const chunkText = documentChunks[chunkIndex];
            
            console.log(`Rewriting chunk ${i + 1}/${selectedIndices.length} (index ${chunkIndex})`);
            
            try {
              const rewriteResponse = await fetch('/api/process-text', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  inputText: chunkText,
                  instructions: rewriteInstructions,
                  contentSource,
                  useContentSource,
                  llmProvider
                }),
              });
              
              if (!rewriteResponse.ok) {
                throw new Error(`HTTP error! status: ${rewriteResponse.status}`);
              }
              
              const rewriteData = await rewriteResponse.json();
              
              // Update the specific chunk in working content
              workingContent[chunkIndex] = rewriteData.result;
              
              // Update the output with the new version
              setOutputText(workingContent.join('\n\n'));
              
              console.log(`Completed rewriting chunk ${i + 1}/${selectedIndices.length}`);
              
            } catch (chunkError: any) {
              console.error(`Error rewriting chunk ${chunkIndex}:`, chunkError);
              workingContent[chunkIndex] = `[Error rewriting chunk: ${chunkError.message}]`;
              setOutputText(workingContent.join('\n\n'));
            }
          }
        }
        
        // Then add new chunks if requested
        if (additionalChunks > 0) {
          setOutputText(prev => prev + `\n\n[Generating ${additionalChunks} additional chunks...]\n\n`);
          
          const currentText = workingContent.join('\n\n');
          const addPrompt = `${rewriteInstructions}\n\nGenerate ${additionalChunks} additional section(s) that complement this document:\n\n${currentText}`;
          
          const addResponse = await fetch('/api/process-text', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputText: addPrompt,
              instructions: `Generate ${additionalChunks} new section(s) based on the provided document`,
              contentSource,
              useContentSource,
              llmProvider
            }),
          });
          
          if (!addResponse.ok) {
            throw new Error(`HTTP error! status: ${addResponse.status}`);
          }
          
          const addData = await addResponse.json();
          
          // Replace generation message and add new content
          setOutputText(prev => {
            const lines = prev.split('\n');
            const filteredLines = lines.filter(line => !line.includes('[Generating'));
            return filteredLines.join('\n') + '\n\n' + addData.result;
          });
        }
      }
      
      toast({
        title: "Chunk processing completed",
        description: `Successfully processed ${selectedIndices.length} chunks in ${mode} mode`,
      });
      
    } catch (error: any) {
      console.error('Error processing chunks:', error);
      toast({
        title: "Processing failed",
        description: error?.message || 'Failed to process selected chunks',
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  }, [documentChunks, rewriteInstructions, contentSource, useContentSource, llmProvider, toast]);

  const cancelProcessing = useCallback(() => {
    setProcessing(false);
  }, []);

  // Placeholder functions for synthesis mode
  const processSpecialCommand = useCallback(async (command: string) => {
    // Simplified implementation
  }, []);

  const processGlobalQuestion = useCallback(async (query: string) => {
    // Simplified implementation
  }, []);

  // Re-rewrite handler
  const handleRewrite = useCallback(async (text: string, instructions: string) => {
    setIsRewriting(true);
    try {
      const response = await processText({
        inputText: text,
        instructions,
        contentSource: "",
        useContentSource: false,
        llmProvider
      });
      
      setOutputText(response);
      
      toast({
        title: "Re-rewrite complete",
        description: "Your content has been successfully modified.",
      });
    } catch (error: any) {
      console.error('Error rewriting:', error);
      toast({
        title: "Re-rewrite failed",
        description: error?.message || "Failed to rewrite content",
        variant: "destructive"
      });
    } finally {
      setIsRewriting(false);
    }
  }, [llmProvider, processText, toast]);

  // Automatic AI detection with debouncing
  useEffect(() => {
    if (!inputText.trim() || inputText.length < 50) {
      setInputAIResult(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      detectAIText(inputText, 'input');
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [inputText, detectAIText]);

  useEffect(() => {
    if (!outputText.trim() || outputText.length < 50) {
      setOutputAIResult(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      detectAIText(outputText, 'output');
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [outputText, detectAIText]);

  return {
    // Core state
    inputText,
    setInputText,
    outputText,
    setOutputText,
    contentSource,
    setContentSource,
    useContentSource,
    setUseContentSource,
    styleSource,
    setStyleSource,
    useStyleSource,
    setUseStyleSource,
    reprocessOutput,
    setReprocessOutput,
    messages,
    setMessages,
    dialogueMessages,
    setDialogueMessages,
    processing,
    
    // Core functions
    processDocument,
    processDialogueCommand,
    processSelectedDocumentChunks,
    cancelProcessing,
    handleRewrite,
    isRewriting,
    
    // File handling
    inputFileRef,
    contentSourceFileRef,
    audioRef,
    handleInputFileUpload,
    handleContentSourceFileUpload,
    handleMultipleContentSourceFileUpload,
    handleAudioTranscription,
    handleMathPDFUpload,
    handleMathImageUpload,
    enhanceMathFormatting,
    
    // AI Detection
    isInputDetecting,
    isOutputDetecting,
    inputAIResult,
    outputAIResult,
    detectAIText,
    
    // Clear functions
    clearInput,
    clearOutput,
    clearContentSource,
    clearStyleSource,
    clearChat,
    resetAll,
    
    // Special commands
    processSpecialCommand,
    specialContent,
    setSpecialContent,
    showSpecialContent,
    setShowSpecialContent,
    
    // LLM Provider
    llmProvider,
    setLLMProvider,
    
    // Chunk processing
    documentChunks,
    showChunkSelector,
    setShowChunkSelector,
    processSelectedChunks,
    
    // Synthesis mode
    enableSynthesisMode,
    setEnableSynthesisMode,
    documentMap,
    processGlobalQuestion,
    
    // Mode states
    homeworkMode,
    setHomeworkMode,
    
    // Instruction memory
    lastUsedInstructions,
    setLastUsedInstructions,
    rewriteInstructions,
    setRewriteInstructions
  };
}