"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Settings, Loader2 } from "lucide-react";
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
    // ページタイトルを設定
    document.title = "AnkiPocket - 設定";

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
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
      {/* ヘッダー */}
      <div className="bg-white dark:bg-gray-800 border-b border-blue-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  設定
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AnkiPocketの設定を変更
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Anki設定 */}
        <Card className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              Anki設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="deckName" className="text-base font-medium text-gray-700 dark:text-gray-300">
                デッキ名
              </Label>
              <Input
                id="deckName"
                placeholder="例: English Vocabulary"
                value={settings.deckName}
                onChange={(e) => handleDeckNameChange(e.target.value)}
                className="h-11 border-blue-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-400"
              />
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>ヒント:</strong> 単語カードを追加するAnkiデッキの名前を設定してください。
                  デッキが存在しない場合は保存されません。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 保存ボタン */}
        <div className="flex justify-center">
          <Button
            onClick={saveSettings}
            disabled={loading || !settings.deckName.trim()}
            className="h-11 px-6 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                保存中...
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
        <Card className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-blue-600 dark:text-blue-400">
              使用方法
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  上記でデッキ名を設定し、「設定を保存」ボタンを押してください。
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  メインページに戻り、英単語を入力して単語カードを作成してください。
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  単語カードは指定したデッキに自動的に追加されます。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}