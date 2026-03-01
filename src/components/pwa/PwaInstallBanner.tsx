import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type MobilePlatform = "ios" | "android" | "other";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function detectMobilePlatform(): MobilePlatform {
  const userAgent = window.navigator.userAgent;
  const isAndroid = /android/i.test(userAgent);
  const isIOS =
    /iphone|ipad|ipod/i.test(userAgent) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1);

  if (isIOS) {
    return "ios";
  }

  if (isAndroid) {
    return "android";
  }

  return "other";
}

function isInstalledMode() {
  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true ||
    document.referrer.startsWith("android-app://")
  );
}

export function PwaInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const platform = useMemo<MobilePlatform>(() => {
    if (typeof window === "undefined") {
      return "other";
    }

    return detectMobilePlatform();
  }, []);

  useEffect(() => {
    if (platform === "other") {
      return;
    }

    const syncInstallState = () => {
      const installed = isInstalledMode();
      setIsInstalled(installed);
      setIsVisible(!installed);
    };

    syncInstallState();

    const onBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsInstalled(true);
        setIsVisible(false);
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    if (typeof displayModeQuery.addEventListener === "function") {
      displayModeQuery.addEventListener("change", onDisplayModeChange);
    } else {
      displayModeQuery.addListener(onDisplayModeChange);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      if (typeof displayModeQuery.removeEventListener === "function") {
        displayModeQuery.removeEventListener("change", onDisplayModeChange);
      } else {
        displayModeQuery.removeListener(onDisplayModeChange);
      }
    };
  }, [platform]);

  const onDismiss = () => {
    setIsVisible(false);
  };

  const onInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setIsVisible(false);
    }

    setDeferredPrompt(null);
  };

  if (!isVisible || isInstalled || platform === "other") {
    return null;
  }

  const isAndroidPromptReady = platform === "android" && deferredPrompt;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-4">
      <div className="glass-panel-strong pointer-events-auto mx-auto w-full max-w-xl rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-tight">
              Install Sine Shin
            </p>
            {platform === "ios" ? (
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                On iPhone or iPad, tap Share in Safari and choose Add to Home
                Screen.
              </p>
            ) : (
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {isAndroidPromptReady
                  ? "Install for faster access, offline support, and a full-screen experience."
                  : "Open your browser menu and tap Install app or Add to Home screen."}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0"
            onClick={onDismiss}
            aria-label="Dismiss install prompt"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {isAndroidPromptReady ? (
            <Button type="button" size="sm" onClick={() => void onInstall()}>
              <Download className="size-4" />
              Install app
            </Button>
          ) : null}

          <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
