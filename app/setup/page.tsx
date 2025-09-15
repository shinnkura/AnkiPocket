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
        title: "Copy Successful",
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopiedText(""), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the text manually",
        variant: "destructive",
      });
    }
  };

  const setupSteps = [
    {
      title: "Launch Anki Application",
      description:
        "First, launch the Anki desktop application on your computer.",
      content: (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              AnkiConnect is an add-on for the Anki desktop application. It is not available for AnkiWeb or AnkiMobile.
            </p>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>
                Use Anki desktop version for Windows, Mac, or Linux
              </span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Anki version 2.1 or later is required</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "Install AnkiConnect Add-on",
      description: "Install the AnkiConnect add-on.",
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium">
              1. Select "Tools" → "Add-ons" from the Anki menu
            </p>
            <img
              src="/setup/anki-tools-menu.png"
              alt="Anki Tools Menu"
              className="w-full max-w-md border border-gray-200 dark:border-gray-600 rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">
              2. Click the "Get Add-ons" button
            </p>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <span className="text-sm font-medium">Add-on Code:</span>
              <code className="bg-white dark:bg-gray-800 px-3 py-1 rounded font-mono text-sm border">
                2055492159
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard("2055492159", "Add-on Code")}
                className="h-8"
              >
                {copiedText === "Add-on Code" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Copy the above code and paste it into the add-on code input field in Anki.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">
              3. Click the "OK" button to install
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The add-on will be downloaded and enabled automatically.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Add CORS Configuration",
      description:
        "Configure AnkiConnect to allow access from web applications.",
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium">
              1. Select "AnkiConnect" from the add-on list and click "Config"
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">2. Add the following to the configuration file</p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <div className="space-y-1">
                <div>&#123;</div>
                <div className="pl-4">"apiKey": null,</div>
                <div className="pl-4">"apiLogPath": null,</div>
                <div className="pl-4">"ignoreOriginList": [],</div>
                <div className="pl-4">"webBindAddress": "127.0.0.1",</div>
                <div className="pl-4">"webBindPort": 8765,</div>
                <div className="pl-4 text-yellow-400">
                  "webCorsOriginList": [
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
                    '{\n    "apiKey": null,\n    "apiLogPath": null,\n    "ignoreOriginList": [],\n    "webBindAddress": "127.0.0.1",\n    "webBindPort": 8765,\n    "webCorsOriginList": [\n        "https://your-domain.com"\n    ]\n}',
                    "CORS Configuration"
                  )
                }
                className="text-xs"
              >
                {copiedText === "CORS Configuration" ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                Copy Configuration
              </Button>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Important:</strong>{" "}
                Replace "https://your-domain.com" with the actual domain where you will use the application.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">
              3. Click "OK" to save the configuration
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Restart Anki",
      description: "Restart Anki to enable the configuration.",
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm">
              To complete the AnkiConnect setup, please follow these steps:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <span>Completely close the Anki application</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <span>Restart Anki</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <span>Verify that AnkiConnect is loaded correctly</span>
              </li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                After restart, AnkiConnect will accept requests on port 8765
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Connection Test",
      description: "Verify that AnkiConnect is working properly.",
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium">Connection test procedure:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <span>Verify that Anki is running</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <span>Return to AnkiPocket and search for a word</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <span>Click the "Send to Anki" button</span>
              </li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              If successful, you will see the message "Success! Word added to Anki!" and a new card will be created in Anki.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">If errors occur:</p>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Check if Anki is running</li>
              <li>• Check if the AnkiConnect add-on is enabled</li>
              <li>• Check if CORS configuration is set correctly</li>
              <li>• Try restarting Anki</li>
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
                AnkiConnect Setup Guide
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configuration steps for using AnkiPocket with AnkiConnect
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
                Step {currentStep + 1}
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
            Previous Step
          </Button>
          {currentStep === setupSteps.length - 1 ? (
            <Link href="/">
              <Button className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Setup Complete
              </Button>
            </Link>
          ) : (
            <Button
              onClick={() =>
                setCurrentStep(Math.min(setupSteps.length - 1, currentStep + 1))
              }
            >
              Next Step
            </Button>
          )}
        </div>

        {/* 概要カード */}
        <Card className="mt-8 mb-6 bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Wifi className="h-5 w-5" />
              <span>About AnkiConnect</span>
            </CardTitle>
            <CardDescription>
              AnkiConnect is an add-on that allows external applications to access Anki.
              AnkiPocket uses this add-on to integrate with Anki.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Download className="h-5 w-5 text-green-500" />
                <span className="text-sm">Free to install</span>
              </div>
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-blue-500" />
                <span className="text-sm">Easy setup to get started</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Add-on Code</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Used when installing in Anki
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
              <span>Troubleshooting</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                If connection errors occur:
              </p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                <li>Verify that the Anki desktop application is running</li>
                <li>
                  Verify that the AnkiConnect add-on (2055492159) is installed
                </li>
                <li>Verify that your domain is added to the CORS configuration</li>
                <li>Completely restart Anki</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Other issues:
              </p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                <li>
                  Check that antivirus software is not blocking port 8765
                </li>
                <li>Check firewall settings</li>
                <li>Disable the AnkiConnect add-on and then re-enable it</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 参考リンク */}
        <Card className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-700 dark:text-gray-300">
              Reference Links
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
                <span>AnkiConnect Official Page</span>
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
