// --- 1. FIREBASE CONFIGURATION (Yahan apni keys daalein) ---
const firebaseConfig = {
  apiKey: "AIzaSyDVreUCEz4qFF8LpMhQM963F4tTMgU4pY0",
  authDomain: "zookeranime.firebaseapp.com",
  projectId: "zookeranime",
  storageBucket: "zookeranime.firebasestorage.app",
  messagingSenderId: "440126522624",
  appId: "1:440126522624:web:abcd13f6715bda85721fe5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Global variable to store all fetched data once (Search ke liye zaroori)
let allAnimeData = []; 

// --- 2. ROUTING (Page badalne ka system) ---
function navigate(pageId, data = null) {
  const view = document.getElementById('view');
  const template = document.getElementById(`tpl-${pageId}`);
  
  if (!template) return;
  
  view.innerHTML = "";
  const clone = template.content.cloneNode(true);
  view.appendChild(clone);

  if (pageId === 'home') {
    loadAnimeList();
    loadTrendingSlider();
    // Search bar har home load par initialize hona chahiye
    initializeSearchBar();
  }
  
  if (pageId === 'watch' && data) setupPlayer(data);
}


// --- 3. AUTHENTICATION (Login/Signup/Logout) ---
function checkLoginStatus() {
  auth.onAuthStateChanged(user => {
    const authLink = document.getElementById('authLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const uploadLink = document.getElementById('uploadLink');

    if (user) {
      authLink.style.display = 'none';
      logoutBtn.style.display = 'inline';
      
      if(user.displayName === 'ADMIN') {
        uploadLink.style.display = 'inline';
      }
    } else {
      authLink.style.display = 'inline';
      logoutBtn.style.display = 'none';
      uploadLink.style.display = 'none';
    }
  });
}

function handleSignup(e) {
  e.preventDefault();
  
  // Agar aapne pichli baar ki better error handling lagayi hai, toh is line ko uncomment karein
  // if (typeof clearAuthErrors === 'function') clearAuthErrors(); 
  
  const email = document.getElementById('signEmail').value;
  const pass = document.getElementById('signPass').value;
  // Admin Checkbox ka reference aur logic ab hata diya gaya hai
  
  auth.createUserWithEmailAndPassword(email, pass)
    .then(() => {
      // Profile update ki zaroorat nahi hai, seedhe sign out karke login page par bhej do
      return auth.signOut(); 
    })
    .then(() => {
      alert("Signup Successful! Please use the Login button now."); // Generic success message
      navigate('login');
    })
    .catch((error) => {
      // Alert se error dikhana (agar behtar handling nahi hai)
      alert("Error: " + error.message); 
      
      // Agar aapne behtar error handling lagayi hai, toh is line ko use karein:
      // if (typeof displayAuthError === 'function') displayAuthError('signup-error', error.message);
    });
}

function handleLogin(e) {
  e.preventDefault();
  // अगर आप clearAuthErrors का इस्तेमाल कर रहे हैं, तो उसे यहां कॉल करें
  
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      // ✅ SUCCESS: कोई Admin चेक नहीं। सभी users अब login कर पाएंगे।
      alert("Welcome back!");
      // checkLoginStatus() अब तय करेगा कि Upload link दिखानी है या नहीं।
      navigate('home'); 
    })
    .catch((error) => {
      // Error handling logic (जैसा आपने सेट किया है)
      alert("Error: " + error.message);
    });
}
    .catch((error) => {
      // Yeh aapki purani error handling line hai
      alert("Error: " + error.message);
      
      // Agar aapne pichle baar ki behtar error handling lagayi hai, toh yahan yeh aayega:
      // displayAuthError('login-error', error.message);
    });
}

function logoutUser() {
  auth.signOut().then(() => {
    alert("Logged out");
    navigate('home');
  });
}

// --- 4. DATABASE (Upload & Read) ---

