import { 
    initializeApp, getAuth, onAuthStateChanged,
    getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc,
    getStorage, ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

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

// Modales
const btnNewGallery = document.getElementById('btnNewGallery');
const newGalleryModal = document.getElementById('newGalleryModal');
const closeNewGallery = document.getElementById('closeNewGallery');
const newGalleryForm = document.getElementById('newGalleryForm');
const newGalleryMessage = document.getElementById('newGalleryMessage');

const addPhotosModal = document.getElementById('addPhotosModal');
const closeAddPhotos = document.getElementById('closeAddPhotos');
const addPhotosForm = document.getElementById('addPhotosForm');
const addPhotosMessage = document.getElementById('addPhotosMessage');
let currentGalleryId = null;

// Mostrar modal nueva galería
btnNewGallery.addEventListener('click', () => newGalleryModal.style.display = 'block');
closeNewGallery.addEventListener('click', () => {
    newGalleryModal.style.display = 'none';
    newGalleryForm.reset();
    newGalleryMessage.textContent = '';
});

// Crear nueva galería
newGalleryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('newGalleryTitle').value || 'Sin título';
    const icon = document.getElementById('newGalleryIcon').value || 'fas fa-heart';
    const date = document.getElementById('newGalleryDate').value || '';
    const description = document.getElementById('newGalleryDescription').value || '';

    try {
        await addDoc(collection(db, 'galerias'), {
            title, icon, date, description, previewImages: [], allImages: []
        });
        newGalleryMessage.textContent = 'Galería creada!';
        newGalleryMessage.style.color = 'green';
        newGalleryForm.reset();
        newGalleryModal.style.display = 'none';
        loadGalleries();
    } catch (error) {
        console.error(error);
        newGalleryMessage.textContent = 'Error al crear la galería';
        newGalleryMessage.style.color = 'red';
    }
});

// Cerrar modal agregar fotos
closeAddPhotos.addEventListener('click', () => {
    addPhotosModal.style.display = 'none';
    addPhotosForm.reset();
    addPhotosMessage.textContent = '';
    currentGalleryId = null;
});

// Abrir modal agregar fotos
function openAddPhotosModal(gallery) {
    addPhotosModal.style.display = 'block';
    document.getElementById('addPhotosTitle').textContent = `Agregar fotos a "${gallery.title}"`;
    currentGalleryId = gallery.id;
}

// Subir fotos a galería existente
addPhotosForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentGalleryId) return;

    const files = document.getElementById('galleryNewImages').files;
    const desc = document.getElementById('galleryNewDescription').value || '';

    try {
        const galleryRef = doc(db, 'galerias', currentGalleryId);
        const gallerySnap = await getDoc(galleryRef);
        const data = gallerySnap.data();
        const allImages = data.allImages || [];
        const previewImages = data.previewImages || [];

        for (let file of files) {
            const storageRef = ref(storage, `galerias/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            allImages.push({ url, desc });
        }

        // Actualizar preview con primeras 4 fotos
        previewImages.splice(0, previewImages.length, ...allImages.slice(0, 4).map(i => i.url));

        await updateDoc(galleryRef, { allImages, previewImages });
        addPhotosMessage.textContent = 'Fotos agregadas!';
        addPhotosMessage.style.color = 'green';
        addPhotosForm.reset();
        addPhotosModal.style.display = 'none';
        loadGalleries();
    } catch (error) {
        console.error(error);
        addPhotosMessage.textContent = 'Error al agregar fotos';
        addPhotosMessage.style.color = 'red';
    }
});

// Cargar galerías
async function loadGalleries() {
    galleriesContainer.innerHTML = '';
    try {
        const querySnapshot = await getDocs(collection(db, 'galerias'));
        const galleries = [];
        querySnapshot.forEach(doc => galleries.push({ id: doc.id, ...doc.data() }));

        galleries.forEach(gallery => {
            const card = document.createElement('div');
            card.className = 'gallery-card';

            let previewHTML = '';
            (gallery.previewImages || []).slice(0, 4).forEach(img => {
                previewHTML += `<div class="preview-img" style="background-image: url('${img}')"></div>`;
            });

            card.innerHTML = `
                <div class="gallery-preview">${previewHTML}</div>
                <div class="gallery-info">
                    <div class="photo-count">${(gallery.allImages || []).length}</div>
                    <h3 class="gallery-title"><i class="${gallery.icon} gallery-icon"></i> ${gallery.title}</h3>
                    <div class="gallery-date">${gallery.date || ''}</div>
                    <p class="gallery-description">${gallery.description || ''}</p>
                    <button class="btnAddPhotos">+ Agregar Fotos</button>
                </div>
            `;

            card.querySelector('.btnAddPhotos').addEventListener('click', () => openAddPhotosModal(gallery));

            galleriesContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando galerías:', error);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadGalleries();
});
