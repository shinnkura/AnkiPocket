"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, Upload, X, Link, FileImage } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ManualAnkiFormProps {
  settings: {
    deckName: string;
  };
}

export default function ManualAnkiForm({ settings }: ManualAnkiFormProps) {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageInputType, setImageInputType] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrlInput("");
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlSubmit = () => {
    if (imageUrlInput.trim()) {
      setImageUrl(imageUrlInput.trim());
      setImageFile(null);
      toast({
        title: "Image URL Set",
        description: "Image URL has been set.",
      });
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImageUrl("");
    setImageUrlInput("");
  };

  const sendToAnki = async () => {
    if (!word.trim() || !meaning.trim()) {
      toast({
        title: "Input Error",
        description: "Please enter both word and meaning.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/manual-anki", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: word.trim(),
          meaning: meaning.trim(),
          imageUrl: imageUrl,
          imageFile: imageFile ? {
            data: imageUrl.split(",")[1], // base64 data part only
            filename: `${word}_${Date.now()}.${imageFile.type.split("/")[1]}`,
          } : null,
          imageUrlInput: !imageFile && imageUrl ? imageUrl : null,
          deckName: settings.deckName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send to Anki");
      }

      if (result.success) {
        toast({
          title: "Success!",
          description: `Added word "${word}" to Anki!${
            imageFile ? " (with image)" : ""
          }`,
        });

        // Reset form
        setWord("");
        setMeaning("");
        setImageUrl("");
        setImageFile(null);
        setImageUrlInput("");
      } else {
        throw new Error(result.error || "Failed to send to Anki");
      }
    } catch (error) {
      console.error("Manual Anki send error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check if it's a duplicate card error
      if (errorMessage.includes("duplicate")) {
        toast({
          title: "Duplicate Card",
          description: `カード "${word}" は既にAnkiに存在します。`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Send Error",
          description: `エラーが発生しました: ${errorMessage}`,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-gray-700">
      <CardHeader className="text-center">
        <CardTitle className="text-xl text-purple-600 dark:text-purple-400">
          Create Anki Card Manually
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Enter word, meaning, and image manually to send to Anki
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-word" className="text-sm font-medium">
              Word <span className="text-red-500">*</span>
            </Label>
            <Input
              id="manual-word"
              placeholder="e.g. beautiful"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="border-purple-200 dark:border-gray-600 focus:border-purple-400 dark:focus:border-purple-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-meaning" className="text-sm font-medium">
              Meaning <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="manual-meaning"
              placeholder="e.g. beautiful, pretty"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              rows={3}
              className="border-purple-200 dark:border-gray-600 focus:border-purple-400 dark:focus:border-purple-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-image" className="text-sm font-medium">
              Image (Optional)
            </Label>
            <Tabs value={imageInputType} onValueChange={(value) => setImageInputType(value as "file" | "url")} className="space-y-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <FileImage className="h-4 w-4" />
                  File
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-3">
                <div className="relative">
                  <input
                    id="manual-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 border-purple-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {imageFile ? imageFile.name : "Choose file"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. https://example.com/image.jpg"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleImageUrlSubmit()}
                    className="flex-1 border-purple-200 dark:border-gray-600 focus:border-purple-400 dark:focus:border-purple-400"
                  />
                  <Button
                    onClick={handleImageUrlSubmit}
                    disabled={!imageUrlInput.trim()}
                    variant="outline"
                    className="border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Set
                  </Button>
                </div>
              </TabsContent>

              {imageUrl && (
                <div className="relative inline-block">
                  <img
                    src={imageUrl}
                    alt="Selected image"
                    className="w-32 h-32 object-cover rounded border border-purple-200 dark:border-gray-600"
                    crossOrigin="anonymous"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </Tabs>
          </div>

          <Button
            onClick={sendToAnki}
            disabled={loading || !word.trim() || !meaning.trim()}
            className="w-full h-11 bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending to Anki...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to Anki
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}