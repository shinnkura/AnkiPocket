"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Download,
  Settings,
  Wifi,
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function AnkiConnectSetupPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [copiedText, setCopiedText] = useState("");
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast({
        title: "コピー完了",
        description: `${label}をクリップボードにコピーしました`,
      });
      setTimeout(() => setCopiedText(""), 2000);
    } catch (error) {
      toast({
        title: "コピー失敗",
        description: "手動でテキストをコピーしてください",
        variant: "destructive",
      });
    }
  };

  const setupSteps = [
    {
      title: "Ankiアプリケーションの起動",
      description:
        "まず、お使いのコンピューターでAnkiデスクトップアプリケーションを起動してください。",
      content: (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              AnkiConnectはAnkiデスクトップアプリケーション用のアドオンです。AnkiWebやAnkiMobileでは利用できません。
            </p>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>
                Windows、Mac、LinuxのいずれかのAnkiデスクトップ版を使用してください
              </span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Anki 2.1以降のバージョンが必要です</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "AnkiConnectアドオンの追加",
      description: "AnkiConnectアドオンをインストールします。",
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium">
              1. Ankiのメニューから「ツール」→「アドオン」を選択
            </p>
            <img
              src="/setup/anki-tools-menu.png"
              alt="Ankiツールメニュー"
              className="w-full max-w-md border border-gray-200 dark:border-gray-600 rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">
              2. 「アドオンを入手」ボタンをクリック
            </p>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <span className="text-sm font-medium">アドオンコード:</span>
              <code className="bg-white dark:bg-gray-800 px-3 py-1 rounded font-mono text-sm border">
                2055492159
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard("2055492159", "アドオンコード")}
                className="h-8"
              >
                {copiedText === "アドオンコード" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              上記のコードをコピーしてAnkiのアドオンコード入力欄に貼り付けてください。
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">
              3. 「OK」ボタンをクリックしてインストール
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              アドオンのダウンロードと有効化が自動的に行われます。
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "CORS設定の追加",
      description:
        "AnkiConnectがウェブアプリケーションからのアクセスを許可するように設定します。",
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium">
              1. アドオン一覧で「AnkiConnect」を選択し、「設定」をクリック
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">2. 設定ファイルに以下を追加</p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <div className="space-y-1">
                <div>&#123;</div>
                <div className="pl-4">"apiKey": null,</div>
                <div className="pl-4">"apiLogPath": null,</div>
                <div className="pl-4 text-yellow-400">
                  "webCorsOriginList": [
                </div>
                <div className="pl-8 text-yellow-400">
                  "http://localhost:3000",
                </div>
                <div className="pl-8 text-yellow-400">
                  "https://your-domain.com"
                </div>
                <div className="pl-4 text-yellow-400">]</div>
                <div>&#125;</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    '{\n    "apiKey": null,\n    "apiLogPath": null,\n    "webCorsOriginList": [\n        "http://localhost:3000",\n        "https://your-domain.com"\n    ]\n}',
                    "CORS設定"
                  )
                }
                className="text-xs"
              >
                {copiedText === "CORS設定" ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                設定をコピー
              </Button>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>重要:</strong>{" "}
                "https://your-domain.com"の部分は、実際にアプリケーションを使用するドメインに変更してください。
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">
              3. 「OK」をクリックして設定を保存
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Ankiの再起動",
      description: "設定を有効にするためにAnkiを再起動します。",
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm">
              AnkiConnectの設定を完了するために、以下の手順を実行してください：
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <span>Ankiアプリケーションを完全に終了</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <span>Ankiを再度起動</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <span>AnkiConnectが正常に読み込まれることを確認</span>
              </li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                再起動後、AnkiConnectはポート8765でリクエストを受け付けるようになります
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "接続テスト",
      description: "AnkiConnectが正常に動作していることを確認します。",
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium">接続テストの手順：</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <span>Ankiが起動していることを確認</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <span>AnkiPocketに戻って単語を検索</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <span>「Ankiに送信」ボタンをクリック</span>
              </li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              成功すると「成功！単語をAnkiに追加しました！」というメッセージが表示され、Ankiに新しいカードが作成されます。
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">エラーが発生する場合：</p>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Ankiが起動しているか確認</li>
              <li>• AnkiConnectアドオンが有効か確認</li>
              <li>• CORS設定が正しく設定されているか確認</li>
              <li>• Ankiを再起動してみる</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
      {/* ヘッダー */}
      <div className="bg-white dark:bg-gray-800 border-b border-blue-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                AnkiConnect セットアップガイド
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AnkiPocketを使用するためのAnkiConnect設定手順
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto p-6">
        {/* ステップナビゲーション */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-center space-x-2 mb-4">
            {setupSteps.map((_, index) => (
              <Button
                key={index}
                variant={currentStep === index ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentStep(index)}
                className="mb-2"
              >
                {index + 1}
              </Button>
            ))}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / setupSteps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* 現在のステップ */}
        <Card className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Badge variant="default" className="bg-blue-600 dark:bg-blue-400">
                ステップ {currentStep + 1}
              </Badge>
              <CardTitle className="text-xl text-blue-600 dark:text-blue-400">
                {setupSteps[currentStep].title}
              </CardTitle>
            </div>
            <CardDescription>
              {setupSteps[currentStep].description}
            </CardDescription>
          </CardHeader>
          <CardContent>{setupSteps[currentStep].content}</CardContent>
        </Card>

        {/* ナビゲーションボタン */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            前のステップ
          </Button>
          {currentStep === setupSteps.length - 1 ? (
            <Link href="/">
              <Button className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                セットアップ完了
              </Button>
            </Link>
          ) : (
            <Button
              onClick={() =>
                setCurrentStep(Math.min(setupSteps.length - 1, currentStep + 1))
              }
            >
              次のステップ
            </Button>
          )}
        </div>

        {/* 概要カード */}
        <Card className="mt-8 mb-6 bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Wifi className="h-5 w-5" />
              <span>AnkiConnectについて</span>
            </CardTitle>
            <CardDescription>
              AnkiConnectは、外部アプリケーションからAnkiにアクセスできるようにするアドオンです。
              AnkiPocketはこのアドオンを使用してAnkiと連携します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Download className="h-5 w-5 text-green-500" />
                <span className="text-sm">無料でインストール可能</span>
              </div>
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-blue-500" />
                <span className="text-sm">簡単な設定で利用開始</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">アドオンコード</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Ankiでのインストール時に使用
                </p>
              </div>
              <Badge variant="secondary" className="font-mono">
                2055492159
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* トラブルシューティング */}
        <Card className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-300">
              <AlertTriangle className="h-5 w-5" />
              <span>トラブルシューティング</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                接続エラーが発生する場合：
              </p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                <li>Ankiデスクトップアプリが起動していることを確認</li>
                <li>
                  AnkiConnectアドオン（2055492159）がインストールされていることを確認
                </li>
                <li>CORS設定にあなたのドメインが追加されていることを確認</li>
                <li>Ankiを完全に再起動</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                その他の問題：
              </p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                <li>
                  アンチウイルスソフトがポート8765をブロックしていないか確認
                </li>
                <li>ファイアウォールの設定を確認</li>
                <li>AnkiConnectアドオンを一度無効にしてから再度有効にする</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 参考リンク */}
        <Card className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-700 dark:text-gray-300">
              参考リンク
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="https://ankiweb.net/shared/info/2055492159"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                <span>AnkiConnect公式ページ</span>
              </a>
              <a
                href="https://github.com/FooSoft/anki-connect"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                <span>AnkiConnect GitHub</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
