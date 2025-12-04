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

// 🔥 NAYE PAGINATION VARIABLES 🔥
let currentPage = 1;
const itemsPerPage = 12; // Ek page par kitne items dikhane hain (8 se badhaya gaya)
let lastVisible = null; // Next page ke liye reference
let firstVisibleHistory = {}; // Previous pages ke liye reference store karne ke liye


// --- 2. ROUTING (Page badalne ka system) ---
function navigate(pageId, data = null) {
  const view = document.getElementById('view');
  const template = document.getElementById(`tpl-${pageId}`);
    
  if (!template) return;
    
  view.innerHTML = "";
  const clone = template.content.cloneNode(true);
  view.appendChild(clone);

  if (pageId === 'home') {
    // currentPage ko 1 se shuru karein jab home par navigate karein
    currentPage = 1; 
    lastVisible = null;
    firstVisibleHistory = {};
    
    loadAnimeList(currentPage);
    loadTrendingSlider();
    // Search bar har home load par initialize hona chahiye
    initializeSearchBar();
  }
    
  if (pageId === 'watch' && data) setupPlayer(data);
}


// --- 3. AUTHENTICATION (Login/Signup/Logout) ---

/**
 * Authentication state ko check karta hai aur navigation bar mein links dikhata hai.
 * Upload link sirf 'ADMIN' displayName wale users ko dikhti hai.
 */
