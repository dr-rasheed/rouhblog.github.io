import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      alert('تم تحميل التطبيق مسبقاً أو غير مدعوم في هذا المتصفح.');
    }
  };

  // Only show button if we have a prompt available or if we are on iOS (where prompt is never fired programmatically)
  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      <button 
        onClick={handleInstallClick}
        className="flex items-center gap-[6px] mr-auto bg-[var(--color-accent-app)] text-white px-[12px] py-[6px] rounded hover:bg-opacity-90 font-medium text-[13px] transition-all"
        title="تحميل التطبيق على الهاتف"
      >
        <Download size={16} />
        <span className="hidden sm:inline">تحميل التطبيق</span>
      </button>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold p-2"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-[var(--color-primary-app)] mb-4 mt-2 text-center">تحميل التطبيق على الآيفون</h3>
            <p className="text-gray-700 text-sm leading-6 mb-4 text-center">
              لتحميل التطبيق على الآيفون، اضغط على زر المشاركة 
              <span className="inline-block mx-1 font-bold">Share</span>
              في أسفل المتصفح الخاص بك، ثم اختر 
              <br/>
              <span className="font-bold text-[var(--color-accent-app)]">"Add to Home Screen"</span>
              <br/>
              (إضافة إلى الصفحة الرئيسية).
            </p>
            <button 
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-[var(--color-primary-app)] text-white py-2 rounded font-bold"
            >
              فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
}