function handleUpload(e) {
  e.preventDefault();
  
  const title = document.getElementById('u_title').value;
  const seriesId = document.getElementById('u_seriesId').value;
  const season = parseInt(document.getElementById('u_season').value);
  const episode = parseInt(document.getElementById('u_episode').value);
  
  const image = document.getElementById('u_image').value;
  const video = document.getElementById('u_video').value;
  const desc = document.getElementById('u_desc').value;

  db.collection("animes").add({
    title: title,
    seriesId: seriesId, 
    season: season,     
    episode: episode,   
    image: image,
    videoUrl: video,
    description: desc,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    alert(`Episode ${episode} of Series ${seriesId} Upload Successful!`);
    e.target.reset();
  })
  .catch((error) => alert("Upload Failed: " + error.message));
}


// Load function (Will be called only once on page load to fetch and store data)
function loadAnimeList() {
    const listContainer = document.getElementById('animeList');
    
    // 1. Skeleton Loader Injection
    listContainer.innerHTML = ""; 
    let skeletonHTML = '';
    for(let i=0; i<8; i++) {
        skeletonHTML += `
          <div class="card skeleton-loader">
            <div class="thumb skeleton-loader" style="height:270px; margin-bottom:8px; border-radius:10px;"></div>
            <div class="skeleton-loader" style="height:16px; width:90%; margin-bottom:2px;"></div>
            <div class="skeleton-loader" style="height:14px; width:60%;"></div>
          </div>
        `;
    }
    listContainer.innerHTML = skeletonHTML; 
    
    // 2. Data Fetching and Storing (Fetching only once)
    db.collection("animes").orderBy("timestamp", "desc").get().then((querySnapshot) => {
        
        allAnimeData = []; // Reset global data array
        const renderedItems = new Set(); 
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const uniqueKey = data.seriesId ? data.seriesId.trim().toUpperCase() : data.title.trim().toUpperCase();

            if (!renderedItems.has(uniqueKey)) {
                renderedItems.add(uniqueKey);
                // Data ko global array me store karein
                allAnimeData.push(data); 
            }
        });
        
        // Initial render of all items
        filterAnimeList(""); 
    });
}

// New function to filter and render the list (Search ke liye use hoga)
function filterAnimeList(query) {
    const listContainer = document.getElementById('animeList');
    listContainer.innerHTML = ""; // Clear existing list/skeleton

    const filteredData = allAnimeData.filter(data => {
        const titleMatch = data.title.toLowerCase().includes(query);
        const seriesIdMatch = data.seriesId ? data.seriesId.toLowerCase().includes(query) : false;
        return titleMatch || seriesIdMatch;
    });

    if (filteredData.length === 0) {
        listContainer.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: var(--muted); padding: 50px 0;'>No results found for your search.</p>";
        return;
    }

    filteredData.forEach((data) => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const displayTitle = data.seriesId || data.title;
        const displayYear = data.year || (data.description ? data.description.substring(0, 4) : '—');


        card.innerHTML = `
            <img class="thumb" src="${data.image}" alt="${displayTitle}" onerror="this.src='https://via.placeholder.com/220x270/000/fff?text=No+Image'">
            <h3>${displayTitle}</h3>
            <p class="meta">${displayYear}</p>
        `;
        
        card.onclick = () => navigate('watch', data);
        listContainer.appendChild(card);
    });
}


// --- 5. SLIDER LOGIC (Trending List Dikhana - Naya Function) ---
function loadTrendingSlider() {
    const sliderContainer = document.getElementById('trendingSlider');
    
    // 1. Skeleton Loader Injection
    let sliderSkeleton = '';
    for(let i=0; i<4; i++) {
        sliderSkeleton += `<div class="slider-card skeleton-loader">
            <div class="skeleton-loader" style="width:130px; height:100%; border-radius:8px;"></div>
            <div class="skeleton-loader" style="height:20px; flex-grow:1; align-self:center;"></div>
        </div>`;
    }
    sliderContainer.innerHTML = sliderSkeleton;
    
    
    // 2. Data Fetching and Rendering
    db.collection("animes").orderBy("timestamp", "desc").limit(5).get().then((querySnapshot) => {
        sliderContainer.innerHTML = ""; // Skeleton Clear
        
        const renderedItems = new Set(); 
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            const uniqueKey = data.seriesId ? data.seriesId.trim().toUpperCase() : data.title.trim().toUpperCase();

            if (renderedItems.has(uniqueKey)) {
                return;
            }
            renderedItems.add(uniqueKey);

            const slide = document.createElement('div');
            slide.className = 'slider-card';
            
            const displayTitle = data.seriesId || data.title;

            slide.innerHTML = `
                <img src="${data.image}" alt="${displayTitle}" onerror="this.src='https://via.placeholder.com/130x150/111/fff?text=Image+Error'">
                <h4>${displayTitle}</h4>
            `;
            
            slide.onclick = () => navigate('watch', data);
            
            sliderContainer.appendChild(slide);
        });
    });
}


