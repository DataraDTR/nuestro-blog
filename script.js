const firebaseConfig = {
  apiKey: "AIzaSyARJfMHe30IWXoLtRN8zsXYJZ7U-f45ZCU",
  authDomain: "blog-44ec4.firebaseapp.com",
  projectId: "blog-44ec4",
  storageBucket: "blog-44ec4.firebasestorage.app",
  messagingSenderId: "477494348087",
  appId: "1:477494348087:web:1205d621cf3fad2c33b2b2",
  measurementId: "G-Q236FFDCN3"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.getAuth(app);
const db = firebase.getFirestore(app);

const pinForm = document.getElementById('pinForm');
const errorMessage = document.getElementById('errorMessage');

pinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = document.getElementById('pinInput').value;
    console.log('PIN ingresado:', pin);
    
    try {
        const configRef = firebase.doc(db, 'config', 'security');
        const configSnap = await firebase.getDoc(configRef);
        console.log('Datos de Firestore:', configSnap.data());
        if (configSnap.exists() && configSnap.data().pin === pin) {
            console.log('PIN válido en Firestore, intentando autenticación con:', 'blog@midatara.com', pin);
            const result = await firebase.signInWithEmailAndPassword(auth, 'blog@midatara.com', pin);
            console.log('Autenticación exitosa:', result.user);
            window.location.href = 'galeria.html';
        } else {
            errorMessage.textContent = 'PIN incorrecto. Intenta nuevamente. Verifica que coincida con Firestore.';
        }
    } catch (error) {
        console.error('Error de autenticación:', error);
        errorMessage.textContent = `Error al validar el PIN: ${error.message}. Verifica tu conexión o datos.`;
    }
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker registrado'))
        .catch(err => console.error('Error registrando SW:', err));
}