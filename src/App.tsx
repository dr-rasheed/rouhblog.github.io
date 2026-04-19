/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signIn, logOut, ALLOWED_EMAILS } from './lib/firebase';

import Home from './pages/Home';
import Write from './pages/Write';
import PostView from './pages/PostView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        setIsAllowed(ALLOWED_EMAILS.includes(currentUser.email));
      } else {
        setIsAllowed(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center text-xl">جاري التحميل...</div>;

  return (
    <Router>
      <div className="h-screen w-full flex flex-col overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-main)]">
        {/* Header */}
        <header className="h-[60px] bg-white border-b border-[var(--color-border-app)] flex items-center justify-between px-[40px] shrink-0">
          <Link to="/" className="flex items-center gap-[10px] text-[24px] font-bold text-[var(--color-primary-app)]">
            <div className="w-[30px] h-[30px] bg-[var(--color-accent-app)] rounded-[6px]"></div>
            <span>مدونة التدبر</span>
          </Link>
          
          <div className="flex items-center gap-[15px] text-[14px] text-[var(--color-accent-app)]">
            {user ? (
              <>
                <span>مرحباً، {user.displayName || user.email}</span>
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="w-[35px] h-[35px] rounded-full object-cover bg-[#ddd]" />
                ) : (
                  <div className="w-[35px] h-[35px] bg-[#ddd] rounded-full"></div>
                )}
                {isAllowed && (
                  <Link to="/write" className="mr-4 px-[10px] py-[4px] border border-[var(--color-accent-app)] rounded text-[var(--color-accent-app)] hover:bg-[var(--color-accent-app)] hover:text-white transition-colors">
                    اكتب تدبراً
                  </Link>
                )}
                <button onClick={logOut} className="px-[10px] py-[4px] text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors">
                  خروج
                </button>
              </>
            ) : (
              <button onClick={signIn} className="px-[10px] py-[4px] border border-[var(--color-border-app)] bg-white text-[var(--color-primary-app)] rounded hover:bg-[#fafafa] transition-colors cursor-pointer">
                دخول الكُتّاب
              </button>
            )}
          </div>
        </header>

        {/* Main Container */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-[260px] bg-[var(--color-sidebar-bg)] border-l border-[var(--color-border-app)] p-[25px] flex flex-col gap-[30px] overflow-y-auto shrink-0">
             <div className="flex flex-col">
               <h3 className="text-[13px] uppercase tracking-[1px] text-[var(--color-accent-app)] mb-[15px] border-b border-[var(--color-border-app)] pb-[5px]">روابط سريعة</h3>
               <ul className="list-none flex flex-col">
                 <li className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors">
                   <Link to="/" className="w-full block">الرئيسية</Link>
                 </li>
                 {isAllowed && (
                   <li className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors">
                     <Link to="/write" className="w-full block">إضافة تدوينة</Link>
                   </li>
                 )}
               </ul>
             </div>
             
             <div className="flex flex-col">
                <h3 className="text-[13px] uppercase tracking-[1px] text-[var(--color-accent-app)] mb-[15px] border-b border-[var(--color-border-app)] pb-[5px]">الكتاب الـ 10</h3>
                <ul className="list-none flex flex-col">
                  <li className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors">د. أحمد العلوي</li>
                  <li className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors">أ. سارة محمود</li>
                  <li className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors">د. يوسف خالد</li>
                  <li className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors">م. نورة فيصل</li>
                  <li className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors">أ. عمر حسن</li>
                </ul>
             </div>

             <div className="flex flex-col">
                <h3 className="text-[13px] uppercase tracking-[1px] text-[var(--color-accent-app)] mb-[15px] border-b border-[var(--color-border-app)] pb-[5px]">التصنيفات</h3>
                <ul className="list-none flex flex-col">
                  <li className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors">تدبر آية</li>
                  <li className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors">لطائف لغوية</li>
                  <li className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors">أسباب النزول</li>
                  <li className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors">مقاصد السور</li>
                </ul>
             </div>
             
             <div className="flex flex-col">
                <h3 className="text-[13px] uppercase tracking-[1px] text-[var(--color-accent-app)] mb-[15px] border-b border-[var(--color-border-app)] pb-[5px]">الأوسمة الشائعة</h3>
                <div className="flex flex-wrap gap-[8px]">
                  <span className="bg-white border border-[var(--color-border-app)] px-[10px] py-[4px] rounded-[4px] text-[12px]">#السكينة</span>
                  <span className="bg-white border border-[var(--color-border-app)] px-[10px] py-[4px] rounded-[4px] text-[12px]">#تأملات</span>
                  <span className="bg-white border border-[var(--color-border-app)] px-[10px] py-[4px] rounded-[4px] text-[12px]">#القرآن</span>
                  <span className="bg-white border border-[var(--color-border-app)] px-[10px] py-[4px] rounded-[4px] text-[12px]">#لغة</span>
                  <span className="bg-white border border-[var(--color-border-app)] px-[10px] py-[4px] rounded-[4px] text-[12px]">#إعجاز</span>
                </div>
             </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 p-[40px] flex flex-col gap-[20px] bg-[var(--color-bg-base)] overflow-y-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/post/:id" element={<PostView />} />
              <Route path="/write" element={<Write user={user} isAllowed={isAllowed} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

