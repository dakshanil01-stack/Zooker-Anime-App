// --- script.js फाइल (फाइनल वर्जन: Detail Page Redirection के साथ) ---

// 1. अपनी Firebase कॉन्फ़िगरेशन डिटेल्स
// Supabase कॉन्फ़िगरेशन
const SUPABASE_URL = 'https://jdndxourrdcfxwegvttr.supabase.co'; // Console से लें
const SUPABASE_ANON_KEY = 'process.env.SUPABASE_KEY'; // Console से लें

// Supabase क्लाइंट को initialize करें
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Firebase को Initialize करें और Firestore को प्राप्त करें
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 3. (Modal Logic को पूरी तरह से हटा दिया गया है)

// --- 4. मूवी कार्ड बनाने का फंक्शन (अपडेटेड - अब details.html पर भेजता है) ---
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    // नया: कार्ड पर क्लिक इवेंट Listener जोड़ें जो USER को details.html पर भेजे
    card.addEventListener('click', () => {
        // Doc ID को URL पैरामीटर के रूप में पास करें
        if (movie.id) {
            window.location.href = `details.html?id=${movie.id}`; 
        } else {
             alert('Error: Movie ID not found.');
        }
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
                // **अत्यंत महत्वपूर्ण:** Doc ID को movieData में जोड़ें
                movieData.id = doc.id; 
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

    // B. Modal Closing Logic को हटा दिया गया है। 
    // अब सिर्फ़ पुराना Menu और Search Logic बचा है।

    // C. पुराना Menu और Search Logic
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
