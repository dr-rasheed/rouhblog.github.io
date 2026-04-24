import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, query, orderBy } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const snap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')));
    console.log("SUCCESS! Found docs:", snap.size);
  } catch (err: any) {
    console.error("ERROR:", err.code, err.message);
  }
  process.exit(0);
}
run();
