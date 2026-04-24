/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { db, auth, signIn, logOut, ALLOWED_EMAILS } from './lib/firebase';
import { useAuthors } from './contexts/AuthorsContext';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Menu, X } from 'lucide-react';

import Home from './pages/Home';
import Write from './pages/Write';
import PostView from './pages/PostView';
import Profile from './pages/Profile';
import EditPost from './pages/EditPost';
import Sidebar from './components/Sidebar';
import PWAInstallButton from './components/PWAInstallButton';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { ensureAuthorProfile, authorsMap } = useAuthors();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        await ensureAuthorProfile(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && authorsMap.has(user.uid)) {
      const author = authorsMap.get(user.uid);
      // Fallback: If isWriter is somehow undefined (old accounts), treat them as writers based on the 6 limit or just allow
      setIsAllowed(author?.isWriter === true || author?.isWriter === undefined);
    } else if (user && ALLOWED_EMAILS.includes(user.email || '')) {
      // Fallback for immediate load
      setIsAllowed(true);
    } else {
      setIsAllowed(false);
    }
  }, [user, authorsMap]);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center text-xl">جاري التحميل...</div>;

  return (
    <Router>
      <div className="h-screen w-full flex flex-col overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-main)]">
        {/* Header */}
        <header className="h-[60px] bg-white border-b border-[var(--color-border-app)] flex items-center justify-between px-4 md:px-[40px] shrink-0 gap-4">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden flex items-center text-[var(--color-primary-app)]" 
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <Link to="/" className="flex items-center gap-[10px] text-[20px] md:text-[24px] font-bold text-[var(--color-primary-app)] shrink-0">
              <div className="w-[30px] h-[30px] bg-[var(--color-accent-app)] rounded-[6px] hidden sm:block"></div>
              <span className="hidden sm:inline">مدونة التدبر</span>
            </Link>
          </div>
          
          <PWAInstallButton />
          
          <div className="flex items-center gap-[15px] text-[14px] text-[var(--color-accent-app)] shrink-0">
            {user ? (
              <>
                <Link to="/profile" className="flex items-center gap-[10px] hover:bg-gray-50 px-2 py-1 rounded cursor-pointer transition-colors" title="إدارة حسابي وتدويناتي">
                  <span className="font-medium hidden md:inline">
                    مرحباً، {user.displayName || user.email}
                  </span>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || "User"} className="w-[35px] h-[35px] rounded-full object-cover bg-[#ddd]" />
                  ) : (
                    <div className="w-[35px] h-[35px] bg-[#ddd] rounded-full flex items-center justify-center font-bold text-gray-500">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                </Link>
                
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
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* Mobile Sidebar Overlay */}
          {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50 flex" onClick={() => setIsMobileMenuOpen(false)}>
              <div 
                className="bg-[var(--color-sidebar-bg)] h-full w-[260px] shadow-2xl relative"
                onClick={e => e.stopPropagation()}
              >
                <button 
                  className="absolute top-4 left-4 p-2 text-gray-500 hover:text-black absolute"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X size={24} />
                </button>
                <div onClick={() => setIsMobileMenuOpen(false)} className="h-full">
                  <Sidebar isAllowed={isAllowed} />
                </div>
              </div>
            </div>
          )}

          <div className="hidden md:flex shrink-0">
            <Sidebar isAllowed={isAllowed} />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 p-4 md:p-[40px] flex flex-col gap-[20px] bg-[var(--color-bg-base)] overflow-y-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/post/:id" element={<PostView user={user} />} />
              <Route path="/write" element={<Write user={user} isAllowed={isAllowed} />} />
              <Route path="/edit/:id" element={<EditPost user={user} isAllowed={isAllowed} />} />
              <Route path="/profile" element={<Profile user={user} isAllowed={isAllowed} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