function checkLoginStatus() {
  auth.onAuthStateChanged(user => {
    const authLink = document.getElementById('authLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const uploadLink = document.getElementById('uploadLink');

    if (user) {
      // User logged in hai
      authLink.style.display = 'none';
      logoutBtn.style.display = 'inline';
      
      // Admin Check: Agar displayName 'ADMIN' hai, toh Upload link dikhao
      if(user.displayName === 'ADMIN') {
        uploadLink.style.display = 'inline';
      } else {
        uploadLink.style.display = 'none'; // Non-admin users ke liye chhupa do
      }
    } else {
      // User logged out hai
      authLink.style.display = 'inline';
      logoutBtn.style.display = 'none';
      uploadLink.style.display = 'none';
    }
  });
}

/**
 * Naye user ko register karta hai (Standard User Signup).
 * Admin checkbox aur logic ab hata diya gaya hai.
 */
function handleSignup(e) {
  e.preventDefault();
  
  // Error Handling: agar implemented ho toh yahan clear karein
  // if (typeof clearAuthErrors === 'function') clearAuthErrors(); 
  
  const email = document.getElementById('signEmail').value;
  const pass = document.getElementById('signPass').value;
  
  auth.createUserWithEmailAndPassword(email, pass)
    .then(() => {
      // Signup ke baad seedhe sign out karke login page par bhej do.
      return auth.signOut(); 
    })
    .then(() => {
      alert("Signup Successful! Please use the Login button now."); 
      navigate('login');
    })
    .catch((error) => {
      alert("Error: " + error.message); 
      // Error Handling: agar implemented ho toh yahan display karein
      // if (typeof displayAuthError === 'function') displayAuthError('signup-error', error.message);
    });
}

/**
 * Existing user ko login karta hai (Sabhi users allowed hain).
 * Pichla Admin check remove kar diya gaya hai taki naye users login kar sakein.
 */
function handleLogin(e) {
  e.preventDefault();
  
  // Error Handling: agar implemented ho toh yahan clear karein
  // if (typeof clearAuthErrors === 'function') clearAuthErrors(); 
  
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      // ✅ SUCCESS: Sabhi users successfully login kar sakte hain.
      // checkLoginStatus() ab upload link ko control karega.
      alert("Welcome back!");
      navigate('home'); 
    })
    .catch((error) => {
      // Login error ko handle karein
      alert("Error: " + error.message);
      // Error Handling: agar implemented ho toh yahan display karein
      // if (typeof displayAuthError === 'function') displayAuthError('login-error', error.message);
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


// 🔥 UPDATED loadAnimeList (Ab yeh pagination ke saath kaam karega) 🔥
function loadAnimeList(page = 1) {
    const listContainer = document.getElementById('animeList');
    const paginationControls = document.getElementById('paginationControls');
    
    paginationControls.style.display = 'none';

    // 1. Skeleton Loader Injection
    listContainer.innerHTML = "";  
    let skeletonHTML = '';
    for(let i=0; i<itemsPerPage; i++) {
        skeletonHTML += `
          <div class="card skeleton-loader">
            <div class="thumb skeleton-loader" style="height:270px; margin-bottom:8px; border-radius:10px;"></div>
            <div class="skeleton-loader" style="height:16px; width:90%; margin-bottom:2px;"></div>
            <div class="skeleton-loader" style="height:14px; width:60%;"></div>
          </div>
        `;
    }
    listContainer.innerHTML = skeletonHTML;  
    
    // 2. Query Setup
    let query = db.collection("animes").orderBy("timestamp", "desc");

    if (page < currentPage && firstVisibleHistory[page]) {
        // Previous page load
        query = query.endBefore(firstVisibleHistory[page]);
        query = query.limitToLast(itemsPerPage); 
    } else if (page > currentPage && lastVisible) {
        // Next page load
        query = query.startAfter(lastVisible);
        query = query.limit(itemsPerPage);
    } else {
        // Initial load (Page 1) ya fallback
        query = query.limit(itemsPerPage);
    }

    // 3. Execute Query
    query.get().then((querySnapshot) => {
        listContainer.innerHTML = ""; // Clear skeleton
        const renderedItems = new Set();  
        allAnimeData = []; // Clear global data array for new page

        if (querySnapshot.docs.length === 0) {
            listContainer.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: var(--muted); padding: 50px 0;'>No more results found.</p>";
            updatePaginationControls(0); // Pagination band kar do
            return;
        }

        // Docs array ko reverse karein agar pichla page load ho raha tha
        const docsToProcess = (page < currentPage && firstVisibleHistory[page]) 
            ? querySnapshot.docs.reverse() 
            : querySnapshot.docs;

        docsToProcess.forEach((doc) => {
            const data = doc.data();
            const uniqueKey = data.seriesId ? data.seriesId.trim().toUpperCase() : data.title.trim().toUpperCase();

            if (!renderedItems.has(uniqueKey)) {
                renderedItems.add(uniqueKey);
                allAnimeData.push(data); 
            }
        });
       
        // Document Snapshots ko store karein Next/Previous ke liye
        lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        firstVisibleHistory[page + 1] = lastVisible; 

        const firstVisible = querySnapshot.docs[0];
        firstVisibleHistory[page] = firstVisible; 

        // Update global page number
        currentPage = page;

        // Render the list
        renderAnimeCards(allAnimeData, listContainer);

        // Update Pagination Controls
        updatePaginationControls(querySnapshot.docs.length);

        // Load trending slider on first page load
        if (page === 1) {
            loadTrendingSlider();
        }

    }).catch(error => {
        listContainer.innerHTML = `<p style='grid-column: 1 / -1; text-align: center; color: red;'>Error loading data: ${error.message}</p>`;
        updatePaginationControls(0);
    });
}

// 🔥 NEW FUNCTION: Card Rendering Logic (loadAnimeList se alag kiya gaya) 🔥
function renderAnimeCards(dataArray, container) {
    dataArray.forEach((data) => {
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
        container.appendChild(card);
    });
}


// 🔥 UPDATED filterAnimeList (Ab yeh sirf current page ke data par search karega) 🔥
function filterAnimeList(query) {
    const listContainer = document.getElementById('animeList');
    const paginationControls = document.getElementById('paginationControls');
    listContainer.innerHTML = ""; // Clear existing list

    // Search ke waqt pagination controls chhupa do
    paginationControls.style.display = (query.length > 0) ? 'none' : 'flex';

    // allAnimeData ab sirf current page ka data hai
    const filteredData = allAnimeData.filter(data => {
        const titleMatch = data.title.toLowerCase().includes(query.toLowerCase());
        const seriesIdMatch = data.seriesId ? data.seriesId.toLowerCase().includes(query.toLowerCase()) : false;
        return titleMatch || seriesIdMatch;
    });

    if (filteredData.length === 0) {
        listContainer.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: var(--muted); padding: 50px 0;'>No results found for your search on this page.</p>";
        return;
    }

    // Render the filtered list
    renderAnimeCards(filteredData, listContainer);
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
        // Debounce: Har keystroke par nahi, balki typing rukne par search karega
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

// 🔥 NEW PAGINATION CONTROL LOGIC 🔥

/**
 * Pagination Controls ko update karta hai (Disable/Enable buttons aur page number)
 * @param {number} currentResultsCount - Current page par kitne results aaye hain
 */
function updatePaginationControls(currentResultsCount) {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    const paginationControls = document.getElementById('paginationControls');

    paginationControls.style.display = 'flex'; // Controls ko dikhao

    pageInfo.innerText = `Page ${currentPage}`;

    // Previous Button
    if (currentPage === 1) {
        prevBtn.disabled = true;
    } else {
        prevBtn.disabled = false;
    }

    // Next Button (Agar fetched results itemsPerPage se kam hain, toh next page nahi hai)
    if (currentResultsCount < itemsPerPage) {
        nextBtn.disabled = true;
    } else {
        // Next page enable rakho. Next page load par agar results 0 aaye toh disable ho jayega.
        nextBtn.disabled = false;
    }
}

function goToNextPage() {
    // next button click hone par next page load karein
    const nextPageIndex = currentPage + 1;
    loadAnimeList(nextPageIndex); 
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToPreviousPage() {
    if (currentPage > 1) {
        // previous button click hone par pichla page load karein
        const prevPageIndex = currentPage - 1;
        loadAnimeList(prevPageIndex); 
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}


// --- 7. INITIALIZATION (Window Load Fix) ---
// Window.onload ko sirf ek baar use kiya gaya hai.
window.onload = () => {
    checkLoginStatus();
    navigate('home');  
    // initializeSearchBar() call ab navigate('home') ke andar ho raha hai.
};
