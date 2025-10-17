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
    
    try {
        const configRef = firebase.doc(db, 'config', 'security');
        const configSnap = await firebase.getDoc(configRef);
        if (configSnap.exists() && configSnap.data().pin === pin) {
            await firebase.signInWithEmailAndPassword(auth, 'acceso@amorgaleria.com', pin);
            window.location.href = 'galeria.html';
        } else {
            errorMessage.textContent = 'PIN incorrecto. Intenta nuevamente.';
        }
    } catch (error) {
        console.error('Error de autenticación:', error);
        errorMessage.textContent = 'Error al validar el PIN. Verifica tu conexión.';
    }
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker registrado'))
        .catch(err => console.error('Error registrando SW:', err));
}