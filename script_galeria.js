// -------------------- Configuración de Firebase --------------------
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

// -------------------- Elementos del DOM --------------------
const galleriesContainer = document.getElementById('galleries');
const modal = document.getElementById('galleryModal');
const modalTitle = document.getElementById('modalGalleryName');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

// Botón para crear nueva galería
const createGalleryBtn = document.createElement('button');
createGalleryBtn.textContent = 'Crear Nueva Galería';
createGalleryBtn.style.margin = '20px auto';
createGalleryBtn.style.display = 'block';
createGalleryBtn.style.padding = '10px 20px';
createGalleryBtn.style.background = '#d81b60';
createGalleryBtn.style.color = 'white';
createGalleryBtn.style.border = 'none';
createGalleryBtn.style.borderRadius = '5px';
createGalleryBtn.style.cursor = 'pointer';
createGalleryBtn.addEventListener('click', () => openCreateGalleryModal());
document.querySelector('.container').insertBefore(createGalleryBtn, galleriesContainer);

let currentGalleryId = null; // Para subir fotos a galería existente

// -------------------- Autenticación --------------------
onAuthStateChanged(auth, (user) => {
    createGalleryBtn.style.display = user ? 'block' : 'none';
});

// -------------------- Funciones --------------------

// Cargar galerías existentes
async function loadGalleries() {
    galleriesContainer.innerHTML = '';
    try {
        const querySnapshot = await getDocs(collection(db, 'galerias'));
        querySnapshot.forEach(docSnap => {
            const gallery = { id: docSnap.id, ...docSnap.data() };
            const card = createGalleryCard(gallery);
            galleriesContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando galerías:', error);
    }
}

// Crear tarjeta de galería
function createGalleryCard(gallery) {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.setAttribute('data-gallery-id', gallery.id);

    let previewHTML = '';
    gallery.previewImages?.slice(0, 4).forEach(img => {
        previewHTML += `<div class="preview-img" style="background-image: url('${img}')"></div>`;
    });

    card.innerHTML = `
        <div class="gallery-preview">${previewHTML}</div>
        <div class="gallery-info">
            <div class="photo-count">${gallery.allImages?.length || 0}</div>
            <h3 class="gallery-title"><i class="${gallery.icon || 'fas fa-heart'} gallery-icon"></i> ${gallery.title}</h3>
            <div class="gallery-date">${gallery.date || ''}</div>
            <p class="gallery-description">${gallery.description || ''}</p>
            <button class="add-photo-btn">Agregar Fotos</button>
        </div>
    `;

    card.querySelector('.add-photo-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openAddPhotosModal(gallery);
    });

    card.addEventListener('click', () => openGalleryModal(gallery));

    return card;
}

// Abrir modal de galería
function openGalleryModal(gallery) {
    modalTitle.textContent = gallery.title;
    modalBody.innerHTML = '';
    gallery.allImages?.forEach(img => {
        const photoDiv = document.createElement('div');
        photoDiv.className = 'modal-photo';
        photoDiv.style.backgroundImage = `url('${img}')`;
        modalBody.appendChild(photoDiv);
    });
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    createConfetti();
}

// Modal crear nueva galería
function openCreateGalleryModal() {
    currentGalleryId = null;
    modalTitle.textContent = 'Crear Nueva Galería';
    modalBody.innerHTML = `
        <form id="createGalleryForm" class="upload-form">
            <input type="text" id="newGalleryTitle" placeholder="Título de la galería">
            <input type="text" id="newGalleryIcon" placeholder="Ícono FontAwesome (e.g., fas fa-heart)">
            <input type="text" id="newGalleryDate" placeholder="Fecha (e.g., 2023-2024)">
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
                title,
                icon,
                date,
                description,
                previewImages: [],
                allImages: []
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

// Modal agregar fotos a galería existente
function openAddPhotosModal(gallery) {
    currentGalleryId = gallery.id;
    modalTitle.textContent = `Agregar Fotos a: ${gallery.title}`;
    modalBody.innerHTML = `
        <form id="addPhotosForm" class="upload-form">
            <textarea id="photoDescription" placeholder="Descripción de las fotos"></textarea>
            <input type="file" id="photoFiles" multiple accept="image/*">
            <button type="submit">Subir Fotos</button>
        </form>
        <div id="modalMessage"></div>
    `;
    const form = document.getElementById('addPhotosForm');
    const msg = document.getElementById('modalMessage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const files = document.getElementById('photoFiles').files;
        const description = document.getElementById('photoDescription').value || '';

        if (!files.length) return;

        try {
            const uploadedUrls = [];
            for (let file of files) {
                const storageRef = ref(storage, `galerias/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                uploadedUrls.push(url);
            }

            const galleryRef = doc(db, 'galerias', currentGalleryId);
            await updateDoc(galleryRef, {
                allImages: arrayUnion(...uploadedUrls),
                previewImages: arrayUnion(...uploadedUrls.slice(0, 4))
            });

            msg.textContent = 'Fotos subidas correctamente!';
            msg.style.color = 'green';
            loadGalleries();
        } catch (error) {
            console.error(error);
            msg.textContent = 'Error subiendo fotos.';
            msg.style.color = 'red';
        }
    });

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// -------------------- Cerrar modal --------------------
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

closeModal.addEventListener('touchstart', (e) => e.currentTarget.classList.add('active'));
closeModal.addEventListener('touchend', (e) => e.currentTarget.classList.remove('active'));
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// -------------------- Confeti --------------------
function createConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8000'];
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        confetti.style.width = (Math.random() * 10 + 5) + 'px';
        confetti.style.height = (Math.random() * 10 + 5) + 'px';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

// -------------------- Inicializar --------------------
document.addEventListener('DOMContentLoaded', () => {
    loadGalleries();
    setTimeout(() => createConfetti(), 1000);
});
