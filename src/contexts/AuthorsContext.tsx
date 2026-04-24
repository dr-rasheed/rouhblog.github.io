import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';

export interface AuthorProfile {
  uid: string;
  shortId: number;
  displayName: string;
  photoURL: string;
  isWriter?: boolean;
}

interface AuthorsContextType {
  authorsMap: Map<string, AuthorProfile>;
  authorsByShortId: Map<number, AuthorProfile>;
  ensureAuthorProfile: (user: User) => Promise<void>;
}

const AuthorsContext = createContext<AuthorsContextType | null>(null);

export function AuthorsProvider({ children }: { children: React.ReactNode }) {
  const [authorsMap, setAuthorsMap] = useState<Map<string, AuthorProfile>>(new Map());
  const [authorsByShortId, setAuthorsByShortId] = useState<Map<number, AuthorProfile>>(new Map());

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'authors'), (snap) => {
      const newMap = new Map<string, AuthorProfile>();
      const newShortMap = new Map<number, AuthorProfile>();
      
      snap.forEach(d => {
        const data = d.data() as AuthorProfile;
        newMap.set(data.uid, data);
        if (data.shortId) {
          newShortMap.set(data.shortId, data);
        }
      });
      
      setAuthorsMap(newMap);
      setAuthorsByShortId(newShortMap);
    }, (err) => {
      console.error("Error fetching authors list", err);
    });

    return () => unsub();
  }, []);

  const ensureAuthorProfile = async (user: User) => {
    const ref = doc(db, 'authors', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      // Check existing writers
      const authorsQuery = await getDocs(collection(db, 'authors'));
      const writersCount = authorsQuery.docs.filter(d => d.data().isWriter === true || d.data().isWriter === undefined).length;
      const isWriter = writersCount < 6;

      // Create profile with a random 4 digit simple number for URL sharing
      let shortId = Math.floor(Math.random() * 9000) + 1000;
      await setDoc(ref, {
        uid: user.uid,
        shortId,
        displayName: user.displayName || user.email?.split('@')[0] || 'كاتب',
        photoURL: user.photoURL || '',
        isWriter
      });
    } else {
      // Backward compatibility: If the field is missing, you can treat them as a writer if < 6 or just leave it.
      // Easiest is to set it now if it's undefined and they are the owner
      if (snap.data().isWriter === undefined) {
         await setDoc(ref, { isWriter: true }, { merge: true });
      }
    }
  };

  return (
    <AuthorsContext.Provider value={{ authorsMap, authorsByShortId, ensureAuthorProfile }}>
      {children}
    </AuthorsContext.Provider>
  );
}

export const useAuthors = () => {
  const context = useContext(AuthorsContext);
  if (!context) throw new Error("useAuthors must be used within AuthorsProvider");
  return context;
};
