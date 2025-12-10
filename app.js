// --- script.js फाइल (Supabase डेटा फेचिंग के साथ) ---

// 🚨 अपनी वास्तविक Supabase Keys से बदलें 🚨
const SUPABASE_URL = 'https://jdndxourrdcfxwegvttr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbmR4b3VycmRjZnh3ZWd2dHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzQyMjgsImV4cCI6MjA4MDk1MDIyOH0.Ffw5ojAiv2W_yTS2neZw5_kvTXXuo5pQRfBwhNRssnM'; 

// Supabase क्लाइंट को initialize करें
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- 1. मूवी कार्ड बनाने का फंक्शन ---
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    // कार्ड पर क्लिक इवेंट Listener: details.html पर भेजें
    card.addEventListener('click', () => {
        // Supabase में Primary Key 'id' होती है
        if (movie.id) {
            window.location.href = `details.html?id=${movie.id}`; 
        } else {
             console.error('Error: Movie ID not found in Supabase data.');
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


// --- 2. Supabase से कंटेंट लोड करने का फंक्शन ---
async function loadContentFromSupabase() {
    const movieGrid = document.querySelector('.movie-grid');
    
    // Supabase से डेटा fetch करें
    const { data: movies, error } = await supabase
        .from('movies')
        .select('*') // सभी कॉलम सेलेक्ट करें
        .order('id', { ascending: false }) // 'id' या 'created_at' के आधार पर डिसेंडिंग ऑर्डर में सॉर्ट करें
        .limit(10);
        
    if (error) {
        console.error("Error fetching documents from Supabase: ", error);
        movieGrid.innerHTML = '<p style="color:red; padding: 20px;">कंटेंट लोड करने में समस्या आई। Supabase कनेक्शन जांचें।</p>';
        return;
    }
        
    // डेटा सफलतापूर्वक लोड हुआ
    movieGrid.innerHTML = ''; 
    
    movies.forEach((movieData) => {
        // Supabase में Primary Key पहले से ही 'id' होती है
        const newCard = createMovieCard(movieData);
        movieGrid.appendChild(newCard);
    });
}


// --- 3. DOMContentLoaded (सभी इवेंट हैंडलर) ---
document.addEventListener('DOMContentLoaded', () => {
    // A. Supabase से कंटेंट लोड करें
    loadContentFromSupabase();

    // B. Menu और Search Logic (आपका existing logic)
    const menuButton = document.querySelector('.menu-button');
    const searchButton = document.querySelector('.search-button');

    menuButton.addEventListener('click', () => {
        console.log('Mobile menu button clicked!');
        menuButton.classList.toggle('is-active');
        alert('Menu functionality placeholder.');
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
