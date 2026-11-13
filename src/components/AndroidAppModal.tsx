/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Smartphone, FolderArchive, Code2, Sparkles, X, ShieldCheck, CheckCircle2,
  Download, Check, Copy, Terminal, Globe, Info, Wifi, WifiOff
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsAndroid(/android/.test(ua));
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        setIsInstallable(false);
      } catch (err) {
        console.error('PWA install error:', err);
      }
    }
  }, [deferredPrompt]);

  return { isInstallable, isInstalled, install, isIOS, isAndroid };
}

export function AndroidAppModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'install' | 'project' | 'code' | 'cloud'>('install');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const javaCode = `package com.gmu.campusphear;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Campus Sphere - GMU Native Android Portal
        // Hardware accelerated WebView with native bridge
    }
}`;

  const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.gmu.campusphear">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Campus Sphere"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme.NoActionBarLaunch">

        <activity
            android:name=".MainActivity"
            android:label="Campus Sphere"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

    <uses-permission android:name="android.permission.INTERNET" />
</manifest>`;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn" id="android-app-modal-backdrop">
      <div className="bg-slate-900 border border-slate-700/80 max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-sky-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-sky-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/20">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white font-serif">Campus Sphere Android App</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                  Java Native Project Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Package: <span className="font-mono text-sky-400">com.gmu.campusphear</span> • GM University Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Android App Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/50 text-xs font-semibold gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('install')}
            className={`py-3 border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'install'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Direct Phone Install (APK/WebAPK)</span>
          </button>
          <button
            onClick={() => setActiveTab('project')}
            className={`py-3 border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'project'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>Download Android Studio Project (.ZIP)</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'code'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Java & Manifest Code</span>
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`py-3 border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'cloud'
                ? 'border-fuchsia-500 text-fuchsia-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Cloud APK Builder</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 to-blue-950/40 border border-sky-500/30 flex items-start space-x-3.5">
                <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-bold text-sm">Real Android App Architecture</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    The entire GMU engineering portal is packaged as an Android application. When installed, it runs full-screen with native hardware acceleration, instant local caching, and the official GMU crest launcher icon.
                  </p>
                </div>
              </div>

              {isInstalled ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center space-x-3 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold text-white text-sm">App Already Installed on This Device!</p>
                    <p className="text-xs text-emerald-300/80">
                      Campus Sphere is running as an Android standalone application.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={install}
                    disabled={!isInstallable}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${
                      isInstallable
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/25 active:scale-98 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isInstallable
                        ? 'Install Android App on this Phone Now'
                        : 'Tap Chrome Menu (⋮) > Install App'}
                    </span>
                  </button>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Step-by-Step for any Android device:
                    </h5>
                    <ol className="text-xs space-y-2 text-slate-300 list-decimal list-inside leading-relaxed">
                      <li>
                        Open this portal link in <strong className="text-white">Google Chrome</strong> on your Android phone.
                      </li>
                      <li>
                        Tap the <strong className="text-white">3 vertical dots (⋮)</strong> at top right corner.
                      </li>
                      <li>
                        Select <strong className="text-emerald-400">&quot;Install app&quot;</strong> or{' '}
                        <strong className="text-emerald-400">&quot;Add to Home screen&quot;</strong>.
                      </li>
                      <li>
                        Tap <strong className="text-white">&quot;Install&quot;</strong> — Android places the app directly on your home screen &amp; app drawer!
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'project' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start space-x-3.5">
                <FolderArchive className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-bold text-sm">Download Native Android Studio Project</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    We generated the full native Android project with Java source code (
                    <code className="text-emerald-300">MainActivity.java</code>), Gradle wrapper,{' '}
                    <code className="text-emerald-300">AndroidManifest.xml</code>, app icons, and assets bundled.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">CampusSphear-Android-Project.zip</span>
                  <span className="text-emerald-400 font-bold">~0.85 MB • Ready</span>
                </div>
                <a
                  href="/CampusSphear-Android-Project.zip"
                  download="CampusSphear-Android-Project.zip"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/30 active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Complete Android Studio Project (.ZIP)</span>
                </a>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <h5 className="font-bold text-white uppercase tracking-wider">
                  How to Build the APK in Android Studio:
                </h5>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                  <li>Unzip the downloaded file on your computer.</li>
                  <li>
                    Open <strong className="text-white">Android Studio</strong> and click{' '}
                    <strong className="text-white">Open</strong>.
                  </li>
                  <li>
                    Select the extracted <code className="text-sky-300">android/</code> directory.
                  </li>
                  <li>
                    Go to menu:{' '}
                    <strong className="text-white">
                      Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)
                    </strong>
                    .
                  </li>
                  <li>
                    Your installable <code className="text-emerald-300">app-debug.apk</code> is ready! Send it to your phone and tap to install!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    android/app/src/main/java/com/gmu/campusphear/MainActivity.java
                  </span>
                  <button
                    onClick={() => handleCopy(javaCode, 'java')}
                    className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
                  >
                    {copiedKey === 'java' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'java' ? 'Copied' : 'Copy Java'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                  {javaCode}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-400">
                    android/app/src/main/AndroidManifest.xml
                  </span>
                  <button
                    onClick={() => handleCopy(manifestXml, 'manifest')}
                    className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
                  >
                    {copiedKey === 'manifest' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'manifest' ? 'Copied' : 'Copy XML'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-sky-300 overflow-x-auto max-h-48">
                  {manifestXml}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start space-x-3.5">
                <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-bold text-sm">Automated Cloud APK Generation</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Don&apos;t have Android Studio installed on your computer? You can use automated cloud tools to compile this project into a signed Android APK file for free!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h5 className="font-bold text-white flex items-center space-x-1.5">
                    <Terminal className="w-4 h-4 text-sky-400" />
                    <span>1. GitHub Actions (Automated)</span>
                  </h5>
                  <p className="text-slate-400">
                    We included <code className="text-sky-300">.github/workflows/build-apk.yml</code>. Whenever you push to GitHub, it automatically spins up an Ubuntu VM with Android SDK, runs Gradle, and outputs the installable{' '}
                    <code className="text-emerald-300">app-debug.apk</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h5 className="font-bold text-white flex items-center space-x-1.5">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>2. Microsoft PWABuilder</span>
                  </h5>
                  <p className="text-slate-400">
                    Visit <strong className="text-white">pwabuilder.com</strong>, paste your app URL, and click{' '}
                    <strong className="text-white">Package for Android</strong>. It generates a signed APK / AAB package ready for Android devices and Google Play in under 60 seconds!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono">Capacitor Android Runtime v7.0</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function AndroidAppLauncher({
  variant = 'navbar',
  className = '',
}: {
  variant?: 'navbar' | 'prominent' | 'card';
  className?: string;
}) {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setIsModalOpen(true);
    }
  };

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <>
          <div className={`p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-300 text-sm ${className}`}>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-white">Campus Sphere Android App</p>
                <p className="text-xs text-emerald-300/80">Running as a native standalone application.</p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs text-sky-400 hover:text-sky-300 underline font-medium cursor-pointer"
            >
              App Info
            </button>
          </div>
          <AndroidAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
      );
    }
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/40 transition-colors cursor-pointer ${className}`}
          title="Campus Sphere Android App Details"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Android App</span>
        </button>
        <AndroidAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      {variant === 'navbar' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className={`relative group flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer ${className}`}
          title="Android App Options & Download"
          id="android-app-navbar-trigger"
        >
          <Smartphone className="w-3.5 h-3.5 animate-pulse" />
          <span>Android App</span>
          <span className="px-1.5 py-0.5 bg-black/25 rounded text-[10px] text-white font-mono uppercase">
            APK
          </span>
        </button>
      )}

      {variant === 'prominent' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center justify-center space-x-3 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-sky-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-600/30 hover:shadow-sky-500/50 active:scale-98 border border-white/20 cursor-pointer ${className}`}
        >
          <Smartphone className="w-5 h-5 text-emerald-200 animate-bounce" />
          <div className="text-left">
            <div className="text-xs text-cyan-200 uppercase tracking-wider font-bold">Android Application Ready</div>
            <div className="text-sm font-bold text-white">Download APK / Install on Phone</div>
          </div>
          <Download className="w-4 h-4 ml-1 text-white/80" />
        </button>
      )}

      {variant === 'card' && (
        <div className={`p-4 bg-slate-900/90 border border-sky-500/30 rounded-xl space-y-3 ${className}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Campus Sphere Android App</h4>
                <p className="text-xs text-slate-400">Native Java project &amp; direct phone install</p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
              title="Android Options & Project Download"
              aria-label="Android Options & Project Download"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleInstallClick}
              className="py-2.5 px-3 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md transition-all active:scale-98 cursor-pointer"
              id="android-app-card-trigger"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstallable ? 'Install Now' : 'Install on Phone'}</span>
            </button>
            <a
              href="/CampusSphear-Android-Project.zip"
              download="CampusSphear-Android-Project.zip"
              className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-98"
            >
              <FolderArchive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Android (.ZIP)</span>
            </a>
          </div>
        </div>
      )}

      <AndroidAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

export function OfflineStatusToast() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return showReconnected ? (
    <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-lg border border-emerald-400/40 animate-bounce">
      <Wifi className="w-4 h-4" />
      <span>Back online! Reconnected to GMU Portal.</span>
    </div>
  ) : (
    <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 bg-amber-600 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-xl border border-amber-300">
      <WifiOff className="w-4 h-4 animate-pulse text-slate-950" />
      <span>Offline Mode — Cached data and offline capabilities active.</span>
    </div>
  );
}
