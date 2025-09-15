"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Volume2, ImageIcon, Send, Settings, RefreshCw, Zap, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import ManualAnkiForm from "@/components/ManualAnkiForm";

interface WordDefinition {
  word: string;
  phonetic?: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
    }>;
  }>;
}

interface Settings {
  deckName: string;
}

const DEFAULT_SETTINGS: Settings = {
  deckName: "English Vocabulary",
};

export default function AnkiVocabularyApp() {
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [currentDomain, setCurrentDomain] = useState("");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [imageQuery, setImageQuery] = useState("");
  const [showImageQueryInput, setShowImageQueryInput] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [autoProcessing, setAutoProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentDomain(window.location.origin);

      // Load settings from localStorage
      const savedSettings = localStorage.getItem("ankiPocketSettings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch (error) {
          console.error("Settings loading error:", error);
        }
      }
    }
  }, []);

  const fetchDefinition = async () => {
    if (!word.trim()) return;

    setLoading(true);
    try {
      // Determine if it's a phrase (contains spaces or multiple words)
      const isPhrase = word.trim().includes(' ') || word.trim().split(/\s+/).length > 1;
      console.log('Input:', word, 'isPhrase:', isPhrase, 'split length:', word.trim().split(/\s+/).length);

      if (isPhrase) {
        // For phrases, use translation API
        console.log('Calling translation API for phrase:', word);
        const response = await fetch(
          `/api/translate?text=${encodeURIComponent(word)}&from=en&to=ja`
        );

        console.log('Translation API response status:', response.status);
        if (!response.ok) {
          console.error('Translation API failed:', response.status, response.statusText);
          throw new Error(`Translation failed (${response.status})`);
        }

        const data = await response.json();
        console.log('Translation API response data:', data);

        if (!data.success) {
          console.error('Translation API returned error:', data.error);
          throw new Error(data.error || "Translation failed");
        }

        setTranslatedText(data.translatedText);
        setDefinition(null); // Clear dictionary results
        console.log('Translation result:', data.translatedText);
        toast({
          title: "Translation complete (Phrase mode)",
          description: `"${word}" → "${data.translatedText}"`,
        });
      } else {
        // For words, use dictionary API
        console.log('Calling dictionary API for word:', word);
        const response = await fetch(
          `/api/dictionary?word=${encodeURIComponent(word)}`
        );

        console.log('Dictionary API response status:', response.status);
        if (!response.ok) {
          console.error('Dictionary API failed:', response.status, response.statusText);
          throw new Error(`Word not found (${response.status})`);
        }

        const data = await response.json();
        console.log('Dictionary API response data:', data);
        setDefinition(data.definitions[0]);
        setTranslatedText(""); // Clear translation results
        console.log('Dictionary result:', data.definitions[0]);

        toast({
          title: "Search complete (Word mode)",
          description: `Retrieved dictionary definition for "${word}"`,
        });
      }
    } catch (error) {
      console.error('fetchDefinition error:', error);
      toast({
        title: "Error",
        description: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const generateImage = async (customQuery?: string) => {
    // Debug log - check individual values
    console.log('generateImage called - individual values:', {
      customQuery: { value: customQuery, type: typeof customQuery },
      imageQuery: { value: imageQuery, type: typeof imageQuery },
      word: { value: word, type: typeof word }
    });

    const queryToUse = customQuery || imageQuery || word;

    console.log('generateImage - queryToUse details:', {
      queryToUse,
      queryToUseType: typeof queryToUse,
      isString: typeof queryToUse === 'string',
      hasValue: !!queryToUse,
      canTrim: queryToUse && typeof queryToUse === 'string',
      trimmedValue: (queryToUse && typeof queryToUse === 'string') ? queryToUse.trim() : 'CANNOT_TRIM'
    });

    if (!queryToUse || typeof queryToUse !== 'string' || !queryToUse.trim()) {
      console.error('Invalid queryToUse detected:', {
        queryToUse,
        typeCheck: typeof queryToUse,
        truthyCheck: !!queryToUse
      });

      toast({
        title: "Image generation error",
        description: "Invalid search keyword. Please enter a word before generating an image.",
        variant: "destructive",
      });
      return;
    }

    setImageLoading(true);
    try {
      // Use API Route to get Unsplash images
      const response = await fetch(
        `/api/unsplash?query=${encodeURIComponent(queryToUse)}`
      );

      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.imageUrl);

        // Initialize imageQuery on first generation
        if (!imageQuery) {
          setImageQuery(queryToUse);
        }

        if (data.source === "unsplash") {
          toast({
            title: "Image retrieved successfully",
            description: `Retrieved image for "${queryToUse}"!`,
          });
        } else {
          toast({
            title: "Image generated",
            description: "Displaying random image.",
          });
        }
        return;
      }

      // Fallback: random image
      setImageUrl(`https://picsum.photos/300/200?random=${Date.now()}`);
      toast({
        title: "Image generated",
        description: "Displaying random image.",
      });
    } catch (error) {
      setImageUrl(`https://picsum.photos/300/200?random=${Date.now()}`);
      toast({
        title: "Image generation error",
        description: "Displaying random image.",
        variant: "destructive",
      });
    } finally {
      setImageLoading(false);
    }
  };

  const handleImageRegenerate = () => {
    setShowImageQueryInput(true);
  };

  const handleImageRegenerateSubmit = async () => {
    if (!imageQuery.trim()) {
      toast({
        title: "Input error",
        description: "Please enter a search keyword.",
        variant: "destructive",
      });
      return;
    }

    await generateImage(imageQuery);
    setShowImageQueryInput(false);
  };

  const handleImageRegenerateCancel = () => {
    setShowImageQueryInput(false);
    // Return to original search query
    setImageQuery(word);
  };

  const autoProcessAndSend = async () => {
    if (!word.trim()) return;

    setAutoProcessing(true);
    try {
      const response = await fetch("/api/auto-anki", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: word.trim(),
          deckName: settings.deckName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Auto processing failed");
      }

      if (result.success) {
        // Apply results to screen
        if (result.type === "word") {
          setDefinition(result.definition);
          setTranslatedText("");
        } else if (result.type === "phrase") {
          setTranslatedText(result.translatedText);
          setDefinition(null);
        }

        if (result.imageUrl) {
          setImageUrl(result.imageUrl);
          setImageQuery(word);
        }

        toast({
          title: "Auto processing complete!",
          description: `Automatically processed "${word}" and sent to Anki!`,
        });

        // Reset
        setWord("");
        setDefinition(null);
        setImageUrl("");
        setTranslatedText("");
      } else {
        throw new Error(result.error || "Auto processing failed");
      }
    } catch (error) {
      console.error("Auto process error:", error);
      toast({
        title: "Auto processing error",
        description: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setAutoProcessing(false);
    }
  };

  const sendToAnki = async () => {
    if (!definition) return;

    try {
      let imageFileName = "";
      if (imageUrl) {
        try {
          // Fetch image and convert to blob
          const imageResponse = await fetch(imageUrl);
          const imageBlob = await imageResponse.blob();

          // Convert blob to base64
          const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              // Remove data:image/jpeg;base64, part
              resolve(base64.split(",")[1]);
            };
            reader.readAsDataURL(imageBlob);
          });

          // Generate filename (word + timestamp)
          const timestamp = Date.now();
          const extension =
            imageUrl.includes(".jpg") || imageUrl.includes(".jpeg")
              ? "jpg"
              : "png";
          imageFileName = `${word}_${timestamp}.${extension}`;

          // Save image using AnkiConnect's storeMediaFile action
          const storeMediaResponse = await fetch("http://127.0.0.1:8765", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "storeMediaFile",
              version: 6,
              params: {
                filename: imageFileName,
                data: base64Data,
              },
            }),
          });

          const storeMediaResult = await storeMediaResponse.json();
          if (storeMediaResult.error) {
            console.log(`Image save error: ${storeMediaResult.error}`);
            imageFileName = ""; // Continue without image if error
          } else {
            console.log(`Image save successful: ${imageFileName}`);
          }
        } catch (imageError) {
          console.log(`Image processing error: ${imageError}`);
          imageFileName = ""; // Continue without image if error
        }
      }

      const modelNamesResponse = await fetch("http://127.0.0.1:8765", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "modelNames",
          version: 6,
        }),
      });

      if (!modelNamesResponse.ok) {
        throw new Error("Cannot connect to AnkiConnect");
      }

      const modelNamesResult = await modelNamesResponse.json();

      if (modelNamesResult.error) {
        throw new Error(modelNamesResult.error);
      }

      const availableModels = modelNamesResult.result;
      console.log(`Available note types:`, availableModels);

      if (!availableModels || availableModels.length === 0) {
        throw new Error("No available note types found");
      }

      const modelName = availableModels[0];
      console.log(`Using note type: ${modelName}`);

      const modelFieldsResponse = await fetch("http://127.0.0.1:8765", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "modelFieldNames",
          version: 6,
          params: {
            modelName: modelName,
          },
        }),
      });

      const modelFieldsResult = await modelFieldsResponse.json();
      const fieldNames = modelFieldsResult.result || ["Front", "Back"];
      console.log(`Available fields:`, fieldNames);

      const fields: Record<string, string> = {};

      if (fieldNames.includes("Sentence") || fieldNames.includes("センテンス")) {
        const fieldKey = fieldNames.includes("Sentence") ? "Sentence" : "センテンス";
        fields[fieldKey] = `
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
            <div style="font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">
              ${word}
            </div>
            ${definition.phonetic ? `
              <div style="font-size: 18px; color: #6b7280; font-family: monospace; margin-bottom: 15px;">
                /${definition.phonetic}/
              </div>
            ` : ''}
          </div>
        `;
      } else {
        fields[fieldNames[0]] = `
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
            <div style="font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">
              ${word}
            </div>
            ${definition.phonetic ? `
              <div style="font-size: 18px; color: #6b7280; font-family: monospace; margin-bottom: 15px;">
                /${definition.phonetic}/
              </div>
            ` : ''}
          </div>
        `;
      }

      if (fieldNames.includes("Meaning") || fieldNames.includes("日本語の意味")) {
        const fieldKey = fieldNames.includes("Meaning") ? "Meaning" : "日本語の意味";
        fields[fieldKey] = `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
            ${definition.meanings
              .filter((meaning) => {
                const commonParts = ['noun', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'];
                const isCommonVerb = meaning.partOfSpeech === 'verb' &&
                  meaning.definitions.some(def =>
                    def.definition.length > 30 &&
                    !def.definition.toLowerCase().includes('to become') &&
                    !def.definition.toLowerCase().includes('to form')
                  );
                return commonParts.includes(meaning.partOfSpeech) || isCommonVerb;
              })
              .map((meaning) => `
                <div style="margin-bottom: 20px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px;">
                  <div style="font-weight: bold; color: #3b82f6; font-size: 16px; margin-bottom: 8px;">
                    ${meaning.partOfSpeech}
                  </div>
                  <div style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">
                    ${meaning.definitions[0].definition}
                  </div>
                  ${meaning.definitions[0].example ? `
                    <div style="font-style: italic; color: #6b7280; font-size: 16px; padding: 10px; background-color: #e0f2fe; border-radius: 4px; border-left: 3px solid #0ea5e9;">
                      <strong>Example:</strong> "${meaning.definitions[0].example}"
                    </div>
                  ` : ''}
                </div>
              `).join('')}
          </div>
        `;
      }

      if ((fieldNames.includes("Image") || fieldNames.includes("画像")) && imageFileName) {
        const fieldKey = fieldNames.includes("Image") ? "Image" : "画像";
        fields[fieldKey] = `
          <div style="text-align: center; padding: 20px;">
            <img src="${imageFileName}" style="max-width: 400px; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          </div>
        `;
      }

      if (fieldNames.includes("Etymology") || fieldNames.includes("語源")) {
        const fieldKey = fieldNames.includes("Etymology") ? "Etymology" : "語源";
        fields[fieldKey] = "";
      }

      // Fallback: basic field configuration
      if (
        !fieldNames.includes("Sentence") && !fieldNames.includes("センテンス") &&
        !fieldNames.includes("Meaning") && !fieldNames.includes("日本語の意味")
      ) {
        fields[fieldNames[0]] = `
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
            <div style="font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">
              ${word}
            </div>
            ${definition.phonetic ? `
              <div style="font-size: 18px; color: #6b7280; font-family: monospace; margin-bottom: 15px;">
                /${definition.phonetic}/
              </div>
            ` : ''}
          </div>
        `;

        fields[fieldNames[1] || fieldNames[0]] = `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
            ${definition.meanings
              .filter((meaning) => {
                const commonParts = ['noun', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'];
                const isCommonVerb = meaning.partOfSpeech === 'verb' &&
                  meaning.definitions.some(def =>
                    def.definition.length > 30 &&
                    !def.definition.toLowerCase().includes('to become') &&
                    !def.definition.toLowerCase().includes('to form')
                  );
                return commonParts.includes(meaning.partOfSpeech) || isCommonVerb;
              })
              .map((meaning) => `
                <div style="margin-bottom: 20px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px;">
                  <div style="font-weight: bold; color: #3b82f6; font-size: 16px; margin-bottom: 8px;">
                    ${meaning.partOfSpeech}
                  </div>
                  <div style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">
                    ${meaning.definitions[0].definition}
                  </div>
                  ${meaning.definitions[0].example ? `
                    <div style="font-style: italic; color: #6b7280; font-size: 16px; padding: 10px; background-color: #e0f2fe; border-radius: 4px; border-left: 3px solid #0ea5e9;">
                      <strong>Example:</strong> "${meaning.definitions[0].example}"
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            ${imageFileName ? `
              <div style="text-align: center; padding: 20px; margin-top: 20px;">
                <img src="${imageFileName}" style="max-width: 400px; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              </div>
            ` : ""}
          </div>
        `;
      }

      const ankiNote = {
        action: "addNote",
        version: 6,
        params: {
          note: {
            deckName: settings.deckName,
            modelName: modelName,
            fields: fields,
            tags: ["vocabulary", "english", "auto-generated"],
          },
        },
      };

      const response = await fetch("http://127.0.0.1:8765", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ankiNote),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Success!",
        description: `Added word "${word}" to Anki!${
          imageFileName ? " (with image)" : ""
        }`,
      });

      // Reset
      setWord("");
      setDefinition(null);
      setImageUrl("");
      setTranslatedText("");
    } catch (error) {
      console.error("Anki sending error details:", error);

      let errorTitle = "Anki sending error";
      let errorDescription = "";

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // For HTTP errors
        if (errorMessage.includes("http")) {
          const statusMatch = error.message.match(/HTTP (\d+):/);
          const status = statusMatch ? parseInt(statusMatch[1]) : null;

          switch (status) {
            case 0:
            case null:
              errorTitle = "Connection error";
              errorDescription = `Cannot connect to AnkiConnect.

【Checklist】
• Please ensure the Anki app is running
• Please ensure AnkiConnect addon (2055492159) is installed
• Please ensure AnkiConnect is enabled in Anki's "Tools" → "Add-ons"

【Error Details】${error.message}`;
              break;
            case 404:
              errorTitle = "AnkiConnect not detected";
              errorDescription = `AnkiConnect not found.

【Checklist】
• Please install AnkiConnect addon (2055492159)
• Please restart Anki

【Error Details】${error.message}`;
              break;
            case 403:
              errorTitle = "CORS configuration error";
              errorDescription = `CORS configuration is incorrect.

【Setup Steps】
1. Open Anki's "Tools" → "Add-ons"
2. Select AnkiConnect and click "Config"
3. Add "${currentDomain}" to "webCorsOriginList"
4. Restart Anki

【Error Details】${error.message}`;
              break;
            case 500:
              errorTitle = "Anki internal error";
              errorDescription = `An error occurred on Anki's side.

【Checklist】
• Please check if the deck name "${settings.deckName}" is valid
• Please check if Anki's note type is correctly configured

【Error Details】${error.message}`;
              break;
            default:
              errorDescription = `HTTP ${status} error occurred.

【Error Details】${error.message}

【Checklist】
• Please ensure the Anki app is running
• Please ensure AnkiConnect addon is working correctly`;
          }
        }
        // AnkiConnect API specific errors
        else if (errorMessage.includes("cannot create note because it is a duplicate")) {
          errorTitle = "Duplicate error";
          errorDescription = `"${word}" already exists in Anki.

【Solutions】
• Please check existing cards
• Please enter a different word
• Please delete duplicate cards in Anki and try again`;
        }
        else if (errorMessage.includes("deck was not found")) {
          errorTitle = "Deck error";
          errorDescription = `Deck "${settings.deckName}" not found.

【Solutions】
• Please create the deck in Anki
• Please enter the correct deck name in settings
• Please check if the deck name capitalization is correct

【Error Details】${error.message}`;
        }
        else if (errorMessage.includes("model was not found")) {
          errorTitle = "Note type error";
          errorDescription = `Note type not found.

【Solutions】
• Please ensure appropriate note types exist in Anki
• Try using "Basic" or "Basic (and reversed card)" note types

【Error Details】${error.message}`;
        }
        else {
          errorDescription = `An unexpected error occurred.

【Error Details】${error.message}

【Basic Checklist】
• Is the Anki app running?
• Is the AnkiConnect addon installed?
• Is the CORS configuration correct?`;
        }
      } else {
        errorDescription = `An unknown error occurred.

【Error Details】${String(error)}

【Checklist】
• Please ensure the Anki app is running
• Please ensure AnkiConnect addon is correctly installed`;
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-blue-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  AnkiPocket
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Smart vocabulary learning
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/setup">
                <Button variant="outline" size="icon" title="AnkiConnect Setup Guide">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" size="icon" title="Settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center py-6">
          <h2 className="text-lg text-gray-700 dark:text-gray-300">
            Enter English words or sentences to retrieve meanings, translations, generate images and send to Anki
          </h2>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            ✨ New feature: "Auto process and send to Anki" button automates all processing!
          </p>
          {currentDomain && (
            <div className="inline-block text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded border border-blue-200 dark:border-blue-800 mt-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="font-medium">AnkiConnect Configuration Check</span>
                <Link href="/setup">
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    Setup Guide
                  </Button>
                </Link>
              </div>
              <p className="mt-2">
                <strong>Current Domain:</strong> {currentDomain}<br />
                <strong>CORS Setting:</strong> Add "{currentDomain}" to webCorsOriginList
              </p>
            </div>
          )}
        </div>

        {/* Word Input Card */}
        <Card className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-blue-600 dark:text-blue-400">
              Enter Word or Sentence
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Please enter English words or sentences you want to learn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <Input
                  placeholder="e.g., beautiful or it is a piece of cake"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && fetchDefinition()}
                  className="flex-1 h-11 border-blue-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-400"
                />
                <Button
                  onClick={fetchDefinition}
                  disabled={loading || !word.trim()}
                  className="h-11 px-6 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Search & Translate"
                  )}
                </Button>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={autoProcessAndSend}
                  disabled={autoProcessing || !word.trim()}
                  className="h-12 px-8 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold"
                  size="lg"
                >
                  {autoProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Auto processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Auto process and send to Anki
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {translatedText && (
          <Card className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700">
            <CardHeader>
              <CardTitle className="text-xl text-green-600 dark:text-green-400">
                Translation Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 rounded bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Original:</p>
                  <p className="text-gray-800 dark:text-gray-200 mb-3">{word}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Translation:</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">{translatedText}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {definition && (
          <Card className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {definition.word}
                </span>
                {definition.phonetic && (
                  <Badge variant="secondary" className="font-mono text-sm">
                    <Volume2 className="h-3 w-3 mr-1" />
                    {definition.phonetic}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {definition.meanings
                .filter((meaning) => {
                  // Display only main parts of speech (exclude rare verb usages)
                  const commonParts = ['noun', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'];
                  const isCommonVerb = meaning.partOfSpeech === 'verb' &&
                    meaning.definitions.some(def =>
                      def.definition.length > 30 && // Definitions that are too short might be rare usages
                      !def.definition.toLowerCase().includes('to become') && // Exclude rare usages like "To become X-like"
                      !def.definition.toLowerCase().includes('to form') // Exclude rare usages like "To form X"
                    );
                  return commonParts.includes(meaning.partOfSpeech) || isCommonVerb;
                })
                .map((meaning, index) => (
                <div key={index} className="space-y-3 p-4 rounded bg-blue-50 dark:bg-gray-700/50 border border-blue-100 dark:border-gray-600">
                  <Badge variant="outline" className="text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600">
                    {meaning.partOfSpeech}
                  </Badge>
                  <p className="text-gray-800 dark:text-gray-200">
                    {meaning.definitions[0].definition}
                  </p>
                  {meaning.definitions[0].example && (
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded border-l-4 border-blue-400">
                      <p className="text-blue-800 dark:text-blue-200 italic text-sm">
                        Example: "{meaning.definitions[0].example}"
                      </p>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => generateImage(word)}
                  disabled={imageLoading}
                  className="flex-1 h-11 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  {imageLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating image...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Generate Image
                    </>
                  )}
                </Button>
                <Button
                  onClick={sendToAnki}
                  disabled={!definition}
                  className="flex-1 h-11 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to Anki
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {imageUrl && (
          <Card className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700">
            <CardHeader className="text-center">
              <CardTitle className="text-lg text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                Generated Image
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImageRegenerate}
                  disabled={imageLoading}
                  className="h-8 px-3 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span className="ml-1 text-xs">Regenerate</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {showImageQueryInput && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Image Search Keywords
                      </label>
                      <Input
                        placeholder="e.g., red apple, sunset landscape..."
                        value={imageQuery}
                        onChange={(e) => setImageQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleImageRegenerateSubmit()}
                        className="mt-1 border-blue-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-400"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Current: Searching for "{imageQuery || word}"
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleImageRegenerateSubmit}
                        disabled={imageLoading || !imageQuery.trim()}
                        className="flex-1 h-9 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                      >
                        {imageLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Generate Image
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleImageRegenerateCancel}
                        disabled={imageLoading}
                        className="h-9 px-4 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt={imageQuery || word}
                  className="w-full max-w-md mx-auto rounded border border-blue-200 dark:border-gray-600"
                  crossOrigin="anonymous"
                />

                {imageLoading && (
                  <div className="text-center">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Generating image for "{imageQuery || word}"...
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Input Form */}
        <ManualAnkiForm settings={settings} />
      </div>
    </div>
  );
}
