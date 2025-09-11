import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChunkSelectionModal } from "./ChunkSelectionModal";
import { WRITING_SAMPLES, INSTRUCTION_PRESETS, DEFAULT_WRITING_SAMPLE, DEFAULT_INSTRUCTION_PRESETS, type WritingSample, type InstructionPreset } from "@shared/writingSamples";
import { 
  Upload, 
  Play, 
  RotateCcw, 
  Scan, 
  Copy, 
  Download,
  FileText,
  Zap,
  ArrowUp,
  ArrowDown,
  FileDown,
  Settings,
  Trash2
} from "lucide-react";

interface RewriteJob {
  id: string;
  originalText: string;
  rewrittenText?: string;
  styleText: string;
  provider: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: Date;
  completedAt?: Date;
}

interface GPTZeroResult {
  aiScore: number;
  isAI: boolean;
  confidence: number;
}

interface TextChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  wordCount: number;
}

interface GPTBypassProps {
  onSendToInput?: (text: string) => void;
  onSendToOutput?: (text: string) => void;
  inputFromMain?: string;
  outputFromMain?: string;
  onSendToGPTBypass?: (text: string) => void;
}

// Remove this as we now use the shared writing samples

export function GPTBypassInterface({ onSendToInput, onSendToOutput, inputFromMain, outputFromMain }: GPTBypassProps = {}) {
  const [inputText, setInputText] = useState("");
  const [styleText, setStyleText] = useState(DEFAULT_WRITING_SAMPLE.content);
  const [outputText, setOutputText] = useState("");
  const [provider, setProvider] = useState<'anthropic' | 'openai' | 'deepseek' | 'perplexity'>('anthropic');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [currentJob, setCurrentJob] = useState<RewriteJob | null>(null);
  const [inputGptZeroResult, setInputGptZeroResult] = useState<GPTZeroResult | null>(null);
  const [outputGptZeroResult, setOutputGptZeroResult] = useState<GPTZeroResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [isInputDetecting, setIsInputDetecting] = useState(false);
  const [isOutputDetecting, setIsOutputDetecting] = useState(false);
  
  // New state for enhanced functionality
  const [selectedWritingSample, setSelectedWritingSample] = useState<WritingSample>(DEFAULT_WRITING_SAMPLE);
  const [selectedInstructionPresets, setSelectedInstructionPresets] = useState<Set<string>>(
    new Set(DEFAULT_INSTRUCTION_PRESETS.map(p => p.id))
  );
  const [customInstructions, setCustomInstructions] = useState("");
  const [textChunks, setTextChunks] = useState<TextChunk[]>([]);
  const [showChunkModal, setShowChunkModal] = useState(false);
  const [pendingFileContent, setPendingFileContent] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const styleFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle inputFromMain - chunking logic
  useEffect(() => {
    if (inputFromMain && inputFromMain.trim()) {
      const wordCount = inputFromMain.trim().split(/\s+/).length;
      
      if (wordCount > 500) {
        // Text is large, get chunks and show modal
        handleLargeInputText(inputFromMain);
      } else {
        // Text is small, set directly
        setInputText(inputFromMain);
      }
    }
  }, [inputFromMain]);

  const handleLargeInputText = async (text: string) => {
    try {
      const chunkResponse = await fetch('/api/gpt-bypass/chunk-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (chunkResponse.ok) {
        const chunks = await chunkResponse.json();
        setTextChunks(chunks);
        setPendingFileContent(text);
        setShowChunkModal(true);
      } else {
        // Fallback to setting full text
        setInputText(text);
        toast({
          title: "Large text detected",
          description: "Text loaded directly. Consider chunking for better processing.",
        });
      }
    } catch (error) {
      console.error('Chunking error:', error);
      setInputText(text);
      toast({
        title: "Chunking failed",
        description: "Text loaded directly.",
        variant: "destructive",
      });
    }
  };

  // Auto-detect AI when input text changes
  useEffect(() => {
    if (inputText.trim() && inputText.length > 50) {
      const detectTimer = setTimeout(() => {
        detectAIText(inputText, 'input');
      }, 1000); // Debounce for 1 second
      return () => clearTimeout(detectTimer);
    }
  }, [inputText]);

  // Auto-detect AI when output text changes
  useEffect(() => {
    if (outputText.trim() && outputText.length > 50) {
      const detectTimer = setTimeout(() => {
        detectAIText(outputText, 'output');
      }, 1000); // Debounce for 1 second
      return () => clearTimeout(detectTimer);
    }
  }, [outputText]);

  // Handle receiving text from main interface
  useEffect(() => {
    if (inputFromMain) {
      setInputText(inputFromMain);
    }
  }, [inputFromMain]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, isStyleUpload = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (isStyleUpload) {
        setStyleText(result.content);
        // Reset to custom sample when uploading
        setSelectedWritingSample({
          id: 'custom-upload',
          title: `Uploaded: ${file.name}`,
          category: 'content-neutral',
          content: result.content
        });
      } else {
        // Check if content needs chunking
        const wordCount = result.content.split(/\s+/).length;
        if (wordCount > 500) {
          // Content is large, show chunk selection
          setPendingFileContent(result.content);
          
          // Get chunks from server
          const chunkResponse = await fetch('/api/gpt-bypass/chunk-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: result.content })
          });
          
          if (chunkResponse.ok) {
            const chunks = await chunkResponse.json();
            setTextChunks(chunks);
            setShowChunkModal(true);
          } else {
            // Fallback to setting full text
            setInputText(result.content);
          }
        } else {
          setInputText(result.content);
        }
      }
      
      toast({
        title: "File uploaded successfully",
        description: `Processed ${file.name}`,
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    }

    // Reset file input
    event.target.value = '';
  };

  const handleHumanizeAgain = async () => {
    if (!outputText.trim()) {
      toast({
        title: "No output text",
        description: "No humanized text available to further humanize",
        variant: "destructive",
      });
      return;
    }

    // Use the output text as input for further humanization
    const originalInputText = inputText;
    setInputText(outputText);
    
    try {
      await handleRewrite(true);
    } finally {
      // Restore original input text
      setInputText(originalInputText);
    }
  };

  const handleRewrite = async (isReRewrite = false) => {
    if (!inputText.trim()) {
      toast({
        title: "No input text",
        description: "Please enter text to rewrite or upload a file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const selectedPresets = Array.from(selectedInstructionPresets);
      const combinedInstructions = [
        ...selectedPresets.map(id => {
          const preset = INSTRUCTION_PRESETS.find(p => p.id === id);
          return preset ? `${preset.title}: ${preset.description}` : '';
        }).filter(Boolean),
        customInstructions.trim()
      ].filter(Boolean).join('\n\n');

      const response = await fetch('/api/gpt-bypass/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputText,
          styleText,
          provider,
          instructions: combinedInstructions,
          reRewrite: isReRewrite,
          jobId: isReRewrite && currentJob ? currentJob.id : undefined
        })
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`Rewrite failed: ${response.statusText}`);
      }

      const data = await response.json();
      setOutputText(data.rewrittenText);
      setCurrentJob(data);
      
      // Auto-detect AI on the output
      if (data.rewrittenText) {
        detectAIText(data.rewrittenText, 'output');
      }
      
      toast({
        title: "Rewrite completed",
        description: "Text successfully humanized",
      });
    } catch (error) {
      console.error('Rewrite error:', error);
      toast({
        title: "Rewrite failed",
        description: error instanceof Error ? error.message : "Failed to humanize text",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Handle chunk selection
  const handleChunkSelection = (selectedChunks: TextChunk[]) => {
    const combinedText = selectedChunks.map(chunk => chunk.content).join('\n\n');
    setInputText(combinedText);
    setShowChunkModal(false);
  };

  // Handle writing sample selection
  const handleWritingSampleChange = (sampleId: string) => {
    const sample = WRITING_SAMPLES.find(s => s.id === sampleId);
    if (sample) {
      setSelectedWritingSample(sample);
      setStyleText(sample.content);
    }
  };

  // Handle instruction preset toggle
  const handleInstructionPresetToggle = (presetId: string) => {
    setSelectedInstructionPresets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(presetId)) {
        newSet.delete(presetId);
      } else {
        newSet.add(presetId);
      }
      return newSet;
    });
  };

  const detectAIText = async (text: string, type: 'input' | 'output') => {
    if (!text.trim() || text.length < 50) return;

    const setDetecting = type === 'input' ? setIsInputDetecting : setIsOutputDetecting;
    const setResult = type === 'input' ? setInputGptZeroResult : setOutputGptZeroResult;

    setDetecting(true);
    try {
      // Use the same unified detection endpoint as homework mode for consistency
      const response = await fetch('/api/detect-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, llmProvider: provider })
      });

      if (!response.ok) {
        throw new Error(`AI check failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Convert the unified result format to GPTZero result format
      const gptZeroResult: GPTZeroResult = {
        aiScore: Math.round(result.confidence * 100),
        isAI: result.confidence > 0.5,
        confidence: result.confidence
      };
      
      setResult(gptZeroResult);
    } catch (error) {
      console.error('AI detection error:', error);
      // Don't show toast for auto-detection errors to avoid spam
    } finally {
      setDetecting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Text has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadText = async (text: string, filename: string, format: 'txt' | 'pdf' | 'docx') => {
    try {
      if (format === 'txt') {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For PDF and DOCX, use the export API
        const response = await fetch('/api/export-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: text,
            filename,
            format
          })
        });

        if (!response.ok) {
          throw new Error(`Export failed: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Download complete",
        description: `Successfully downloaded ${filename}.${format}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-6 w-6 text-blue-600" />
          <h2 className="text-3xl font-bold">GPT Bypass</h2>
        </div>
        <p className="text-gray-600">
          Transform AI-generated text to appear more human using advanced LLM rewriting techniques
        </p>
      </div>

      {/* Main Interface */}
      <div className="flex flex-col gap-6">
        
        {/* Settings Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AI Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select value={provider} onValueChange={(value: any) => setProvider(value)}>
                <SelectTrigger data-testid="select-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthropic" data-testid="option-zhi-1">ZHI 1 (Default)</SelectItem>
                  <SelectItem value="openai" data-testid="option-zhi-2">ZHI 2</SelectItem>
                  <SelectItem value="deepseek" data-testid="option-zhi-3">ZHI 3</SelectItem>
                  <SelectItem value="perplexity" data-testid="option-zhi-4">ZHI 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        {/* Input Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Input Text
            </CardTitle>
            <CardDescription>
              Enter or upload text to humanize
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Textarea
                  placeholder="Paste your AI-generated text here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[600px] resize-y pr-20 text-base"
                  data-testid="input-text"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(inputText)}
                    disabled={!inputText}
                    data-testid="button-copy-input"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputText('')}
                    disabled={!inputText}
                    data-testid="button-delete-input"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Characters: {inputText.length}</span>
                {isInputDetecting && <span>Detecting AI...</span>}
              </div>
              
              {inputGptZeroResult && (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">AI Detection</span>
                  <Badge variant={inputGptZeroResult.isAI ? "destructive" : "default"}>
                    {inputGptZeroResult.aiScore}%
                  </Badge>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                data-testid="button-upload-file"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".txt,.pdf,.docx,.doc"
                className="hidden"
              />
              
              {outputFromMain && (
                <Button
                  variant="outline"
                  onClick={() => setInputText(outputFromMain)}
                  className="w-full"
                  data-testid="button-get-from-main"
                >
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Get from Main Output
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Style Sample Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Writing Style & Instruction Presets</CardTitle>
            <CardDescription>
              Configure writing style samples and humanization instructions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Instruction Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Instruction Presets</Label>
              <p className="text-xs text-gray-600">
                Presets 1-8 are selected by default for optimal humanization
              </p>
              
              <ScrollArea className="h-64 border rounded p-3">
                <div className="space-y-3">
                  {/* Core Humanization (1-8) */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-600">Core Humanization (Most Important)</h4>
                    {INSTRUCTION_PRESETS.filter(p => p.category === 'core-humanization').map(preset => (
                      <div key={preset.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={preset.id}
                          checked={selectedInstructionPresets.has(preset.id)}
                          onCheckedChange={() => handleInstructionPresetToggle(preset.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={preset.id} className="text-xs font-medium cursor-pointer">
                            {preset.title}
                          </Label>
                          <p className="text-xs text-gray-500 mt-1">
                            {preset.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Other Categories */}
                  {['structure-cadence', 'framing-inference', 'diction-tone', 'concreteness', 'asymmetry', 'formatting', 'safety', 'combo'].map(category => {
                    const presets = INSTRUCTION_PRESETS.filter(p => p.category === category);
                    if (presets.length === 0) return null;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <h4 className="text-sm font-medium capitalize">
                          {category.replace('-', ' & ')}
                        </h4>
                        {presets.map(preset => (
                          <div key={preset.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={preset.id}
                              checked={selectedInstructionPresets.has(preset.id)}
                              onCheckedChange={() => handleInstructionPresetToggle(preset.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <Label htmlFor={preset.id} className="text-xs font-medium cursor-pointer">
                                {preset.title}
                              </Label>
                              <p className="text-xs text-gray-500 mt-1">
                                {preset.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Custom Instructions */}
            <div className="space-y-2">
              <Label>Custom Instructions</Label>
              <Textarea
                placeholder="Add your own custom rewriting instructions..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="min-h-[100px] resize-y text-xs"
                data-testid="input-custom-instructions"
              />
            </div>

            <Separator />
            {/* Writing Sample Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="writing-sample-select">Predefined Writing Samples</Label>
              <Select value={selectedWritingSample.id} onValueChange={handleWritingSampleChange}>
                <SelectTrigger data-testid="select-writing-sample">
                  <SelectValue placeholder="Select a writing sample..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom-upload">Custom Upload</SelectItem>
                  {/* Content-Neutral Samples */}
                  <SelectItem value="content-neutral-header" disabled>
                    — Content-Neutral —
                  </SelectItem>
                  {WRITING_SAMPLES.filter(s => s.category === 'content-neutral').map(sample => (
                    <SelectItem key={sample.id} value={sample.id}>
                      {sample.title}
                    </SelectItem>
                  ))}
                  {/* Epistemology Samples */}
                  <SelectItem value="epistemology-header" disabled>
                    — Epistemology —
                  </SelectItem>
                  {WRITING_SAMPLES.filter(s => s.category === 'epistemology').map(sample => (
                    <SelectItem key={sample.id} value={sample.id}>
                      {sample.title}
                    </SelectItem>
                  ))}
                  {/* Paradoxes Samples */}
                  <SelectItem value="paradoxes-header" disabled>
                    — Paradoxes —
                  </SelectItem>
                  {WRITING_SAMPLES.filter(s => s.category === 'paradoxes').map(sample => (
                    <SelectItem key={sample.id} value={sample.id}>
                      {sample.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload Style Sample Button */}
            <Button
              variant="outline"
              onClick={() => styleFileInputRef.current?.click()}
              className="w-full"
              data-testid="button-upload-style"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Style Sample
            </Button>
            <input
              ref={styleFileInputRef}
              type="file"
              onChange={(e) => handleFileUpload(e, true)}
              accept=".txt,.pdf,.docx,.doc"
              className="hidden"
            />

            {/* Style Text Area */}
            <div className="relative">
              <Textarea
                placeholder="Enter a sample of your writing style..."
                value={styleText}
                onChange={(e) => setStyleText(e.target.value)}
                className="min-h-[600px] resize-y pr-20 text-base"
                data-testid="input-style-text"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(styleText)}
                  disabled={!styleText}
                  data-testid="button-copy-style"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStyleText('')}
                  disabled={!styleText}
                  data-testid="button-delete-style"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Characters: {styleText.length}
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Humanized Output
            </CardTitle>
            <CardDescription>
              Your rewritten, human-like text
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Textarea
                  value={outputText}
                  onChange={(e) => setOutputText(e.target.value)}
                  className="min-h-[600px] resize-y pr-20 text-base"
                  placeholder="Rewritten text will appear here..."
                  data-testid="output-text"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(outputText)}
                    disabled={!outputText}
                    data-testid="button-copy-output-top"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOutputText('')}
                    disabled={!outputText}
                    data-testid="button-delete-output"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Characters: {outputText.length}</span>
                {isOutputDetecting && <span>Detecting AI...</span>}
              </div>
            </div>

            {outputGptZeroResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">AI Detection</span>
                  <Badge variant={outputGptZeroResult.isAI ? "destructive" : "default"}>
                    {outputGptZeroResult.aiScore}%
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  Status: {outputGptZeroResult.isAI ? 'Detected as AI' : 'Appears Human'}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(outputText)}
                disabled={!outputText}
                data-testid="button-copy-output"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              
              {onSendToInput && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSendToInput(outputText)}
                  disabled={!outputText}
                  data-testid="button-send-to-main"
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  Send to Main
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadText(outputText, 'humanized-text', 'txt')}
                disabled={!outputText}
                data-testid="button-download-txt"
              >
                <FileDown className="h-4 w-4 mr-1" />
                TXT
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadText(outputText, 'humanized-text', 'pdf')}
                disabled={!outputText}
                data-testid="button-download-pdf"
              >
                <FileDown className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadText(outputText, 'humanized-text', 'docx')}
                disabled={!outputText}
                data-testid="button-download-docx"
              >
                <FileDown className="h-4 w-4 mr-1" />
                DOCX
              </Button>
            </div>

            {/* Humanize Again Button */}
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() => handleHumanizeAgain()}
                disabled={isProcessing || !outputText.trim()}
                className="px-6"
                data-testid="button-humanize-again"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin">⚡</span>
                    <span className="ml-2">Processing...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Humanize Again
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => handleRewrite()}
          disabled={isProcessing || !inputText.trim()}
          size="lg"
          className="px-8"
          data-testid="button-rewrite"
        >
          {isProcessing ? (
            <>
              <span className="animate-spin">⚡</span>
              <span className="ml-2">Processing...</span>
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Humanize Text
            </>
          )}
        </Button>

        {inputText && (
          <Button
            variant="outline"
            onClick={() => detectAIText(inputText, 'input')}
            disabled={isInputDetecting}
            size="lg"
            data-testid="button-check-input-ai"
          >
            <Scan className="h-5 w-5 mr-2" />
            Check AI Score
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Chunk Selection Modal */}
      <ChunkSelectionModal
        isOpen={showChunkModal}
        onClose={() => setShowChunkModal(false)}
        chunks={textChunks}
        onConfirm={handleChunkSelection}
      />
    </div>
  );
}