// Player Setup (Ab Series ke episodes ko Season ke hisaab se group karke dikhayega)
function setupPlayer(data) {
  document.getElementById('watchTitle').innerText = data.title;
  document.getElementById('watchDesc').innerText = data.description;
  
  let videoSrc = data.videoUrl;
  
  if (videoSrc.startsWith('http:')) {
      videoSrc = videoSrc.replace('http:', 'https:');
  }

  document.getElementById('videoPlayer').src = videoSrc;

  // --- Episode Listing Logic ---
  const listContainer = document.getElementById('episodeListContainer');
  
  if (!listContainer) return; 

  listContainer.innerHTML = '<h3>Loading Episodes...</h3>'; // Loading message

  if (data.seriesId) {
    
    db.collection("animes")
      .where("seriesId", "==", data.seriesId)
      .orderBy("season", "asc")
      .orderBy("episode", "asc")
      .get()
      .then((querySnapshot) => {
        
        const episodesBySeason = {};
        querySnapshot.forEach((doc) => {
            const epData = doc.data();
            const seasonKey = `Season ${epData.season}`;
            
            if (!episodesBySeason[seasonKey]) {
                episodesBySeason[seasonKey] = [];
            }
            episodesBySeason[seasonKey].push(epData);
        });

        listContainer.innerHTML = `<h3>${data.seriesId} - Full Series:</h3>`; // Top heading

        for (const seasonTitle in episodesBySeason) {
            const episodes = episodesBySeason[seasonTitle];
            
            const seasonHeading = document.createElement('h4');
            seasonHeading.className = 'season-heading';
            seasonHeading.innerText = seasonTitle;
            listContainer.appendChild(seasonHeading);
            
            const episodeButtonsContainer = document.createElement('div');
            episodeButtonsContainer.className = 'episode-buttons-container';
            listContainer.appendChild(episodeButtonsContainer);

            episodes.forEach((epData) => {
                const epButton = document.createElement('button');
                epButton.innerText = `E${epData.episode}`;
                
                if (epData.videoUrl === data.videoUrl) {
                    epButton.classList.add('active');
                }
                
                epButton.onclick = () => {
                   let newSrc = epData.videoUrl.startsWith('http:') ? epData.videoUrl.replace('http:', 'https:') : epData.videoUrl;
                   
                   document.getElementById('videoPlayer').src = newSrc;
                   document.getElementById('watchTitle').innerText = epData.title;
                   
                   document.querySelectorAll('.episode-buttons-container button').forEach(btn => btn.classList.remove('active'));
                   epButton.classList.add('active');
                };
                
                episodeButtonsContainer.appendChild(epButton);
            });
        }
      })
      .catch(error => {
          listContainer.innerHTML = `<p>Error loading episodes: ${error.message}</p>`;
      });
  } else {
    listContainer.innerHTML = `<p>This is a standalone episode and is not part of a series.</p>`;
  }
}

// --- 6. SEARCH FUNCTIONALITY ---

function initializeSearchBar() {
    const searchBar = document.getElementById('searchBar');
    
    // Check if search bar exists on the current page (only on home page)
    if (searchBar) {
        // Debounce: हर कीस्ट्रोक पर नहीं, बल्कि टाइपिंग रुकने पर सर्च करेगा
        let timeout = null;
        
        searchBar.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const query = this.value.trim().toLowerCase();
                // Call the function to filter the list
                filterAnimeList(query);
            }, 300); // 300ms delay
        });
    }
}

// --- 7. INITIALIZATION (Window Load Fix) ---
// Window.onload ko sirf ek baar use kiya gaya hai.
window.onload = () => {
    checkLoginStatus();
    navigate('home'); 
    // initializeSearchBar() call ab navigate('home') ke andar ho raha hai.
};
