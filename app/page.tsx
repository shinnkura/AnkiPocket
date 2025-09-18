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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Volume2, ImageIcon, Send, Settings, RefreshCw, Zap, HelpCircle, BookOpen, Moon, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
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

interface CambridgeDefinition {
  word: string;
  definition: string;
}

interface Settings {
  deckName: string;
  dictionarySource: 'default' | 'cambridge';
}

const DEFAULT_SETTINGS: Settings = {
  deckName: "English Vocabulary",
  dictionarySource: 'default',
};

export default function AnkiVocabularyApp() {
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [cambridgeDefinition, setCambridgeDefinition] = useState<CambridgeDefinition | null>(null);
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
  const { theme, setTheme } = useTheme();

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
        // For words, use dictionary API based on settings
        const apiEndpoint = settings.dictionarySource === 'cambridge'
          ? `/api/cambridge-dictionary?word=${encodeURIComponent(word)}`
          : `/api/dictionary?word=${encodeURIComponent(word)}`;

        console.log('Calling dictionary API for word:', word, 'using source:', settings.dictionarySource);
        const response = await fetch(apiEndpoint);

        console.log('Dictionary API response status:', response.status);
        if (!response.ok) {
          console.error('Dictionary API failed:', response.status, response.statusText);
          throw new Error(`Word not found (${response.status})`);
        }

        const data = await response.json();
        console.log('Dictionary API response data:', data);

        if (settings.dictionarySource === 'cambridge') {
          setCambridgeDefinition(data);
          setDefinition(null);
          console.log('Cambridge dictionary result:', data);

          toast({
            title: "Search complete (Cambridge Dictionary)",
            description: `Retrieved definition for "${word}"`,
          });
        } else {
          setDefinition(data.definitions[0]);
          setCambridgeDefinition(null);
          console.log('Default dictionary result:', data.definitions[0]);

          toast({
            title: "Search complete (Word mode)",
            description: `Retrieved dictionary definition for "${word}"`,
          });
        }

        setTranslatedText(""); // Clear translation results
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
        setCambridgeDefinition(null);
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
      setCambridgeDefinition(null);
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

  const sendCambridgeToAnki = async () => {
    if (!cambridgeDefinition) return;

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
            <div style="font-size: 28px; font-weight: bold; color: #16a34a; margin-bottom: 10px;">
              ${cambridgeDefinition.word}
            </div>
            <div style="font-size: 14px; color: #059669; margin-bottom: 15px; font-weight: 500;">
              Cambridge Dictionary
            </div>
          </div>
        `;
      } else {
        fields[fieldNames[0]] = `
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
            <div style="font-size: 28px; font-weight: bold; color: #16a34a; margin-bottom: 10px;">
              ${cambridgeDefinition.word}
            </div>
            <div style="font-size: 14px; color: #059669; margin-bottom: 15px; font-weight: 500;">
              Cambridge Dictionary
            </div>
          </div>
        `;
      }

      if (fieldNames.includes("Meaning") || fieldNames.includes("日本語の意味")) {
        const fieldKey = fieldNames.includes("Meaning") ? "Meaning" : "日本語の意味";
        fields[fieldKey] = `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
            <div style="margin-bottom: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 6px;">
              <div style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">
                ${cambridgeDefinition.definition}
              </div>
            </div>
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
            <div style="font-size: 28px; font-weight: bold; color: #16a34a; margin-bottom: 10px;">
              ${cambridgeDefinition.word}
            </div>
            <div style="font-size: 14px; color: #059669; margin-bottom: 15px; font-weight: 500;">
              Cambridge Dictionary
            </div>
          </div>
        `;

        fields[fieldNames[1] || fieldNames[0]] = `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
            <div style="margin-bottom: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 6px;">
              <div style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">
                ${cambridgeDefinition.definition}
              </div>
            </div>
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
            tags: ["vocabulary", "english", "cambridge", "auto-generated"],
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
        description: `Added word "${word}" from Cambridge Dictionary to Anki!${
          imageFileName ? " (with image)" : ""
        }`,
      });

      // Reset
      setWord("");
      setCambridgeDefinition(null);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 dark:backdrop-blur-sm border-b border-blue-200/60 dark:border-gray-700/60 shadow-sm dark:shadow-gray-900/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  AnkiPocket
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  ✨ Smart vocabulary learning
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-all duration-200"
                title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-blue-600" />
                )}
              </Button>
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
          <h2 className="text-lg text-gray-800 dark:text-gray-100 leading-relaxed">
            🎯 英単語や英文を入力して、意味・翻訳・画像を取得し、Ankiに送信
          </h2>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            ✨ 新機能：「Auto process」ボタンで辞書検索からAnki送信まで一括実行！
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
        <Card className="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 dark:backdrop-blur-sm border border-blue-200/60 dark:border-gray-600/60 shadow-xl dark:shadow-2xl dark:shadow-gray-900/30">
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
              {/* Mobile: Stacked layout, Desktop: Horizontal layout */}
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="e.g., beautiful or it is a piece of cake"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchDefinition()}
                    className="h-12 text-base border-blue-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="min-w-0 flex-1 lg:w-48">
                    <Select
                      value={settings.dictionarySource}
                      onValueChange={(value: 'default' | 'cambridge') =>
                        setSettings(prev => ({ ...prev, dictionarySource: value }))
                      }
                    >
                      <SelectTrigger className="h-12 border-blue-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Default Dictionary</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cambridge">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Cambridge Dictionary</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={fetchDefinition}
                    disabled={loading || !word.trim()}
                    className="h-12 px-6 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <span className="hidden sm:inline">Search & Translate</span>
                        <span className="sm:hidden">Search</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                    または
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <Button
                  onClick={autoProcessAndSend}
                  disabled={autoProcessing || !word.trim()}
                  className="w-full sm:w-auto h-12 px-8 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 dark:from-green-600 dark:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  size="lg"
                >
                  {autoProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span className="hidden sm:inline">Auto processing...</span>
                      <span className="sm:hidden">Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      <span className="hidden sm:inline">Auto process and send to Anki</span>
                      <span className="sm:hidden">Auto process</span>
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
                  ✨ 辞書検索・画像生成・Anki送信をワンクリックで実行
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {translatedText && (
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:via-teal-900/15 dark:to-cyan-900/20 border border-emerald-200/60 dark:border-emerald-600/60 shadow-xl dark:shadow-2xl dark:shadow-emerald-900/20 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-800/20 rounded-lg">
                  <Volume2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">翻訳結果</span>
                <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600 bg-white/50 dark:bg-emerald-800/20">
                  <span className="font-semibold">Phrase Mode</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-white/70 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-1 h-12 bg-gray-500 rounded-full flex-shrink-0 mt-1"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">原文 (English)</p>
                        <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">{word}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-white/70 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-1 h-12 bg-emerald-500 rounded-full flex-shrink-0 mt-1"></div>
                      <div>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">翻訳 (Japanese)</p>
                        <p className="text-gray-800 dark:text-gray-200 font-medium text-lg leading-relaxed">{translatedText}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {definition && (
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:via-indigo-900/15 dark:to-purple-900/20 border border-blue-200/60 dark:border-blue-600/60 shadow-xl dark:shadow-2xl dark:shadow-blue-900/20 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-3 text-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800/20 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-blue-700 dark:text-blue-300 font-bold">
                    {definition.word}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {definition.phonetic && (
                    <Badge variant="secondary" className="font-mono text-sm bg-blue-100 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300">
                      <Volume2 className="h-3 w-3 mr-1" />
                      {definition.phonetic}
                    </Badge>
                  )}
                  <Badge variant="outline" className="w-fit text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 bg-white/50 dark:bg-blue-800/20">
                    <span className="font-semibold">Default Dictionary</span>
                  </Badge>
                </div>
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
                <div key={index} className="p-5 rounded-xl bg-white/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-16 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                    <div className="flex-1">
                      <Badge variant="outline" className="text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 mb-3">
                        {meaning.partOfSpeech}
                      </Badge>
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-lg mb-3">
                        {meaning.definitions[0].definition}
                      </p>
                      {meaning.definitions[0].example && (
                        <div className="bg-blue-100/70 dark:bg-blue-900/30 p-4 rounded-lg border-l-4 border-blue-400">
                          <p className="text-blue-800 dark:text-blue-200 italic">
                            <span className="font-medium">例:</span> "{meaning.definitions[0].example}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => generateImage(word)}
                  disabled={imageLoading}
                  className="flex-1 h-12 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-600 dark:hover:bg-blue-700/20 transition-all duration-200"
                >
                  {imageLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="hidden sm:inline">Generating image...</span>
                      <span className="sm:hidden">Generating...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Generate Image</span>
                      <span className="sm:hidden">Image</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={sendToAnki}
                  disabled={!definition}
                  className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Send className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Send to Anki</span>
                  <span className="sm:hidden">Send</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {cambridgeDefinition && (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:via-emerald-900/15 dark:to-teal-900/20 border border-green-200/60 dark:border-green-600/60 shadow-xl dark:shadow-2xl dark:shadow-green-900/20 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-3 text-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-800/20 rounded-lg">
                    <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-green-700 dark:text-green-300 font-bold">
                    {cambridgeDefinition.word}
                  </span>
                </div>
                <Badge variant="outline" className="w-fit text-green-700 dark:text-green-300 border-green-300 dark:border-green-600 bg-white/50 dark:bg-green-800/20">
                  <span className="font-semibold">Cambridge Dictionary</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-5 rounded-xl bg-white/70 dark:bg-green-900/20 border border-green-100 dark:border-green-800 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-1 h-16 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">定義</p>
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-lg">
                      {cambridgeDefinition.definition}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => generateImage(word)}
                  disabled={imageLoading}
                  className="flex-1 h-12 border-green-200 hover:border-green-300 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-900/20 transition-all duration-200"
                >
                  {imageLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="hidden sm:inline">Generating image...</span>
                      <span className="sm:hidden">Generating...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Generate Image</span>
                      <span className="sm:hidden">Image</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => sendCambridgeToAnki()}
                  disabled={!cambridgeDefinition}
                  className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 dark:from-green-600 dark:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Send className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Send to Anki</span>
                  <span className="sm:hidden">Send</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {imageUrl && (
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:via-pink-900/15 dark:to-violet-900/20 border border-purple-200/60 dark:border-purple-600/60 shadow-xl dark:shadow-2xl dark:shadow-purple-900/20 backdrop-blur-sm">
            <CardHeader className="text-center pb-3">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 text-lg">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <div className="p-2 bg-purple-100 dark:bg-purple-800/20 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-purple-700 dark:text-purple-300 font-bold">生成された画像</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImageRegenerate}
                  disabled={imageLoading}
                  className="h-8 px-3 border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:border-purple-600 dark:hover:bg-purple-700/20 transition-all duration-200"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span className="ml-1 text-xs">再生成</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {showImageQueryInput && (
                  <div className="p-4 rounded-xl bg-white/70 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 shadow-sm space-y-3">
                    <div>
                      <label className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2 block">
                        🔍 画像検索キーワード
                      </label>
                      <Input
                        placeholder="例: red apple, sunset landscape, cute cat..."
                        value={imageQuery}
                        onChange={(e) => setImageQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleImageRegenerateSubmit()}
                        className="border-purple-200 dark:border-purple-600 focus:border-purple-400 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/20"
                      />
                      <p className="text-xs text-purple-500 dark:text-purple-400 mt-2">
                        💡 現在の検索: "<span className="font-medium">{imageQuery || word}</span>"
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={handleImageRegenerateSubmit}
                        disabled={imageLoading || !imageQuery.trim()}
                        className="flex-1 h-10 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 dark:from-purple-600 dark:to-pink-600 dark:hover:from-purple-700 dark:hover:to-pink-700 transition-all duration-200"
                      >
                        {imageLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="hidden sm:inline">画像生成中...</span>
                            <span className="sm:hidden">生成中...</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">画像を生成</span>
                            <span className="sm:hidden">生成</span>
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleImageRegenerateCancel}
                        disabled={imageLoading}
                        className="h-10 px-4 border-purple-300 hover:bg-purple-50 dark:border-purple-600 dark:hover:bg-purple-700/20 transition-all duration-200"
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <div className="inline-block p-3 rounded-xl bg-white/90 dark:bg-gray-800/60 border border-purple-100/60 dark:border-purple-700/60 shadow-lg dark:shadow-xl dark:shadow-purple-900/30 backdrop-blur-sm">
                    <img
                      src={imageUrl || "/placeholder.svg"}
                      alt={imageQuery || word}
                      className="w-full max-w-md rounded-lg shadow-md border border-purple-200/60 dark:border-purple-500/60"
                      crossOrigin="anonymous"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                </div>

                {imageLoading && (
                  <div className="text-center p-4 rounded-xl bg-white/50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-600 dark:text-purple-400" />
                      <p className="text-purple-600 dark:text-purple-400 font-medium">
                        "<span className="font-bold">{imageQuery || word}</span>" の画像を生成中...
                      </p>
                    </div>
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
