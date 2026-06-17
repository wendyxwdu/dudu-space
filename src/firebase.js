import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwl7zy-bMegsFw-MKrJ1Wz-YCHmbHGH8Y",
  authDomain: "dudu-space.firebaseapp.com",
  projectId: "dudu-space",
  storageBucket: "dudu-space.firebasestorage.app",
  messagingSenderId: "608634436525",
  appId: "1:608634436525:web:95095635a67c7a645a3f24",
  measurementId: "G-FQ4C3DBC6C"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Reference to the single shared data document
export const dataRef = doc(db, "app", "data");
export const settingsRef = doc(db, "app", "settings");

// Save app data to Firestore
export const saveData = async (data) => {
  try {
    await setDoc(dataRef, data, { merge: true });
  } catch (e) {
    console.error("Save error:", e);
  }
};

// Save settings to Firestore
export const saveSettings = async (settings) => {
  try {
    await setDoc(settingsRef, settings, { merge: true });
  } catch (e) {
    console.error("Settings save error:", e);
  }
};

// Listen for real-time changes
export const listenData = (callback) => {
  return onSnapshot(dataRef, (snap) => {
    if (snap.exists()) callback(snap.data());
  });
};

export const listenSettings = (callback) => {
  return onSnapshot(settingsRef, (snap) => {
    if (snap.exists()) callback(snap.data());
  });
};

// Upload file to Cloudinary (images + videos)
const CLOUD_NAME = "daztjuxmr";
const UPLOAD_PRESET = "dudu_space";

export const uploadFile = async (base64Data) => {
  try {
    const formData = new FormData();
    formData.append("file", base64Data);
    formData.append("upload_preset", UPLOAD_PRESET);

    // Detect if video
    const isVideo = base64Data.startsWith("data:video/");
    const resourceType = isVideo ? "video" : "image";

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    return data.secure_url;
  } catch (e) {
    console.error("Upload error:", e);
    return base64Data; // fallback to base64 if upload fails
  }
};
