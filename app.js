// --- script.js फाइल (एकीकृत कोड) ---

// 1. अपनी Firebase कॉन्फ़िगरेशन डिटेल्स
const firebaseConfig = {
  apiKey: "AIzaSyDVreUCEz4qFF8LpMhQM963F4tTMgU4pY0",
  authDomain: "zookeranime.firebaseapp.com",
  projectId: "zookeranime",
  storageBucket: "zookeranime.firebasestorage.app",
  messagingSenderId: "440126522624",
  appId: "1:440126522624:web:abcd13f6715bda85721fe5"
};

// 2. Firebase को Initialize करें और Firestore को प्राप्त करें
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- 3. Modal डिस्प्ले फंक्शन (मूवी/सीरीज डिटेल्स दिखाने के लिए) ---
function showModal(movie) {
    const modal = document.getElementById('movie-modal');
    // अगर modal HTML में नहीं है, तो फ़ंक्शन को रोक दें
    if (!modal) {
        alert(`Title: ${movie.title} | Link: ${movie.downloadLink}`);
        return;
    }

    const downloadLink = document.getElementById('modal-download-link');

    // Modal के तत्वों में डेटा भरें
    document.getElementById('modal-title').textContent = movie.title;
    document.getElementById('modal-poster').src = movie.posterUrl;
    document.getElementById('modal-date').textContent = movie.releaseDate;
    document.getElementById('modal-description').textContent = movie.description;
    
    // डाउनलोड लिंक सेट करें
    downloadLink.href = movie.downloadLink;
    
    // स्क्रीनशॉट सेक्शन को रीसेट करें (यदि आपने Firebase में इसे मैनेज नहीं किया है तो यह डमी रहेगा)
    const screenshotGallery = document.getElementById('modal-screenshots');
    if (screenshotGallery) {
        screenshotGallery.innerHTML = `
            <img src="https://via.placeholder.com/150x80?text=Screen+1" alt="Screenshot" class="screenshot-img">
            <img src="https://via.placeholder.com/150x80?text=Screen+2" alt="Screenshot" class="screenshot-img">
        `;
    }

    modal.style.display = "block"; // मॉडल को दिखाएँ
}


// --- 4. मूवी कार्ड बनाने का फंक्शन (अपडेटेड - अब modal को कॉल करता है) ---
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    // नया: कार्ड पर क्लिक इवेंट Listener जोड़ें
    card.addEventListener('click', () => {
        showModal(movie); // क्लिक होने पर showModal फंक्शन को कॉल करें
    });

    card.innerHTML = `
        <div class="poster-placeholder" style="background-image: url('${movie.posterUrl}');">
            <span class="web-dl-badge">${movie.tag}</span>
        </div>
        <div class="movie-info">
            <div class="rating-star">★</div>
            <p class="date">${movie.releaseDate}</p>
            <p class="title">${movie.title}</p>
            <p class="description">${movie.description}</p>
        </div>
    `;
    return card;
}

// --- 5. Firebase से डेटा लोड करने का फंक्शन ---
function loadContentFromFirebase() {
    const movieGrid = document.querySelector('.movie-grid');
    
    db.collection("movies")
        .orderBy("timestamp", "desc") // सबसे नए कंटेंट को सबसे पहले दिखाएगा
        .limit(10) // केवल 10 लेटेस्ट आइटम लोड करें
        .get()
        .then((querySnapshot) => {
            // पहले से मौजूद डमी कंटेंट को हटा दें
            movieGrid.innerHTML = ''; 
            
            querySnapshot.forEach((doc) => {
                const movieData = doc.data();
                const newCard = createMovieCard(movieData);
                movieGrid.appendChild(newCard);
            });
        })
        .catch((error) => {
            console.error("Error fetching documents: ", error);
            // यदि डेटा लोड नहीं हो पाता है, तो एक एरर मैसेज दिखाएँ
            movieGrid.innerHTML = '<p style="color:red; padding: 20px;">कंटेंट लोड करने में समस्या आई। Firebase कनेक्शन जांचें।</p>';
        });
}

// --- 6. DOMContentLoaded (सभी इवेंट हैंडलर को एकजुट करें) ---
document.addEventListener('DOMContentLoaded', () => {
    // A. Firebase से कंटेंट लोड करें
    loadContentFromFirebase();

    // B. Modal Closing Logic
    const modal = document.getElementById('movie-modal');
    const closeBtn = document.querySelector('.close-btn');
    
    // सुनिश्चित करें कि Modal और Close Button HTML में मौजूद हैं
    if (modal && closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = "none";
        }

        // विंडो पर क्लिक करने पर मॉडल बंद करें
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    }


    // C. पुराना Menu और Search Logic (जैसा आपने दिया था)
    const menuButton = document.querySelector('.menu-button');
    const searchButton = document.querySelector('.search-button');

    menuButton.addEventListener('click', () => {
        console.log('Mobile menu button clicked!');
        menuButton.classList.toggle('is-active');
        alert('Menu functionality placeholder. In a full site, the navigation would appear here.');
    });

    searchButton.addEventListener('click', (e) => {
        e.preventDefault(); 
        const searchInput = document.querySelector('.search-input').value;
        if (searchInput.trim() !== '') {
            alert(`Searching for: "${searchInput}"`);
        } else {
            alert('Please enter a search term.');
        }
    });
});
