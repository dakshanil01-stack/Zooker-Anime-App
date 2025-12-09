// --- script.js फाइल में: ---

// 1. अपनी Firebase कॉन्फ़िगरेशन डिटेल्स यहाँ भरें
const firebaseConfig = {
    // ... आपकी Firebase डिटेल्स यहाँ ...
};

// 2. Firebase को Initialize करें और Firestore को प्राप्त करें
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    // ... (आपका मौजूदा JavaScript कोड यहाँ) ...

    const movieGrid = document.querySelector('.movie-grid');

    // 3. मूवी कार्ड बनाने का फंक्शन
    function createMovieCard(movie) {
        // यह फ़ंक्शन HTML स्ट्रक्चर बनाता है
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.setAttribute('onclick', `alert('Title: ${movie.title} | Link: ${movie.downloadLink}')`); // डाउनलोड लिंक दिखाने के लिए

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

    // 4. Firebase से डेटा लोड करने का फंक्शन
    function loadContentFromFirebase() {
        // Firestore से 'movies' कलेक्शन के डेटा को timestamp के आधार पर डिसेंडिंग ऑर्डर में प्राप्त करें
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

    // 5. पेज लोड होने पर कंटेंट लोड करें
    loadContentFromFirebase();
});
document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.querySelector('.menu-button');
    const navBar = document.querySelector('.navbar');

    // Simple functionality for the mobile menu button (though no menu is visible)
    menuButton.addEventListener('click', () => {
        // In a real app, you would slide out a mobile menu here.
        // For this simple example, we'll just log to the console.
        console.log('Mobile menu button clicked!');
        
        // Optional: Toggle a class to change the color/state of the button
        menuButton.classList.toggle('is-active');
        
        // Since we don't have a login/logout, we don't need complex state management.
        alert('Menu functionality placeholder. In a full site, the navigation would appear here.');
    });

    // Simple interaction feedback for the search button
    const searchButton = document.querySelector('.search-button');
    searchButton.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submission if it were inside a form
        const searchInput = document.querySelector('.search-input').value;
        if (searchInput.trim() !== '') {
            alert(`Searching for: "${searchInput}"`);
        } else {
            alert('Please enter a search term.');
        }
    });

    // The movie cards already have an 'onclick' in the HTML for simple feedback.
});
