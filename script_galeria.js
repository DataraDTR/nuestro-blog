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
const storage = firebase.getStorage(app);

const galleriesContainer = document.getElementById('galleries');
const uploadSection = document.getElementById('uploadSection');
const uploadForm = document.getElementById('uploadForm');
const uploadMessage = document.getElementById('uploadMessage');
const modal = document.getElementById('galleryModal');
const modalTitle = document.getElementById('modalGalleryName');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

// Verificar autenticación anónima para mostrar formulario de carga
firebase.onAuthStateChanged(auth, (user) => {
    if (user) {
        uploadSection.style.display = 'block';
    } else {
        uploadSection.style.display = 'none';
    }
});

// Cargar galerías desde Firestore
async function loadGalleries() {
    galleriesContainer.innerHTML = '';
    try {
        const querySnapshot = await firebase.getDocs(firebase.collection(db, 'galerias'));
        const galleries = [];
        querySnapshot.forEach(doc => {
            galleries.push({ id: doc.id, ...doc.data() });
        });

        galleries.forEach(gallery => {
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.setAttribute('data-gallery-id', gallery.id);
            
            let previewHTML = '';
            gallery.previewImages.slice(0, 4).forEach(img => {
                previewHTML += `<div class="preview-img" style="background-image: url('${img}')"></div>`;
            });
            
            card.innerHTML = `
                <div class="gallery-preview">
                    ${previewHTML}
                </div>
                <div class="gallery-info">
                    <div class="photo-count">${gallery.allImages.length}</div>
                    <h3 class="gallery-title"><i class="${gallery.icon} gallery-icon"></i> ${gallery.title}</h3>
                    <div class="gallery-date">${gallery.date}</div>
                    <p class="gallery-description">${gallery.description}</p>
                </div>
            `;
            
            card.addEventListener('click', () => openGallery(gallery));
            card.addEventListener('touchstart', (e) => e.currentTarget.classList.add('active'));
            card.addEventListener('touchend', (e) => e.currentTarget.classList.remove('active'));
            
            galleriesContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando galerías:', error);
    }
}

// Subir nueva galería
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
        uploadMessage.textContent = 'Debes estar autenticado para subir imágenes.';
        return;
    }

    const title = document.getElementById('galleryTitle').value;
    const icon = document.getElementById('galleryIcon').value;
    const date = document.getElementById('galleryDate').value;
    const description = document.getElementById('galleryDescription').value;
    const files = document.getElementById('galleryImages').files;

    try {
        const allImages = [];
        for (let file of files) {
            const storageRef = firebase.ref(storage, `galerias/${Date.now()}_${file.name}`);
            await firebase.uploadBytes(storageRef, file);
            const url = await firebase.getDownloadURL(storageRef);
            allImages.push(url);
        }

        const galleryData = {
            title,
            icon,
            date,
            description,
            previewImages: allImages.slice(0, 4),
            allImages
        };

        await firebase.addDoc(firebase.collection(db, 'galerias'), galleryData);
        uploadMessage.textContent = 'Galería subida exitosamente!';
        uploadMessage.style.color = 'green';
        uploadForm.reset();
        loadGalleries(); // Recargar galerías
    } catch (error) {
        console.error('Error subiendo galería:', error);
        uploadMessage.textContent = 'Error al subir la galería. Intenta de nuevo.';
        uploadMessage.style.color = 'red';
    }
});

// Abrir galería en modal
function openGallery(gallery) {
    modalTitle.textContent = gallery.title;
    
    modalBody.innerHTML = '';
    
    gallery.allImages.forEach(img => {
        const photoDiv = document.createElement('div');
        photoDiv.className = 'modal-photo';
        photoDiv.style.backgroundImage = `url('${img}')`;
        modalBody.appendChild(photoDiv);
    });
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    createConfetti();
}

// Cerrar modal
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

// Efecto confeti
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
        
        setTimeout(() => {
            confetti.remove();
        }, 4000);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker registrado'))
            .catch(err => console.error('Error registrando SW:', err));
    }
    
    loadGalleries();
    setTimeout(() => createConfetti(), 1000);
});