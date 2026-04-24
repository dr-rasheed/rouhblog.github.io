import { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, MoreVertical } from 'lucide-react';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
      // Browser supports the programmatic prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Either iOS, or already installed, or browser doesn't support programmatic prompt
      setShowModal(true);
    }
  };

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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold p-2"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-[var(--color-primary-app)] mb-4 mt-2 text-center">
              تحميل التطبيق
            </h3>
            
            {isIOS ? (
              <div className="flex flex-col items-center text-center gap-4 text-sm text-gray-700 leading-relaxed mb-6">
                <p>لتثبيت التطبيق على جهاز <strong>iPhone</strong> أو <strong>iPad</strong>:</p>
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg w-full justify-center">
                  <span>1. اضغط على زر المشاركة</span>
                  <Share size={18} className="text-blue-500" />
                </div>
                <div className="flex flex-col items-center gap-2 bg-gray-50 px-4 py-3 rounded-lg w-full justify-center">
                  <div className="flex items-center gap-2">
                    <span>2. اختر "إضافة للشاشة الرئيسية"</span>
                    <PlusSquare size={18} className="text-gray-500" />
                  </div>
                  <span className="text-xs text-gray-400 font-mono">Add to Home Screen</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-4 text-sm text-gray-700 leading-relaxed mb-6">
                <p>إذا لم تظهر رسالة التثبيت التلقائية، يمكنك التثبيت يدوياً:</p>
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg w-full justify-center">
                  <span>1. افتح قائمة المتصفح</span>
                  <MoreVertical size={18} className="text-gray-600" />
                </div>
                <div className="flex flex-col items-center gap-2 bg-gray-50 px-4 py-3 rounded-lg w-full justify-center">
                  <div className="flex items-center gap-2">
                    <span>2. اختر "تثبيت التطبيق" أو "إضافة للشاشة"</span>
                    <Download size={18} className="text-gray-500" />
                  </div>
                  <span className="text-xs text-gray-400 font-mono">Install App / Add to Home Screen</span>
                </div>
              </div>
            )}

            <button 
              onClick={() => setShowModal(false)}
              className="w-full bg-[var(--color-primary-app)] text-white py-[10px] rounded font-bold hover:bg-opacity-90 transition-colors"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
}