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
let currentPhotoIndex = 0;
let images = [];

// Función para lanzar confeti
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

// Normalizar datos de imágenes
function normalizeImages(gallery) {
    let images = [];
    if (gallery.images && Array.isArray(gallery.images)) {
        images = gallery.images;
    } else if (gallery.allImages && Array.isArray(gallery.allImages)) {
        images = gallery.allImages.map(url => ({ url, desc: 'Un momento especial ♥' }));
    }
    return images;
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
                images: []
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

// Cargar galerías
async function loadGalleries() {
    galleriesContainer.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, 'galerias'));
    querySnapshot.forEach(docSnap => {
        const gallery = { id: docSnap.id, ...docSnap.data() };
        const images = normalizeImages(gallery);

        const card = document.createElement('div');
        card.className = 'gallery-card';

        const previews = images.slice(0, 4);
        while (previews.length < 4) previews.push(null);

        const previewHTML = previews.map(img => 
            img ? `<div class="preview-img" style="background-image: url('${img.url}')"></div>` :
                  `<div class="preview-placeholder"><i class="fas fa-heart"></i></div>`
        ).join('');

        card.innerHTML = `
            <div class="gallery-preview">${previewHTML}</div>
            <div class="photo-count">${images.length}</div>
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
    images = normalizeImages(gallery);
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

    images.forEach((imgObj, index) => {
        const photoDiv = document.createElement('div');
        photoDiv.className = 'modal-photo';
        photoDiv.style.backgroundImage = `url('${imgObj.url}')`;
        photoDiv.innerHTML = `<div class="photo-desc">${imgObj.desc}</div>`;
        photoDiv.addEventListener('click', () => openFullScreenModal(index));
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

            images.push({ url, desc });
            const photoDiv = document.createElement('div');
            photoDiv.className = 'modal-photo';
            photoDiv.style.backgroundImage = `url('${url}')`;
            photoDiv.innerHTML = `<div class="photo-desc">${desc}</div>`;
            photoDiv.addEventListener('click', () => openFullScreenModal(images.length - 1));
            photosContainer.appendChild(photoDiv);

            msg.textContent = '¡Foto agregada con amor! ♥';
            msg.style.color = 'green';
            launchConfetti();
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

// Modal de pantalla completa
function openFullScreenModal(index) {
    currentPhotoIndex = index;
    const modalFull = document.createElement('div');
    modalFull.className = 'modal-fullscreen';
    modalFull.innerHTML = `
        <div class="modal-fullscreen-content">
            <span class="close-fullscreen">&times;</span>
            <button class="nav-btn prev-btn"><i class="fas fa-chevron-left"></i></button>
            <img src="${images[index].url}" alt="Foto" class="fullscreen-img">
            <div class="fullscreen-desc">${images[index].desc}</div>
            <button class="nav-btn next-btn"><i class="fas fa-chevron-right"></i></button>
        </div>
    `;
    document.body.appendChild(modalFull);

    // Cerrar modal
    const closeFull = modalFull.querySelector('.close-fullscreen');
    closeFull.addEventListener('click', () => {
        modalFull.remove();
        document.body.style.overflow = 'hidden'; // Mantener modal de galería
    });

    // Navegación
    const prevBtn = modalFull.querySelector('.prev-btn');
    const nextBtn = modalFull.querySelector('.next-btn');
    prevBtn.addEventListener('click', () => updateFullScreenModal((currentPhotoIndex - 1 + images.length) % images.length));
    nextBtn.addEventListener('click', () => updateFullScreenModal((currentPhotoIndex + 1) % images.length));

    // Teclado
    document.addEventListener('keydown', handleKeyNav);
    function handleKeyNav(e) {
        if (e.key === 'ArrowLeft') updateFullScreenModal((currentPhotoIndex - 1 + images.length) % images.length);
        if (e.key === 'ArrowRight') updateFullScreenModal((currentPhotoIndex + 1) % images.length);
        if (e.key === 'Escape') modalFull.remove();
    }

    // Swipe
    let touchStartX = 0;
    modalFull.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
    });
    modalFull.addEventListener('touchmove', e => {
        const touchEndX = e.touches[0].clientX;
        const diffX = touchStartX - touchEndX;
        if (Math.abs(diffX) > 50) {
            if (diffX > 0) updateFullScreenModal((currentPhotoIndex + 1) % images.length);
            else updateFullScreenModal((currentPhotoIndex - 1 + images.length) % images.length);
            touchStartX = touchEndX;
        }
    });

    function updateFullScreenModal(newIndex) {
        currentPhotoIndex = newIndex;
        modalFull.querySelector('.fullscreen-img').src = images[currentPhotoIndex].url;
        modalFull.querySelector('.fullscreen-desc').textContent = images[currentPhotoIndex].desc;
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadGalleries();
    // Limpiar eventos de teclado al cerrar página
    window.addEventListener('unload', () => document.removeEventListener('keydown', handleKeyNav));
});