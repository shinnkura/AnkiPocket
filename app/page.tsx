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
import { Loader2, Volume2, ImageIcon, Send, Settings, RefreshCw } from "lucide-react";
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
  const [imageQuery, setImageQuery] = useState("");
  const [showImageQueryInput, setShowImageQueryInput] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [translateLoading, setTranslateLoading] = useState(false);
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
      // 文章かどうかの判定（スペースが含まれている、または複数の単語）
      const isPhrase = word.trim().includes(' ') || word.trim().split(/\s+/).length > 1;
      console.log('Input:', word, 'isPhrase:', isPhrase, 'split length:', word.trim().split(/\s+/).length);

      if (isPhrase) {
        // 文章の場合は翻訳APIを使用
        console.log('Calling translation API for phrase:', word);
        const response = await fetch(
          `/api/translate?text=${encodeURIComponent(word)}&from=en&to=ja`
        );

        console.log('Translation API response status:', response.status);
        if (!response.ok) {
          console.error('Translation API failed:', response.status, response.statusText);
          throw new Error(`翻訳に失敗しました (${response.status})`);
        }

        const data = await response.json();
        console.log('Translation API response data:', data);

        if (!data.success) {
          console.error('Translation API returned error:', data.error);
          throw new Error(data.error || "翻訳に失敗しました");
        }

        setTranslatedText(data.translatedText);
        setDefinition(null); // 辞書結果をクリア
        console.log('Translation result:', data.translatedText);
        toast({
          title: "翻訳完了（文章モード）",
          description: `「${word}」→「${data.translatedText}」`,
        });
      } else {
        // 単語の場合は辞書APIを使用
        console.log('Calling dictionary API for word:', word);
        const response = await fetch(
          `/api/dictionary?word=${encodeURIComponent(word)}`
        );

        console.log('Dictionary API response status:', response.status);
        if (!response.ok) {
          console.error('Dictionary API failed:', response.status, response.statusText);
          throw new Error(`単語が見つかりませんでした (${response.status})`);
        }

        const data = await response.json();
        console.log('Dictionary API response data:', data);
        setDefinition(data.definitions[0]);
        setTranslatedText(""); // 翻訳結果をクリア
        console.log('Dictionary result:', data.definitions[0]);

        toast({
          title: "検索完了（単語モード）",
          description: `「${word}」の辞書定義を取得しました`,
        });
      }
    } catch (error) {
      console.error('fetchDefinition error:', error);
      toast({
        title: "エラー",
        description: `検索に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const translateText = async () => {
    if (!word.trim()) return;

    setTranslateLoading(true);
    try {
      const response = await fetch(
        `/api/translate?text=${encodeURIComponent(word)}&from=en&to=ja`
      );

      if (!response.ok) {
        throw new Error("翻訳に失敗しました");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "翻訳に失敗しました");
      }

      setTranslatedText(data.translatedText);
      toast({
        title: "翻訳完了",
        description: `「${word}」を翻訳しました`,
      });
    } catch (error) {
      toast({
        title: "翻訳エラー",
        description: "文章の翻訳に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setTranslateLoading(false);
    }
  };

  const generateImage = async (customQuery?: string) => {
    // デバッグ用ログ - 個別の値をチェック
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
        title: "画像生成エラー",
        description: "検索キーワードが無効です。単語を入力してから画像生成を試してください。",
        variant: "destructive",
      });
      return;
    }

    setImageLoading(true);
    try {
      // API Routeを使用してUnsplash画像を取得
      const response = await fetch(
        `/api/unsplash?query=${encodeURIComponent(queryToUse)}`
      );

      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.imageUrl);

        // 最初の生成時にimageQueryを初期化
        if (!imageQuery) {
          setImageQuery(queryToUse);
        }

        if (data.source === "unsplash") {
          toast({
            title: "画像取得成功",
            description: `「${queryToUse}」の画像を取得しました！`,
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

  const handleImageRegenerate = () => {
    setShowImageQueryInput(true);
  };

  const handleImageRegenerateSubmit = async () => {
    if (!imageQuery.trim()) {
      toast({
        title: "入力エラー",
        description: "検索キーワードを入力してください。",
        variant: "destructive",
      });
      return;
    }

    await generateImage(imageQuery);
    setShowImageQueryInput(false);
  };

  const handleImageRegenerateCancel = () => {
    setShowImageQueryInput(false);
    // 元の検索クエリに戻す
    setImageQuery(word);
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
      setTranslatedText("");
    } catch (error) {
      console.error("Anki送信エラーの詳細:", error);

      let errorTitle = "Anki送信エラー";
      let errorDescription = "";

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // HTTPエラーの場合
        if (errorMessage.includes("http")) {
          const statusMatch = error.message.match(/HTTP (\d+):/);
          const status = statusMatch ? parseInt(statusMatch[1]) : null;

          switch (status) {
            case 0:
            case null:
              errorTitle = "接続エラー";
              errorDescription = `AnkiConnectに接続できません。

【確認事項】
• Ankiアプリが起動していることを確認してください
• AnkiConnectアドオン (2055492159) がインストールされていることを確認してください
• Ankiの「ツール」→「アドオン」でAnkiConnectが有効になっていることを確認してください

【エラー詳細】${error.message}`;
              break;
            case 404:
              errorTitle = "AnkiConnect未検出";
              errorDescription = `AnkiConnectが見つかりません。

【確認事項】
• AnkiConnectアドオン (2055492159) をインストールしてください
• Ankiを再起動してください

【エラー詳細】${error.message}`;
              break;
            case 403:
              errorTitle = "CORS設定エラー";
              errorDescription = `CORS設定が正しくありません。

【設定手順】
1. Ankiの「ツール」→「アドオン」を開く
2. AnkiConnectを選択し「設定」をクリック
3. "webCorsOriginList" に "${currentDomain}" を追加
4. Ankiを再起動

【エラー詳細】${error.message}`;
              break;
            case 500:
              errorTitle = "Anki内部エラー";
              errorDescription = `Anki側でエラーが発生しました。

【確認事項】
• 指定されたデッキ名「${settings.deckName}」が有効か確認してください
• Ankiのノートタイプが正しく設定されているか確認してください

【エラー詳細】${error.message}`;
              break;
            default:
              errorDescription = `HTTP ${status} エラーが発生しました。

【エラー詳細】${error.message}

【確認事項】
• Ankiアプリが起動していることを確認してください
• AnkiConnectアドオンが正しく動作しているか確認してください`;
          }
        }
        // AnkiConnect API固有のエラー
        else if (errorMessage.includes("cannot create note because it is a duplicate")) {
          errorTitle = "重複エラー";
          errorDescription = `「${word}」は既にAnkiに存在します。

【対処法】
• 既存のカードを確認してください
• 異なる単語を入力してください
• Ankiで重複カードを削除してから再度お試しください`;
        }
        else if (errorMessage.includes("deck was not found")) {
          errorTitle = "デッキエラー";
          errorDescription = `デッキ「${settings.deckName}」が見つかりません。

【対処法】
• Ankiでデッキを作成してください
• 設定ページで正しいデッキ名を入力してください
• デッキ名の大文字小文字が正確か確認してください

【エラー詳細】${error.message}`;
        }
        else if (errorMessage.includes("model was not found")) {
          errorTitle = "ノートタイプエラー";
          errorDescription = `ノートタイプが見つかりません。

【対処法】
• Ankiに適切なノートタイプが存在することを確認してください
• 「Basic」や「Basic (and reversed card)」ノートタイプを使用してみてください

【エラー詳細】${error.message}`;
        }
        else {
          errorDescription = `予期しないエラーが発生しました。

【エラー詳細】${error.message}

【基本的な確認事項】
• Ankiアプリが起動していますか？
• AnkiConnectアドオンがインストールされていますか？
• CORS設定は正しく行われていますか？`;
        }
      } else {
        errorDescription = `不明なエラーが発生しました。

【エラー詳細】${String(error)}

【確認事項】
• Ankiアプリが起動していることを確認してください
• AnkiConnectアドオンが正しくインストールされているか確認してください`;
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
            英単語や文章を入力して、意味の取得・翻訳・画像生成をしてAnkiに送信
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
              単語・文章を入力
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              学習したい英単語や文章を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="例: beautiful または it is a piece of cake"
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
                  "検索・翻訳"
                )}
              </Button>
              <Button
                onClick={translateText}
                disabled={translateLoading || !word.trim()}
                variant="outline"
                className="h-11 px-6 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                {translateLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "翻訳"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {translatedText && (
          <Card className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700">
            <CardHeader>
              <CardTitle className="text-xl text-green-600 dark:text-green-400">
                翻訳結果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 rounded bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">原文:</p>
                  <p className="text-gray-800 dark:text-gray-200 mb-3">{word}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">翻訳:</p>
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
                  // 主要な品詞のみ表示（稀な動詞用法を除外）
                  const commonParts = ['noun', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'];
                  const isCommonVerb = meaning.partOfSpeech === 'verb' &&
                    meaning.definitions.some(def =>
                      def.definition.length > 30 && // 短すぎる定義は稀な用法の可能性
                      !def.definition.toLowerCase().includes('to become') && // "To become X-like" のような稀な用法を除外
                      !def.definition.toLowerCase().includes('to form') // "To form X" のような稀な用法を除外
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
                        例文: "{meaning.definitions[0].example}"
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
              <CardTitle className="text-lg text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                生成された画像
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImageRegenerate}
                  disabled={imageLoading}
                  className="h-8 px-3 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span className="ml-1 text-xs">再生成</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {showImageQueryInput && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        画像検索キーワード
                      </label>
                      <Input
                        placeholder="例: red apple, sunset landscape..."
                        value={imageQuery}
                        onChange={(e) => setImageQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleImageRegenerateSubmit()}
                        className="mt-1 border-blue-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-400"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        現在: 「{imageQuery || word}」で検索
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
                            生成中...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            画像を生成
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleImageRegenerateCancel}
                        disabled={imageLoading}
                        className="h-9 px-4 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                      >
                        キャンセル
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
                      「{imageQuery || word}」の画像を生成しています...
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
