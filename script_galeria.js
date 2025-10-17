import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyARJfMHe30IWXoLtRN8zsXYJZ7U-f45ZCU",
  authDomain: "blog-44ec4.firebaseapp.com",
  projectId: "blog-44ec4",
  storageBucket: "blog-44ec4.firebasestorage.app",
  messagingSenderId: "477494348087",
  appId: "1:477494348087:web:1205d621cf3fad2c33b2b2",
  measurementId: "G-Q236FFDCN3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const galleriesContainer = document.getElementById('galleries');
const modal = document.getElementById('galleryModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const createGalleryBtn = document.getElementById('createGalleryBtn');

let currentGalleryId = null;

// Función para lanzar confeti (opcional, romántico)
function launchConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = ['#ffafbd', '#ffc3a0', '#e91e63', '#a1c4fd'][Math.floor(Math.random() * 4)];
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

// Mostrar modal para crear nueva galería
createGalleryBtn.addEventListener('click', openCreateGalleryModal);

function openCreateGalleryModal() {
    currentGalleryId = null;
    modalTitle.textContent = 'Crear Nueva Galería';
    modalBody.innerHTML = `
        <form id="createGalleryForm" class="upload-form">
            <input type="text" id="newGalleryTitle" placeholder="Título de la galería" required>
            <input type="text" id="newGalleryIcon" placeholder="Ícono FontAwesome (e.g., fas fa-heart)">
            <input type="text" id="newGalleryDate" placeholder="Fecha (ej: 2023-2024)">
            <textarea id="newGalleryDescription" placeholder="Descripción romántica"></textarea>
            <button type="submit">Crear Galería ♥</button>
        </form>
        <div id="modalMessage"></div>
    `;

    const form = document.getElementById('createGalleryForm');
    const msg = document.getElementById('modalMessage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const title = document.getElementById('newGalleryTitle').value;
            const icon = document.getElementById('newGalleryIcon').value || 'fas fa-heart';
            const date = document.getElementById('newGalleryDate').value || '';
            const description = document.getElementById('newGalleryDescription').value || '';

            const galleryData = {
                title, icon, date, description,
                images: []  // Cambiado a 'images' para simplicidad
            };

            await addDoc(collection(db, 'galerias'), galleryData);
            msg.textContent = '¡Galería creada con amor! ♥';
            msg.style.color = 'green';
            launchConfetti();
            form.reset();
            setTimeout(() => { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }, 1500);
            loadGalleries();
        } catch (error) {
            console.error(error);
            msg.textContent = 'Error creando galería.';
            msg.style.color = 'red';
        }
    });

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Cerrar modal
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
});
modal.addEventListener('click', e => {
    if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Cargar galerías (MEJORADO: Previews + Contador)
async function loadGalleries() {
    galleriesContainer.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, 'galerias'));
    querySnapshot.forEach(docSnap => {
        const gallery = { id: docSnap.id, ...docSnap.data() };
        const card = document.createElement('div');
        card.className = 'gallery-card';

        // Generar previews (hasta 4, con placeholders)
        const previews = gallery.images ? gallery.images.slice(0, 4) : [];
        while (previews.length < 4) previews.push(null);

        const previewHTML = previews.map(img => 
            img ? `<div class="preview-img" style="background-image: url('${img.url}')"></div>` :
                  `<div class="preview-placeholder"><i class="fas fa-heart"></i></div>`
        ).join('');

        card.innerHTML = `
            <div class="gallery-preview">${previewHTML}</div>
            <div class="photo-count">${gallery.images ? gallery.images.length : 0}</div>
            <div class="gallery-info">
                <h3 class="gallery-title"><i class="${gallery.icon} gallery-icon"></i> ${gallery.title}</h3>
                <div class="gallery-date">${gallery.date}</div>
                <p class="gallery-description">${gallery.description}</p>
            </div>
        `;
        card.addEventListener('click', () => openGalleryModal(gallery));
        galleriesContainer.appendChild(card);
    });
}

// Modal de galería (MEJORADO: Muestra descripciones + Zoom)
function openGalleryModal(gallery) {
    currentGalleryId = gallery.id;
    modalTitle.innerHTML = `<i class="${gallery.icon}"></i> ${gallery.title}`;
    modalBody.innerHTML = `
        <form id="addPhotosForm" class="upload-form">
            <input type="text" id="photoDesc" placeholder="Descripción romántica de la foto">
            <input type="file" id="photoFile" accept="image/*" required>
            <button type="submit">Agregar Foto ♥</button>
        </form>
        <div id="photosContainer"></div>
        <div id="modalMessage"></div>
    `;

    const form = document.getElementById('addPhotosForm');
    const photosContainer = document.getElementById('photosContainer');
    const msg = document.getElementById('modalMessage');

    // Renderizar fotos con descripciones
    (gallery.images || []).forEach(imgObj => {
        const photoDiv = document.createElement('div');
        photoDiv.className = 'modal-photo';
        photoDiv.style.backgroundImage = `url('${imgObj.url}')`;
        photoDiv.innerHTML = `<div class="photo-desc">${imgObj.desc}</div>`;
        photoDiv.addEventListener('click', () => photoDiv.classList.toggle('zoomed'));
        photosContainer.appendChild(photoDiv);
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const file = document.getElementById('photoFile').files[0];
        const desc = document.getElementById('photoDesc').value || 'Un momento de amor ♥';
        if (!file) return;

        try {
            const storageRef = ref(storage, `galerias/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            const galleryRef = doc(db, 'galerias', currentGalleryId);
            await updateDoc(galleryRef, {
                images: arrayUnion({ url, desc })
            });

            // Agregar a UI
            const photoDiv = document.createElement('div');
            photoDiv.className = 'modal-photo';
            photoDiv.style.backgroundImage = `url('${url}')`;
            photoDiv.innerHTML = `<div class="photo-desc">${desc}</div>`;
            photoDiv.addEventListener('click', () => photoDiv.classList.toggle('zoomed'));
            photosContainer.appendChild(photoDiv);

            msg.textContent = '¡Foto agregada con amor! ♥';
            msg.style.color = 'green';
            launchConfetti();
            form.reset();
            loadGalleries();  // Recarga previews
        } catch (err) {
            console.error(err);
            msg.textContent = 'Error al subir la foto.';
            msg.style.color = 'red';
        }
    });

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => loadGalleries());