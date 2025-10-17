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

// Mostrar modal para crear nueva galería
createGalleryBtn.addEventListener('click', openCreateGalleryModal);

function openCreateGalleryModal() {
    currentGalleryId = null;
    modalTitle.textContent = 'Crear Nueva Galería';
    modalBody.innerHTML = `
        <form id="createGalleryForm" class="upload-form">
            <input type="text" id="newGalleryTitle" placeholder="Título de la galería">
            <input type="text" id="newGalleryIcon" placeholder="Ícono FontAwesome (e.g., fas fa-heart)">
            <input type="text" id="newGalleryDate" placeholder="Fecha (ej: 2023-2024)">
            <textarea id="newGalleryDescription" placeholder="Descripción"></textarea>
            <button type="submit">Crear Galería</button>
        </form>
        <div id="modalMessage"></div>
    `;

    const form = document.getElementById('createGalleryForm');
    const msg = document.getElementById('modalMessage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const title = document.getElementById('newGalleryTitle').value || 'Nueva Galería';
            const icon = document.getElementById('newGalleryIcon').value || 'fas fa-heart';
            const date = document.getElementById('newGalleryDate').value || '';
            const description = document.getElementById('newGalleryDescription').value || '';

            const galleryData = {
                title, icon, date, description,
                previewImages: [], allImages: []
            };

            await addDoc(collection(db, 'galerias'), galleryData);
            msg.textContent = 'Galería creada correctamente!';
            msg.style.color = 'green';
            form.reset();
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

// Cargar galerías
async function loadGalleries() {
    galleriesContainer.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, 'galerias'));
    querySnapshot.forEach(docSnap => {
        const gallery = { id: docSnap.id, ...docSnap.data() };
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.innerHTML = `
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

// Modal de galería
function openGalleryModal(gallery) {
    currentGalleryId = gallery.id;
    modalTitle.textContent = gallery.title;
    modalBody.innerHTML = `
        <form id="addPhotosForm" class="upload-form">
            <input type="text" id="photoDesc" placeholder="Descripción de la foto">
            <input type="file" id="photoFile" accept="image/*" required>
            <button type="submit">Agregar Foto</button>
        </form>
        <div id="photosContainer"></div>
        <div id="modalMessage"></div>
    `;

    const form = document.getElementById('addPhotosForm');
    const photosContainer = document.getElementById('photosContainer');
    const msg = document.getElementById('modalMessage');

    gallery.allImages?.forEach(url => {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'modal-photo';
        imgDiv.style.backgroundImage = `url('${url}')`;
        photosContainer.appendChild(imgDiv);
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const file = document.getElementById('photoFile').files[0];
        const desc = document.getElementById('photoDesc').value || '';
        if (!file) return;

        try {
            const storageRef = ref(storage, `galerias/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            const galleryRef = doc(db, 'galerias', currentGalleryId);
            await updateDoc(galleryRef, {
                allImages: arrayUnion(url),
                previewImages: arrayUnion(url)
            });

            const imgDiv = document.createElement('div');
            imgDiv.className = 'modal-photo';
            imgDiv.style.backgroundImage = `url('${url}')`;
            photosContainer.appendChild(imgDiv);

            msg.textContent = 'Foto agregada correctamente!';
            msg.style.color = 'green';
            form.reset();
            loadGalleries();
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
