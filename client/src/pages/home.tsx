import { useState, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { InputEditor } from "@/components/editor/InputEditor";
import { OutputEditor } from "@/components/editor/OutputEditor";
import { ContentSourceBox } from "@/components/editor/ContentSourceBox";
import { VoiceInput } from "@/components/ui/voice-input";

import { ChatInterface } from "@/components/editor/ChatInterface";
import { DialogueBox } from "@/components/editor/DialogueBox";
import { SpecialContentPopup } from "@/components/editor/SpecialContentPopup";
import { ProcessingStatusBar } from "@/components/editor/ProcessingStatusBar";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { ChunkSelector } from "@/components/editor/ChunkSelector";
import { GPTBypassInterface } from "@/components/gpt-bypass/GPTBypassInterface";
import { useDocumentProcessor, LLMProvider } from "@/hooks/use-document-processor";
import { useFileOperations } from "@/hooks/use-file-operations";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchOnline, extractTextFromImage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const {
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
    processDocument,
    processSelectedDocumentChunks,
    cancelProcessing,
    inputFileRef,
    contentSourceFileRef,
    audioRef,
    handleInputFileUpload,
    handleContentSourceFileUpload,
    handleMultipleContentSourceFileUpload,
    handleAudioTranscription,
    isInputDetecting,
    isOutputDetecting,
    inputAIResult,
    outputAIResult,
    detectAIText,
    clearInput,
    clearOutput,
    clearContentSource,
    clearStyleSource,
    clearChat,
    resetAll,
    processSpecialCommand,
    specialContent,
    setSpecialContent,
    showSpecialContent,
    setShowSpecialContent,
    llmProvider,
    setLLMProvider,
    documentChunks,
    showChunkSelector,
    setShowChunkSelector,
    processSelectedChunks,
    // Full Document Synthesis Mode
    enableSynthesisMode,
    setEnableSynthesisMode,
    documentMap,
    processGlobalQuestion,
    // Mode states
    homeworkMode,
    setHomeworkMode,
    // Instruction memory
    lastUsedInstructions,
    rewriteInstructions,
    setRewriteInstructions,
    // Re-rewrite functionality
    handleRewrite,
    isRewriting
  } = useDocumentProcessor();

  const {
    isExporting,
    isSendingEmail,
    copyToClipboard,
    exportAsPDF,
    exportAsDOCX,
    exportAsHTML,
    exportAsLaTeX,
    sendEmailWithDocument
  } = useFileOperations();

  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [audioTranscribeDialogOpen, setAudioTranscribeDialogOpen] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [examMode, setExamMode] = useState(false);
  
  const { toast } = useToast();
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<BlobPart[]>([]);

  // Handle online search
  const handleSearch = async () => {
    if (!searchQuery) {
      toast({
        title: "Search query required",
        description: "Please enter a search term.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSearching(true);
      
      const result = await searchOnline(searchQuery);
      setInputText(prev => prev ? `${prev}\n\n${result.content}` : result.content);
      
      setSearchDialogOpen(false);
      toast({
        title: "Search complete",
        description: `Found ${result.results.length} results`,
      });
    } catch (error: any) {
      console.error('Error searching online:', error);
      toast({
        title: "Search failed",
        description: error?.message || "Failed to search online",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Voice input handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      audioChunks.current = [];
      
      // Use compatible MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorder.current = recorder;
      
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      });
      
      recorder.addEventListener('stop', async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunks.current.length === 0) {
          toast({
            title: "Recording failed",
            description: "No audio data was recorded",
            variant: "destructive"
          });
          setIsRecording(false);
          return;
        }
        
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        const audioFile = new File([audioBlob], `recording.${mimeType.split('/')[1]}`, { type: mimeType });
        
        console.log('Audio file created:', audioFile.size, 'bytes');
        
        try {
          toast({
            title: "Transcribing audio",
            description: "Processing your recording...",
          });
          
          await handleAudioTranscription(audioFile);
          setVoiceDialogOpen(false);
        } catch (error: any) {
          console.error('Transcription error:', error);
          toast({
            title: "Transcription failed",
            description: error?.message || "Failed to transcribe audio",
            variant: "destructive"
          });
        } finally {
          setIsRecording(false);
        }
      });
      
      // Start recording with time slices for better data collection
      recorder.start(1000);
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak into your microphone",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions and try again.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      console.log('Stopping recording...');
      mediaRecorder.current.stop();
      // Stream cleanup is handled in the 'stop' event handler
    }
  };

  // Handle audio file selection for transcription
  const handleAudioFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAudioFile(e.target.files[0]);
    }
  };

  // Handle image upload for OCR
  const handleImageUpload = async (file: File) => {
    try {
      const result = await extractTextFromImage(file);
      
      // Append the extracted text to current input
      const newText = inputText ? `${inputText}\n\n${result.text}` : result.text;
      setInputText(newText);
      
      toast({
        title: "Text extracted successfully",
        description: `Extracted text from image${result.confidence ? ` with ${Math.round(result.confidence * 100)}% confidence` : ''}`,
      });
    } catch (error) {
      console.error('Error extracting text from image:', error);
      toast({
        title: "Image processing failed",
        description: error instanceof Error ? error.message : "Failed to extract text from image",
        variant: "destructive"
      });
    }
  };

  const transcribeSelectedAudio = async () => {
    if (!audioFile) {
      toast({
        title: "No audio file selected",
        description: "Please select an audio file to transcribe.",
        variant: "destructive"
      });
      return;
    }

    try {
      await handleAudioTranscription(audioFile);
      setAudioTranscribeDialogOpen(false);
      setAudioFile(null);
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        description: error?.message || "Failed to transcribe audio",
        variant: "destructive"
      });
    }
  };

  // Handle processing
  const handleProcess = (instructions: string, homeworkMode?: boolean) => {
    // Smart instruction handling: use provided instructions, or fall back to last used, or default
    let finalInstructions = instructions.trim();
    if (!finalInstructions) {
      finalInstructions = lastUsedInstructions.trim() || "Rewrite well";
    }
    
    processDocument(finalInstructions, homeworkMode);
  };

  // Select an instruction from saved instructions
  const handleInstructionSelect = (instructions: string) => {
    // Create a new user message with the instructions
    const newMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: instructions,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        llmProvider={llmProvider}
        onLLMProviderChange={setLLMProvider}
      />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Mobile LLM Selector - shown only on small screens */}
        <div className="mb-4 flex items-center md:hidden">
          <span className="text-sm text-slate-500">Powered by</span>
          <div className="relative ml-2 flex-1">
            <select 
              className="w-full appearance-none bg-white border border-slate-200 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={llmProvider}
              onChange={(e) => setLLMProvider(e.target.value as any)}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="perplexity">Perplexity</option>
              <option value="deepseek">DeepSeek</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Main Editor Area - Full Width */}
        <div>
          <div>
            {/* Editor Toolbar */}
            <EditorToolbar
              onProcess={handleProcess}
              onFindOnline={() => setSearchDialogOpen(true)}
              onVoiceInput={() => setVoiceDialogOpen(true)}
              onAudioTranscription={() => setAudioTranscribeDialogOpen(true)}
              isProcessing={processing}
              llmProvider={llmProvider}
              setLLMProvider={(provider: string) => setLLMProvider(provider as any)}
              onInstructionsSelect={handleInstructionSelect}
              currentInstructions={messages.filter(msg => msg.role === 'user').pop()?.content || ''}
              enableSynthesisMode={enableSynthesisMode}
              setEnableSynthesisMode={setEnableSynthesisMode}
              rewriteInstructions={rewriteInstructions}
              setRewriteInstructions={setRewriteInstructions}
              homeworkMode={homeworkMode}
              setHomeworkMode={setHomeworkMode}
              onClearAll={resetAll}
            />
            
            {/* Text Processing Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Input Editor */}
              <InputEditor
                text={inputText}
                onTextChange={setInputText}
                onFileUpload={handleInputFileUpload}
                onImageUpload={handleImageUpload}
                onClear={clearInput}
                onCopy={copyToClipboard}
                onDetectAI={(text) => {
                  detectAIText(text, "input");
                  return Promise.resolve();
                }}
                isDetecting={isInputDetecting}
                inputFileRef={inputFileRef}
                aiResult={inputAIResult}
              />
              
              {/* Output Editor */}
              <OutputEditor
                text={outputText}
                onTextChange={setOutputText}
                onClear={clearOutput}
                onCopy={copyToClipboard}
                onExportPDF={exportAsPDF}
                onExportDOCX={exportAsDOCX}
                onExportHTML={exportAsHTML}
                onExportLaTeX={exportAsLaTeX}
                onDetectAI={(text) => {
                  detectAIText(text, "output");
                  return Promise.resolve();
                }}
                onSendEmail={sendEmailWithDocument}
                onRewrite={handleRewrite}
                isDetecting={isOutputDetecting}
                isSendingEmail={isSendingEmail}
                isRewriting={isRewriting}
                inputText={inputText}
                outputAIResult={outputAIResult}
              />
            </div>
            
            {/* Chunk Selector - shown when document is divided into chunks */}
            {showChunkSelector && documentChunks.length > 0 && (
              <ChunkSelector
                chunks={documentChunks}
                onProcessSelected={async (selectedIndices: number[], mode: 'rewrite' | 'add' | 'both', additionalChunks?: number) => {
                  try {
                    // Use the correct processSelectedChunks function from the hook
                    await processSelectedChunks(selectedIndices, mode, additionalChunks || 0);
                    
                    // Update the final message
                    setMessages(prev => prev.map(msg => 
                      msg.role === 'assistant' && msg.id === prev[prev.length - 1]?.id
                        ? { ...msg, content: `Processing complete! ${mode === 'add' ? 'New content added' : mode === 'both' ? 'Content rewritten and expanded' : 'Content rewritten'} successfully.` }
                        : msg
                    ));
                  } catch (error) {
                    console.error('Error processing chunks:', error);
                  }
                }}
                onCancel={() => setShowChunkSelector(false)}
              />
            )}
            
            {/* Processing Status Bar - shown only when processing */}
            {processing && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-600">Processing chunks...</div>
              </div>
            )}
            
            {/* Chat Interface */}
            <ChatInterface
              messages={messages}
              onSendMessage={(content) => {
                const newMessage = {
                  id: crypto.randomUUID(),
                  role: 'user' as const,
                  content,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, newMessage]);
                // CRITICAL FIX: Don't call processDocument here - that sends responses to output box
                // Instead, let the DialogueBox handle its own chat responses
                // processDocument(content); // REMOVED - this was causing chat responses to appear in output box
              }}
              onClearChat={clearChat}
              reprocessOutput={reprocessOutput}
              onReprocessOutputChange={setReprocessOutput}
              onSendToInput={(content) => {
                setInputText(content);
              }}
            />
            
            {/* Dialogue Box - For discussing text and special commands */}
            <DialogueBox
              messages={dialogueMessages}
              onSendMessage={async (userInput: string, contextDocument?: string) => {
                if (!userInput.trim()) return;

                // Add user message
                const userMessage = {
                  id: Date.now().toString() + '_user',
                  role: 'user' as const,
                  content: userInput,
                  timestamp: new Date()
                };

                // Add assistant placeholder
                const assistantMessageId = Date.now().toString() + '_assistant';
                const assistantMessage = {
                  id: assistantMessageId,
                  role: 'assistant' as const,
                  content: 'Processing...',
                  timestamp: new Date()
                };

                setDialogueMessages(prev => [...prev, userMessage, assistantMessage]);

                try {
                  // Use chat endpoint with conversation memory
                  const conversationHistory = dialogueMessages
                    .filter(msg => msg.content !== 'Processing...')
                    .map(msg => ({
                      role: msg.role,
                      content: msg.content
                    }));

                  const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      message: userInput,
                      conversationHistory,
                      llmProvider,
                      contextDocument: inputText || outputText || undefined
                    })
                  });

                  if (!response.ok) {
                    throw new Error(`API Error: ${response.statusText}`);
                  }

                  const data = await response.json();
                  
                  // Update assistant message with response
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
              }}
              onProcessSpecialCommand={() => {}}
              onReset={resetAll}
              inputText={inputText}
              outputText={outputText}
              contentSource={contentSource}
              instructions={messages.filter(msg => msg.role === 'user').pop()?.content || ''}
              isProcessing={false}
              enableSynthesisMode={enableSynthesisMode}
              documentMap={documentMap}
              onProcessGlobalQuestion={processGlobalQuestion}
              onSendToInput={(content) => {
                setInputText(content);
              }}
              onClearMessages={() => {
                setDialogueMessages([]);
              }}
            />
            
            {/* GPT Bypass Interface - Added below existing functionality */}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <GPTBypassInterface 
                onSendToInput={(text) => setInputText(text)}
                onSendToOutput={(text) => setOutputText(text)}
                inputFromMain={inputText}
                outputFromMain={outputText}
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Special Content Popup - displays generated content without overwriting output */}
      <SpecialContentPopup
        isOpen={showSpecialContent}
        onClose={() => setShowSpecialContent(false)}
        content={specialContent}
        onCopyToClipboard={copyToClipboard}
        onExportPDF={exportAsPDF}
        onExportDOCX={exportAsDOCX}
        onSendEmail={async (params) => {
          return await sendEmailWithDocument(
            params.to,
            params.subject,
            params.message,
            "Original Document",
            params.document
          );
        }}
      />
      
      {/* Find Online Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find Content Online</DialogTitle>
            <DialogDescription>
              Search the web for content to add to your input text.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Enter search query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="pr-10"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <VoiceInput
                    onTranscription={(text) => setSearchQuery(searchQuery ? `${searchQuery} ${text}` : text)}
                    className="h-8 w-8"
                  />
                </div>
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Voice Input Dialog */}
      <Dialog open={voiceDialogOpen} onOpenChange={(open) => {
        if (!open && isRecording) stopRecording();
        setVoiceDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice Input</DialogTitle>
            <DialogDescription>
              Record your voice to add text to the input box.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-8">
            <div className={`relative w-20 h-20 rounded-full ${isRecording ? 'bg-red-100' : 'bg-slate-100'} flex items-center justify-center mb-4`}>
              <Button 
                className={`w-16 h-16 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <rect x="6" y="6" width="8" height="8" rx="1" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a3 3 0 00-3 3v4a3 3 0 006 0V5a3 3 0 00-3-3zm0 2a1 1 0 011 1v4a1 1 0 11-2 0V5a1 1 0 011-1z" clipRule="evenodd" />
                    <path d="M5 10v1a5 5 0 0010 0v-1h2v1a7 7 0 01-14 0v-1h2z" />
                  </svg>
                )}
              </Button>
            </div>
            <p className="text-sm text-slate-500">
              {isRecording ? 'Recording... Click the button to stop.' : 'Click the button to start recording'}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoiceDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Audio Transcription Dialog */}
      <Dialog open={audioTranscribeDialogOpen} onOpenChange={setAudioTranscribeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audio Transcription</DialogTitle>
            <DialogDescription>
              Upload an audio file to transcribe to text.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
              <input
                type="file"
                id="audio-file"
                className="hidden"
                accept="audio/*"
                onChange={handleAudioFileSelected}
                ref={audioRef}
              />
              <Button 
                variant="outline" 
                onClick={() => audioRef.current?.click()}
                className="mb-2"
              >
                Select Audio File
              </Button>
              <p className="text-sm text-slate-500">
                {audioFile ? `Selected: ${audioFile.name}` : 'No file selected'}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAudioTranscribeDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={transcribeSelectedAudio} 
              disabled={!audioFile}
            >
              Transcribe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
