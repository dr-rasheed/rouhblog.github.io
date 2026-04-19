/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, signIn, logOut, ALLOWED_EMAILS, db } from './lib/firebase';

import Home from './pages/Home';
import Write from './pages/Write';
import PostView from './pages/PostView';
import Sidebar from './components/Sidebar';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editableName, setEditableName] = useState('');
  const [updatingPosts, setUpdatingPosts] = useState(false);

  const handleNameClick = () => {
    if (!user) return;
    setEditableName(user.displayName || user.email || '');
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    const newName = editableName.trim();
    setIsEditingName(false);
    if (!user || !newName || newName === user.displayName) return;
    
    setUpdatingPosts(true);
    try {
      await updateProfile(user, { displayName: newName });
      
      // Update all previous posts by this user
      const q = query(collection(db, 'posts'), where('authorId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const batch = writeBatch(db);
        querySnapshot.forEach((docSnapshot) => {
          batch.update(docSnapshot.ref, { authorName: newName });
        });
        await batch.commit();
      }
      
      // Reload the page to reflect the new name in Sidebar and Home
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile or posts", error);
    } finally {
      setUpdatingPosts(false);
    }
  };

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
                {updatingPosts ? (
                  <span className="text-[14px]">جاري تحديث الاسم...</span>
                ) : isEditingName ? (
                  <input
                    type="text"
                    value={editableName}
                    onChange={(e) => setEditableName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                    autoFocus
                    disabled={updatingPosts}
                    className="px-[8px] py-[2px] border border-[var(--color-accent-app)] rounded outline-none text-[14px] text-[var(--color-primary-app)]"
                    placeholder="اسمك المعروض..."
                  />
                ) : (
                  <span 
                    onClick={handleNameClick} 
                    title="انقر لتعديل اسمك المعروض"
                    className="cursor-pointer hover:underline decoration-dashed underline-offset-4"
                  >
                    مرحباً، {user.displayName || user.email}
                  </span>
                )}
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
          <Sidebar isAllowed={isAllowed} />

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

