import React, { useEffect, useState } from 'react';
import {
  Download,
  X,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Smartphone,
  ExternalLink,
  MoreVertical,
  Copy,
  Check,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useGameStore } from '../hooks/useGameStore';

interface ApkInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkInstallModal: React.FC<ApkInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const { language } = useGameStore();
  const isUr = language === 'ur';
  const [installing, setInstalling] = useState<boolean>(false);
  const [inIframe, setInIframe] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    try {
      setInIframe(window.self !== window.top);
    } catch {
      setInIframe(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const chromeInstallUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/?install=1` : '/';

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      try {
        const ok = await install();
        if (ok) {
          onClose();
        }
      } finally {
        setInstalling(false);
      }
    }
  };

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(chromeInstallUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none font-sans overflow-y-auto">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto my-auto bg-gradient-to-b from-[#111f38] via-[#091426] to-[#040a14] border-2 border-amber-400/80 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Home Screen App Icon Preview Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shadow-xl shrink-0">
            <img
              src="/pwa-192x192.png"
              alt="Dragon Tiger App Icon"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-emerald-600 text-white font-black px-1 rounded shadow">
              APP
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-1.5">
              <span>{isUr ? 'Dragon Tiger ایپ انسٹال کریں' : 'Install Dragon Tiger App'}</span>
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-300 font-medium">
              Created by Alvi Games · Add to Home Screen
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />{' '}
                {isUr ? 'آئیکون سمیت موبائل ہوم اسکرین ایپ' : 'Installs With Game Icon'}
              </span>
            </div>
          </div>
        </div>

        {/* App Details */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-center mb-4">
          <div>
            <span className="block text-[9px] text-slate-400 uppercase font-bold">
              {isUr ? 'پلیٹ فارم' : 'Platform'}
            </span>
            <span className="text-xs font-black text-amber-200">Android & iOS</span>
          </div>
          <div className="border-x border-slate-800">
            <span className="block text-[9px] text-slate-400 uppercase font-bold">
              {isUr ? 'موڈ' : 'Display'}
            </span>
            <span className="text-xs font-black text-emerald-300">
              {isUr ? 'ہوم اسکرین ایپ' : 'Standalone'}
            </span>
          </div>
          <div>
            <span className="block text-[9px] text-slate-400 uppercase font-bold">
              {isUr ? 'آئیکون' : 'Icon'}
            </span>
            <span className="text-xs font-black text-yellow-300">
              {isUr ? 'گیم آئیکون' : 'Official Icon'}
            </span>
          </div>
        </div>

        {/* Direct Native Install / Add to Home Screen Action */}
        {isInstalled ? (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-2.5 text-xs text-emerald-200 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              {isUr
                ? 'Dragon Tiger پہلے سے آپ کے موبائل کی ہوم اسکرین پر آئیکون کے ساتھ انسٹال ہے!'
                : 'Dragon Tiger is already installed on your home screen with its app icon!'}
            </span>
          </div>
        ) : (
          <div className="space-y-2.5 mb-4">
            {isInstallable ? (
              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl hover:brightness-110 active:scale-98 transition cursor-pointer disabled:opacity-70"
              >
                <Download className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                <span>
                  {installing
                    ? isUr
                      ? 'انسٹال پاپ اپ کھل رہا ہے...'
                      : 'Opening Install Popup...'
                    : isUr
                    ? 'انسٹال کریں (آئیکون کے ساتھ)'
                    : 'Install Dragon Tiger (With Icon)'}
                </span>
              </button>
            ) : inIframe ? (
              <>
                <a
                  href={chromeInstallUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl hover:brightness-110 active:scale-98 transition cursor-pointer"
                >
                  <ExternalLink className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                  <span>
                    {isUr
                      ? 'کروم میں کھولیں اور انسٹال کریں'
                      : 'Open in Chrome Tab to Install'}
                  </span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-200 flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isUr ? 'لنک کاپی ہو گیا!' : 'Chrome Link Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isUr ? 'کروم لنک کاپی کریں' : 'Copy Link for Google Chrome'}</span>
                    </>
                  )}
                </button>
              </>
            ) : null}

            {!isInstallable && (
              <div className="space-y-2 text-[11px] text-slate-200 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                  <Smartphone className="w-4 h-4" />
                  <span>
                    {isUr
                      ? 'گوگل کروم سے آئیکون سمیت انسٹال کرنے کا طریقہ:'
                      : 'Add to Home Screen in Google Chrome:'}
                  </span>
                </div>
                {isIOS ? (
                  <p className="text-slate-300 leading-relaxed">
                    {isUr ? (
                      <>
                        Safari میں نیچے <strong>Share (↑)</strong> بٹن دبائیں اور{' '}
                        <strong>Add to Home Screen</strong> پر کلک کریں — گیم کا آئیکون ہوم اسکرین پر آ جائے گا!
                      </>
                    ) : (
                      <>
                        In Safari, tap <strong>Share (↑)</strong> and choose{' '}
                        <strong>Add to Home Screen</strong> to install Dragon Tiger with its icon.
                      </>
                    )}
                  </p>
                ) : (
                  <div className="space-y-1.5 text-slate-300 leading-relaxed">
                    {inIframe && (
                      <p className="text-amber-200 font-semibold">
                        {isUr
                          ? 'پریویو ونڈو کے اندر گوگل کا انسٹال آپشن بلاک ہوتا ہے۔ اوپر سبز بٹن سے کروم ٹیب میں کھولیں، پھر APK دبائیں یا:'
                          : 'Browser security disables Install inside preview frames. Open in Chrome via the green button above, then tap APK or:'}
                      </p>
                    )}
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-amber-300">1.</span>
                      <span>
                        {isUr ? (
                          <>
                            کروم کے اوپر کونے میں <MoreVertical className="w-3.5 h-3.5 inline text-white" />{' '}
                            <strong>تین نقطوں (3 dots)</strong> پر کلک کریں۔
                          </>
                        ) : (
                          <>
                            Tap the <MoreVertical className="w-3.5 h-3.5 inline text-white" />{' '}
                            <strong>three-dot menu (⋮)</strong> in Chrome&apos;s top-right corner.
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-amber-300">2.</span>
                      <span>
                        {isUr ? (
                          <>
                            <strong>&quot;Add to Home screen&quot;</strong> یا <strong>&quot;Install app&quot;</strong> منتخب کریں۔
                          </>
                        ) : (
                          <>
                            Select <strong>&quot;Add to Home screen&quot;</strong> or <strong>&quot;Install app&quot;</strong>.
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-amber-300">3.</span>
                      <span>
                        {isUr ? (
                          <>
                            <strong>Install</strong> دبائیں — گیم اپنے آئیکون سمیت موبائل میں انسٹال ہو جائے گی!
                          </>
                        ) : (
                          <>
                            Tap <strong>Install</strong> — Dragon Tiger installs onto your phone with its official icon!
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
          <span>🔒 Dragon Tiger Official Web App</span>
          <span className="text-amber-300 font-semibold">Created by Alvi Games</span>
        </div>
      </div>
    </div>
  );
};
