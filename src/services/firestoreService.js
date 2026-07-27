import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../firebase";

export async function uploadFile(file, folder) {
  if (!file) {
    return "";
  }

  const timestamp = Date.now();
  const storageRef = ref(storage, `${folder}/${timestamp}-${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function updateUserProfile(uid, data) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getUserProfile(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

export async function createUserProfile(uid, data) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { ...data, createdAt: serverTimestamp() });
}

export async function fetchMedicineByBarcode(barcode) {
  const medicinesRef = collection(db, "medicines");
  const q = query(medicinesRef, where("barcode", "==", barcode));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const docItem = snapshot.docs[0];
  return { id: docItem.id, ...docItem.data() };
}

export async function fetchMedicines() {
  const medicinesRef = collection(db, "medicines");
  const q = query(medicinesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
}

export async function addMedicine(data) {
  const medicinesRef = collection(db, "medicines");
  const docRef = await addDoc(medicinesRef, {
    ...data,
    createdAt: serverTimestamp(),
    status: data.status || "verified",
  });
  return docRef.id;
}

export async function addReport(data) {
  const reportsRef = collection(db, "reports");
  const docRef = await addDoc(reportsRef, {
    ...data,
    reportedAt: serverTimestamp(),
    status: data.status || "submitted",
  });
  return docRef.id;
}

export async function addHistoryEntry(data) {
  const historyRef = collection(db, "history");
  const docRef = await addDoc(historyRef, {
    ...data,
    scannedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function fetchUserHistory(uid) {
  const historyRef = collection(db, "history");
  const q = query(historyRef, where("uid", "==", uid), orderBy("scannedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
}
