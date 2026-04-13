console.log('cloud name:', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const addContent = async (data) => {
  try {
    const docRef = await addDoc(collection(db, 'contents'), {
      ...data,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('İçerik eklenirken hata:', error);
    throw error;
  }
};

export const subscribeToContents = (callback) => {
  const q = query(collection(db, 'contents'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const contents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(contents);
  });
};

export const uploadImage = async (file, userId) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'wonmapp_preset');
  formData.append('api_key', apiKey);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
};

export const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};
export const rateContent = async (contentId, user, rating) => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    const contentRef = doc(db, 'contents', contentId);
    await updateDoc(contentRef, {
      [`ratings.${user}`]: rating
    });
  } catch (error) {
    console.error('Puanlama hatası:', error);
    throw error;
  }
};
export const deleteContent = async (contentId) => {
  try {
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'contents', contentId));
  } catch (error) {
    console.error('Silme hatası:', error);
    throw error;
  }
};

export const commentContent = async (contentId, user, commentText) => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    const contentRef = doc(db, 'contents', contentId);
    await updateDoc(contentRef, {
      [`comments.${user}`]: commentText
    });
  } catch (error) {
    console.error('Yorum hatası:', error);
    throw error;
  }
};