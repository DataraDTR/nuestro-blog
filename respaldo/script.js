import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyARJfMHe30IWXoLtRN8zsXYJZ7U-f45ZCU",
  authDomain: "blog-44ec4.firebaseapp.com",
  projectId: "blog-44ec4",
  storageBucket: "blog-44ec4.firebasestorage.app",
  messagingSenderId: "477494348087",
  appId: "1:477494348087:web:1205d621cf3fad2c33b2b2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const pinForm = document.getElementById("pinForm");
const errorMessage = document.getElementById("errorMessage");

pinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const pin = document.getElementById("pinInput").value.trim();

  try {
    const configRef = doc(db, "config", "security");
    const configSnap = await getDoc(configRef);

    if (configSnap.exists() && configSnap.data().pin === pin) {
      console.log("PIN correcto, iniciando sesión anónima...");
      await signInAnonymously(auth);
      console.log("Sesión anónima iniciada con éxito");

      window.location.href = "galeria.html";
    } else {
      errorMessage.textContent = "PIN incorrecto. Intenta nuevamente.";
      errorMessage.style.color = "red";
    }
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    if (error.code === "auth/admin-restricted-operation") {
      errorMessage.textContent = "Error: La autenticación anónima no está habilitada en Firebase.";
    } else {
      errorMessage.textContent = "Error al validar el PIN o iniciar sesión. Verifica tu conexión.";
    }
    errorMessage.style.color = "red";
  }
});