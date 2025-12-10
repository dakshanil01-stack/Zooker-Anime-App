// --- details.js फाइल ---

// 1. Firebase कॉन्फ़िगरेशन (यह वही होना चाहिए जो script.js में है)
const firebaseConfig = {
    apiKey: "AIzaSyDVreUCEz4qFF8LpMhQM963F4tTMgU4pY0",
    authDomain: "zookeranime.firebaseapp.com",
    projectId: "zookeranime",
    storageBucket: "zookeranime.firebasestorage.app",
    messagingSenderId: "440126522624",
    appId: "1:440126522624:web:abcd13f6715bda85721fe5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    const loadingSpinner = document.getElementById('loading-spinner');
    const contentDiv = document.getElementById('movie-details-content');

    // URL से Movie ID प्राप्त करें
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (movieId) {
        // Firebase से विशिष्ट दस्तावेज़ (document) प्राप्त करें
        db.collection("movies").doc(movieId).get()
            .then((doc) => {
                loadingSpinner.style.display = 'none'; // लोडिंग छिपाएँ
                
                if (doc.exists) {
                    const movie = doc.data();
                    
                    // 2. पेज के तत्वों को डेटा से भरें
                    document.getElementById('page-title').textContent = movie.title;
                    document.getElementById('details-title').textContent = movie.title;
                    document.getElementById('details-poster').src = movie.posterUrl;
                    document.getElementById('details-date').textContent = `Released: ${movie.releaseDate}`;
                    document.getElementById('details-tag').textContent = movie.tag;
                    document.getElementById('details-description').textContent = movie.description;
                    document.getElementById('details-download-link').href = movie.downloadLink;
                    
                    // Screenshots के लिए डमी डेटा लोड करें (यदि Firebase में नहीं है)
                    // details.js फाइल में, जहाँ आप 'movie' ऑब्जेक्ट का उपयोग कर रहे हैं...

// Screenshots को लोड करने का नया लॉजिक
const screenshotGrid = document.getElementById('details-screenshots');
screenshotGrid.innerHTML = ''; // मौजूदा डमी कंटेंट हटाएँ

if (movie.screenshotUrls && movie.screenshotUrls.length > 0) {
    movie.screenshotUrls.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = "Screenshot";
        screenshotGrid.appendChild(img);
    });
} else {
    screenshotGrid.innerHTML = '<p style="color:#95a5a6;">No screenshots available.</p>';
}
            .catch((error) => {
                loadingSpinner.style.display = 'none';
                console.error("Error fetching document:", error);
                contentDiv.innerHTML = `<h2 style="color:red;">An error occurred: ${error.message}</h2>`;
                contentDiv.style.display = 'block';
            });
    } else {
        loadingSpinner.style.display = 'none';
        contentDiv.innerHTML = '<h2 style="color:red;">Error: No Movie ID specified in URL.</h2>';
        contentDiv.style.display = 'block';
    }
});
// details.js फाइल में, जहाँ आप 'movie' ऑब्जेक्ट का उपयोग कर रहे हैं...

// Screenshots को लोड करने का नया लॉजिक
const screenshotGrid = document.getElementById('details-screenshots');
screenshotGrid.innerHTML = ''; // मौजूदा डमी कंटेंट हटाएँ

if (movie.screenshotUrls && movie.screenshotUrls.length > 0) {
    movie.screenshotUrls.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = "Screenshot";
        screenshotGrid.appendChild(img);
    });
} else {
    screenshotGrid.innerHTML = '<p style="color:#95a5a6;">No screenshots available.</p>';
}
