// --- details.js फाइल (Supabase डेटा फेचिंग) ---

// 🚨 अपनी वास्तविक Supabase Keys से बदलें 🚨
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL'; 
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; 

// Supabase क्लाइंट को initialize करें
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


document.addEventListener('DOMContentLoaded', () => {
    const loadingSpinner = document.getElementById('loading-spinner');
    const contentDiv = document.getElementById('movie-details-content');

    // Supabase ID (primary key) को प्राप्त करें
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (movieId) {
        // Supabase से विशिष्ट Row प्राप्त करें
        supabase
            .from('movies')
            .select('*') // सभी कॉलम चुनें
            .eq('id', movieId) // 'id' कॉलम को movieId से मिलाएं
            .single() // सुनिश्चित करें कि हमें केवल एक ही रिजल्ट मिले
            .then(({ data: movie, error }) => {
                loadingSpinner.style.display = 'none'; 

                if (error) {
                    contentDiv.innerHTML = `<h2 style="color:red;">Error fetching details: ${error.message}</h2>`;
                    console.error("Supabase Fetch Error:", error);
                } 
                
                if (movie) {
                    // 2. पेज के तत्वों को डेटा से भरें
                    document.getElementById('page-title').textContent = movie.title;
                    document.getElementById('details-title').textContent = movie.title;
                    document.getElementById('details-poster').src = movie.posterUrl;
                    document.getElementById('details-tag').textContent = movie.tag;
                    document.getElementById('details-description').textContent = movie.description;
                    document.getElementById('details-download-link').href = movie.downloadLink;
                    
                    // Supabase 'created_at' का उपयोग करें
                    document.getElementById('details-date').textContent = `Released: ${movie.releaseDate}`; 
                    
                    // Screenshots लोड करें
                    const screenshotGrid = document.getElementById('details-screenshots');
                    screenshotGrid.innerHTML = ''; 

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
                    
                    contentDiv.style.display = 'block'; 

                } else {
                    // यदि कोई डेटा नहीं मिला
                    contentDiv.innerHTML = '<h2 style="color:red;">Error 404: Content not found.</h2>';
                }
            })
            .catch((err) => {
                 loadingSpinner.style.display = 'none';
                 contentDiv.innerHTML = `<h2 style="color:red;">An unexpected error occurred: ${err.message}</h2>`;
            });
    } else {
        loadingSpinner.style.display = 'none';
        contentDiv.innerHTML = '<h2 style="color:red;">Error: No Movie ID specified in URL.</h2>';
        contentDiv.style.display = 'block';
    }
});
