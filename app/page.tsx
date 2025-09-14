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
import { Loader2, Volume2, ImageIcon, Send, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

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
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentDomain(window.location.origin);

      // localStorageから設定を読み込み
      const savedSettings = localStorage.getItem("ankiPocketSettings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch (error) {
          console.error("設定の読み込みエラー:", error);
        }
      }
    }
  }, []);

  const fetchDefinition = async () => {
    if (!word.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
      );
      if (!response.ok) throw new Error("単語が見つかりませんでした");

      const data = await response.json();
      setDefinition(data[0]);
    } catch (error) {
      toast({
        title: "エラー",
        description: "単語の意味を取得できませんでした。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async () => {
    if (!word.trim()) return;

    setImageLoading(true);
    try {
      // API Routeを使用してUnsplash画像を取得
      const response = await fetch(
        `/api/unsplash?query=${encodeURIComponent(word)}`
      );

      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.imageUrl);

        if (data.source === "unsplash") {
          toast({
            title: "画像取得成功",
            description: "Unsplashから関連画像を取得しました！",
          });
        } else {
          toast({
            title: "画像生成",
            description: "ランダム画像を表示しています。",
          });
        }
        return;
      }

      // フォールバック: ランダム画像
      setImageUrl(`https://picsum.photos/300/200?random=${Date.now()}`);
      toast({
        title: "画像生成",
        description: "ランダム画像を表示しています。",
      });
    } catch (error) {
      setImageUrl(`https://picsum.photos/300/200?random=${Date.now()}`);
      toast({
        title: "画像生成エラー",
        description: "ランダム画像を表示しています。",
        variant: "destructive",
      });
    } finally {
      setImageLoading(false);
    }
  };

  const sendToAnki = async () => {
    if (!definition) return;

    try {
      let imageFileName = "";
      if (imageUrl) {
        try {
          // 画像をfetchしてblobに変換
          const imageResponse = await fetch(imageUrl);
          const imageBlob = await imageResponse.blob();

          // blobをbase64に変換
          const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              // data:image/jpeg;base64, の部分を除去
              resolve(base64.split(",")[1]);
            };
            reader.readAsDataURL(imageBlob);
          });

          // ファイル名を生成（単語名 + タイムスタンプ）
          const timestamp = Date.now();
          const extension =
            imageUrl.includes(".jpg") || imageUrl.includes(".jpeg")
              ? "jpg"
              : "png";
          imageFileName = `${word}_${timestamp}.${extension}`;

          // AnkiConnectのstoreMediaFileアクションで画像を保存
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
            console.log(`画像保存エラー: ${storeMediaResult.error}`);
            imageFileName = ""; // エラーの場合は画像なしで続行
          } else {
            console.log(`画像保存成功: ${imageFileName}`);
          }
        } catch (imageError) {
          console.log(`画像処理エラー: ${imageError}`);
          imageFileName = ""; // エラーの場合は画像なしで続行
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
        throw new Error("AnkiConnectに接続できません");
      }

      const modelNamesResult = await modelNamesResponse.json();

      if (modelNamesResult.error) {
        throw new Error(modelNamesResult.error);
      }

      const availableModels = modelNamesResult.result;
      console.log(`利用可能なノートタイプ:`, availableModels);

      if (!availableModels || availableModels.length === 0) {
        throw new Error("利用可能なノートタイプが見つかりません");
      }

      const modelName = availableModels[0];
      console.log(`使用するノートタイプ: ${modelName}`);

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
      console.log(`利用可能なフィールド:`, fieldNames);

      const fields: Record<string, string> = {};

      if (fieldNames.includes("センテンス")) {
        fields["センテンス"] = definition.phonetic
          ? `${word} /${definition.phonetic}/`
          : word;
      } else {
        fields[fieldNames[0]] = definition.phonetic
          ? `${word} /${definition.phonetic}/`
          : word;
      }

      if (fieldNames.includes("日本語の意味")) {
        fields["日本語の意味"] = definition.meanings
          .map(
            (meaning) =>
              `${meaning.partOfSpeech}: ${meaning.definitions[0].definition}`
          )
          .join("\n");
      }

      if (fieldNames.includes("画像") && imageFileName) {
        fields["画像"] = `<img src="${imageFileName}">`;
      }

      if (fieldNames.includes("語源")) {
        fields["語源"] = "";
      }

      // フォールバック: 基本的なフィールド構成
      if (
        !fieldNames.includes("センテンス") &&
        !fieldNames.includes("日本語の意味")
      ) {
        fields[fieldNames[0]] = definition.phonetic
          ? `${word} /${definition.phonetic}/`
          : word;

        fields[fieldNames[1] || fieldNames[0]] = `
          <div style="font-family: Arial, sans-serif;">
            ${definition.meanings
              .map(
                (meaning) => `
              <p><strong>${meaning.partOfSpeech}:</strong> ${
                  meaning.definitions[0].definition
                }</p>
              ${
                meaning.definitions[0].example
                  ? `<p><em>例文: "${meaning.definitions[0].example}"</em></p>`
                  : ""
              }
            `
              )
              .join("")}
            ${imageFileName ? `<br><img src="${imageFileName}">` : ""}
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
        title: "成功！",
        description: `単語「${word}」をAnkiに追加しました！${
          imageFileName ? "（画像付き）" : ""
        }`,
      });

      // リセット
      setWord("");
      setDefinition(null);
      setImageUrl("");
    } catch (error) {
      toast({
        title: "Anki送信エラー",
        description: `エラー: ${
          error instanceof Error ? error.message : "Unknown error"
        }

【確認事項】
• Ankiアプリが起動していますか？
• AnkiConnectアドオンがインストールされていますか？
• CORS設定: webCorsOriginList に ["https://*/*"] を追加してください`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
      {/* ヘッダー */}
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
            <Link href="/settings">
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center py-6">
          <h2 className="text-lg text-gray-700 dark:text-gray-300">
            英単語を入力して、意味と画像を自動生成してAnkiに送信
          </h2>
          {currentDomain && (
            <div className="inline-block text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded border border-blue-200 dark:border-blue-800 mt-4">
              <div className="text-center">
                <span className="font-medium">AnkiConnect 設定確認</span>
              </div>
              <p className="mt-2">
                <strong>現在のドメイン:</strong> {currentDomain}<br />
                <strong>CORS設定:</strong> webCorsOriginList に "{currentDomain}" を追加してください
              </p>
            </div>
          )}
        </div>

        {/* 単語入力カード */}
        <Card className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-blue-600 dark:text-blue-400">
              単語を入力
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              学習したい英単語を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="例: beautiful"
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
                  "検索"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

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
              {definition.meanings.map((meaning, index) => (
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
                        例文: "{meaning.definitions[0].example}"
                      </p>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={generateImage}
                  disabled={imageLoading}
                  className="flex-1 h-11 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  {imageLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      画像生成中...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      画像を生成
                    </>
                  )}
                </Button>
                <Button
                  onClick={sendToAnki}
                  disabled={!definition}
                  className="flex-1 h-11 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Ankiに送信
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {imageUrl && (
          <Card className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700">
            <CardHeader className="text-center">
              <CardTitle className="text-lg text-blue-600 dark:text-blue-400">
                生成された画像
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={word}
                className="w-full max-w-md mx-auto rounded border border-blue-200 dark:border-gray-600"
                crossOrigin="anonymous"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
