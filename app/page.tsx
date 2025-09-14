"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Volume2, ImageIcon, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WordDefinition {
  word: string
  phonetic?: string
  meanings: Array<{
    partOfSpeech: string
    definitions: Array<{
      definition: string
      example?: string
    }>
  }>
}

export default function AnkiVocabularyApp() {
  const [word, setWord] = useState("")
  const [definition, setDefinition] = useState<WordDefinition | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [currentDomain, setCurrentDomain] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentDomain(window.location.origin)
    }
  }, [])

  const fetchDefinition = async () => {
    if (!word.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      if (!response.ok) throw new Error("単語が見つかりませんでした")

      const data = await response.json()
      setDefinition(data[0])
    } catch (error) {
      toast({
        title: "エラー",
        description: "単語の意味を取得できませんでした。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateImage = async () => {
    if (!word.trim()) return

    setImageLoading(true)
    try {
      // Unsplash APIキーを直接使用
      const unsplashApiKey =
        process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || "igiJIIQhPtMIhwwehifzVfhnDWcG3l8XMjYyjNbiaz0"

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(word)}&per_page=1&client_id=${unsplashApiKey}`,
      )

      if (response.ok) {
        const data = await response.json()
        if (data.results && data.results.length > 0) {
          setImageUrl(data.results[0].urls.small)
          toast({
            title: "画像取得成功",
            description: "関連画像を取得しました！",
          })
          return
        }
      }

      // フォールバック: ランダム画像
      setImageUrl(`https://picsum.photos/300/200?random=${Date.now()}`)
      toast({
        title: "画像生成",
        description: "ランダム画像を表示しています。",
      })
    } catch (error) {
      setImageUrl(`https://picsum.photos/300/200?random=${Date.now()}`)
      toast({
        title: "画像生成エラー",
        description: "ランダム画像を表示しています。",
        variant: "destructive",
      })
    } finally {
      setImageLoading(false)
    }
  }

  const sendToAnki = async () => {
    if (!definition) return

    try {
      let imageFileName = ""
      if (imageUrl) {
        try {
          // 画像をfetchしてblobに変換
          const imageResponse = await fetch(imageUrl)
          const imageBlob = await imageResponse.blob()

          // blobをbase64に変換
          const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64 = reader.result as string
              // data:image/jpeg;base64, の部分を除去
              resolve(base64.split(",")[1])
            }
            reader.readAsDataURL(imageBlob)
          })

          // ファイル名を生成（単語名 + タイムスタンプ）
          const timestamp = Date.now()
          const extension = imageUrl.includes(".jpg") || imageUrl.includes(".jpeg") ? "jpg" : "png"
          imageFileName = `${word}_${timestamp}.${extension}`

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
          })

          const storeMediaResult = await storeMediaResponse.json()
          if (storeMediaResult.error) {
            console.log(`[v0] 画像保存エラー: ${storeMediaResult.error}`)
            imageFileName = "" // エラーの場合は画像なしで続行
          } else {
            console.log(`[v0] 画像保存成功: ${imageFileName}`)
          }
        } catch (imageError) {
          console.log(`[v0] 画像処理エラー: ${imageError}`)
          imageFileName = "" // エラーの場合は画像なしで続行
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
      })

      if (!modelNamesResponse.ok) {
        throw new Error("AnkiConnectに接続できません")
      }

      const modelNamesResult = await modelNamesResponse.json()

      if (modelNamesResult.error) {
        throw new Error(modelNamesResult.error)
      }

      const availableModels = modelNamesResult.result
      console.log(`[v0] 利用可能なノートタイプ:`, availableModels)

      if (!availableModels || availableModels.length === 0) {
        throw new Error("利用可能なノートタイプが見つかりません")
      }

      const modelName = availableModels[0]
      console.log(`[v0] 使用するノートタイプ: ${modelName}`)

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
      })

      const modelFieldsResult = await modelFieldsResponse.json()
      const fieldNames = modelFieldsResult.result || ["Front", "Back"]
      console.log(`[v0] 利用可能なフィールド:`, fieldNames)

      const fields: Record<string, string> = {}

      if (fieldNames.includes("センテンス")) {
        fields["センテンス"] = definition.phonetic ? `${word} /${definition.phonetic}/` : word
      } else {
        fields[fieldNames[0]] = definition.phonetic ? `${word} /${definition.phonetic}/` : word
      }

      if (fieldNames.includes("日本語の意味")) {
        fields["日本語の意味"] = definition.meanings
          .map((meaning) => `${meaning.partOfSpeech}: ${meaning.definitions[0].definition}`)
          .join("\n")
      }

      if (fieldNames.includes("画像") && imageFileName) {
        fields["画像"] = `<img src="${imageFileName}">`
      }

      if (fieldNames.includes("語源")) {
        fields["語源"] = ""
      }

      // フォールバック: 基本的なフィールド構成
      if (!fieldNames.includes("センテンス") && !fieldNames.includes("日本語の意味")) {
        fields[fieldNames[0]] = definition.phonetic ? `${word} /${definition.phonetic}/` : word

        fields[fieldNames[1] || fieldNames[0]] = `
          <div style="font-family: Arial, sans-serif;">
            ${definition.meanings
              .map(
                (meaning) => `
              <p><strong>${meaning.partOfSpeech}:</strong> ${meaning.definitions[0].definition}</p>
              ${meaning.definitions[0].example ? `<p><em>例文: "${meaning.definitions[0].example}"</em></p>` : ""}
            `,
              )
              .join("")}
            ${imageFileName ? `<br><img src="${imageFileName}">` : ""}
          </div>
        `
      }

      const ankiNote = {
        action: "addNote",
        version: 6,
        params: {
          note: {
            deckName: "English Vocabulary",
            modelName: modelName,
            fields: fields,
            tags: ["vocabulary", "english", "auto-generated"],
          },
        },
      }

      const response = await fetch("http://127.0.0.1:8765", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ankiNote),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "成功！",
        description: `単語「${word}」をAnkiに追加しました！${imageFileName ? "（画像付き）" : ""}`,
      })

      // リセット
      setWord("")
      setDefinition(null)
      setImageUrl("")
    } catch (error) {
      toast({
        title: "Anki送信エラー",
        description: `エラー: ${error instanceof Error ? error.message : "Unknown error"}

【確認事項】
• Ankiアプリが起動していますか？
• AnkiConnectアドオンがインストールされていますか？
• CORS設定: webCorsOriginList に ["https://*/*"] を追加してください`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Anki単語登録アプリ</h1>
          <p className="text-muted-foreground">英単語を入力して、意味と画像を自動生成してAnkiに送信</p>
          {currentDomain && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              <strong>現在のドメイン:</strong> {currentDomain}
              <br />
              <strong>AnkiConnect CORS設定:</strong> webCorsOriginList に "{currentDomain}" を追加してください
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>単語入力</CardTitle>
            <CardDescription>学習したい英単語を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Input
                placeholder="例: beautiful"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && fetchDefinition()}
                className="flex-1"
              />
              <Button onClick={fetchDefinition} disabled={loading || !word.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "検索"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {definition && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {definition.word}
                {definition.phonetic && (
                  <Badge variant="secondary" className="text-sm">
                    <Volume2 className="h-3 w-3 mr-1" />
                    {definition.phonetic}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {definition.meanings.map((meaning, index) => (
                <div key={index} className="space-y-4">
                  <Badge variant="outline">{meaning.partOfSpeech}</Badge>
                  <p className="text-foreground">{meaning.definitions[0].definition}</p>
                  {meaning.definitions[0].example && (
                    <p className="text-muted-foreground italic">例文: "{meaning.definitions[0].example}"</p>
                  )}
                </div>
              ))}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={generateImage}
                  disabled={imageLoading}
                  className="flex-1 bg-transparent"
                >
                  {imageLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ImageIcon className="h-4 w-4 mr-2" />
                  )}
                  画像生成
                </Button>
                <Button onClick={sendToAnki} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Ankiに送信
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {imageUrl && (
          <Card>
            <CardHeader>
              <CardTitle>生成された画像</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={word}
                className="w-full max-w-sm mx-auto rounded-lg border"
                crossOrigin="anonymous"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
