"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface Settings {
  deckName: string;
}

const DEFAULT_SETTINGS: Settings = {
  deckName: "English Vocabulary",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // localStorageから設定を読み込み
    if (typeof window !== "undefined") {
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

  const saveSettings = () => {
    setLoading(true);
    try {
      localStorage.setItem("ankiPocketSettings", JSON.stringify(settings));
      toast({
        title: "設定を保存しました",
        description: "設定が正常に保存されました。",
      });
    } catch (error) {
      toast({
        title: "保存エラー",
        description: "設定の保存に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeckNameChange = (value: string) => {
    setSettings((prev) => ({
      ...prev,
      deckName: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">設定</h1>
            <p className="text-muted-foreground">
              Anki単語登録アプリの設定を変更
            </p>
          </div>
        </div>

        {/* Anki設定 */}
        <Card>
          <CardHeader>
            <CardTitle>Anki設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deckName">デッキ名</Label>
              <Input
                id="deckName"
                placeholder="例: English Vocabulary"
                value={settings.deckName}
                onChange={(e) => handleDeckNameChange(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                単語カードを追加するAnkiデッキの名前を設定してください。
                デッキが存在しない場合は自動的に作成されます。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={loading || !settings.deckName.trim()}>
            {loading ? (
              <>
                <span className="mr-2">保存中...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                設定を保存
              </>
            )}
          </Button>
        </div>

        {/* 使用方法 */}
        <Card>
          <CardHeader>
            <CardTitle>使用方法</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              1. 上記でデッキ名を設定し、「設定を保存」ボタンを押してください。
            </p>
            <p className="text-sm text-muted-foreground">
              2. メインページに戻り、英単語を入力して単語カードを作成してください。
            </p>
            <p className="text-sm text-muted-foreground">
              3. 単語カードは指定したデッキに自動的に追加されます。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}