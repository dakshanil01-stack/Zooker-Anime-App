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

// 🔥 PAGINATION VARIABLES 🔥
let currentPage = 1;
const itemsPerPage = 12; // Ek page par kitne items dikhane hain
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
  
  // 🔥 NEW LOGIC FOR ADMIN PAGE 🔥
  if (pageId === 'admin') {
      loadAdminContentList();
  }
  
  // 🔥 NEW LOGIC FOR EDIT PAGE 🔥
  if (pageId === 'edit' && data && data.docId) {
      loadContentForEdit(data.docId); // docId ke saath data load karein
  }
  // 🔥 END EDIT LOGIC 🔥
  
  // 🔥 FIX: Upload Form Event Listener (Yeh pehle missing tha) 🔥
  if (pageId === 'upload') {
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.removeEventListener('submit', handleUpload); // Double attachment se bachne ke liye
        uploadForm.addEventListener('submit', handleUpload);
    }
  }
    
  // 🔥 FIX: Login/Signup Event Listeners ko yahan attach karein 🔥
  if (pageId === 'login') {
      const loginForm = document.getElementById('loginForm');
      if (loginForm) {
          loginForm.removeEventListener('submit', handleLogin);
          loginForm.addEventListener('submit', handleLogin);
      }
  }

  if (pageId === 'signup') {
      const signupForm = document.getElementById('signupForm');
      if (signupForm) {
          signupForm.removeEventListener('submit', handleSignup);
          signupForm.addEventListener('submit', handleSignup);
      }
  }
  // 🔥 END FIX 🔥
  
  if (pageId === 'watch' && data) setupPlayer(data);
  
  // Navigate hone par mobile menus band kar do
  closeSidebar();
  closeUserMenu();
}


// --- 3. AUTHENTICATION (Login/Signup/Logout) ---

/**
 * Authentication state ko check karta hai aur navigation bar mein links/menu dikhata hai.
 */
function checkLoginStatus() {
  auth.onAuthStateChanged(user => {
    const authLink = document.getElementById('authLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const uploadLink = document.getElementById('uploadLink');
    const adminLink = document.getElementById('adminLink'); 
    
    // 🔥 MOBILE USER MENU LOGIC 🔥
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        if (user) {
            // Logged in user menu content
            userMenu.innerHTML = `
                <a href="#" onclick="navigate('home');">Home</a>
                <a href="#" onclick="navigate('upload');" style="display: ${user.displayName === 'ADMIN' ? 'block' : 'none'};">Upload</a>
                <a href="#" onclick="navigate('admin');" style="display: ${user.displayName === 'ADMIN' ? 'block' : 'none'};">Admin</a>
                <a href="#" onclick="logoutUser();">Logout</a>
            `;
        } else {
            // Logged out user menu content
            userMenu.innerHTML = `
                <a href="#" onclick="navigate('login');">Login</a>
                <a href="#" onclick="navigate('signup');">Sign Up</a>
            `;
        }
    }
    // 🔥 END MOBILE USER MENU LOGIC 🔥

    if (user) {
      // User logged in है (Desktop Nav)
      authLink.style.display = 'none';
      logoutBtn.style.display = 'inline';
      
      // Admin Check (Desktop Nav)
      if(user.displayName === 'ADMIN') {
        uploadLink.style.display = 'inline';
        adminLink.style.display = 'inline'; 
      } else {
        uploadLink.style.display = 'none'; 
        adminLink.style.display = 'none';
      }
    } else {
      // User logged out है (Desktop Nav)
      authLink.style.display = 'inline';
      logoutBtn.style.display = 'none';
      uploadLink.style.display = 'none';
      adminLink.style.display = 'none'; 
    }
  });
}

/**
 * Naye user ko register karta hai (Standard User Signup).
 */
function handleSignup(e) {
  e.preventDefault();
  
  const email = document.getElementById('signEmail').value;
  const pass = document.getElementById('signPass').value;
  
  auth.createUserWithEmailAndPassword(email, pass)
    .then((userCredential) => {
        // Default user ko 'USER' displayName de do
        return userCredential.user.updateProfile({
            displayName: 'USER' 
        });
    })
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
    });
}

/**
 * Existing user ko login karta hai.
 */
function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      alert("Welcome back!");
      navigate('home'); 
    })
    .catch((error) => {
      alert("Error: " + error.message);
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
  
  // 🔥 FIX 1: Image field ko optional banaya, agar seriesId hai toh.
  const image = document.getElementById('u_image').value;
  const video = document.getElementById('u_video').value;
  const desc = document.getElementById('u_desc').value;

  // Agar seriesId diya gaya hai aur image nahi di gayi, toh 'series-placeholder' use karein
  const finalImage = (seriesId && !image) ? 'SERIES_PLACEHOLDER' : image;

  db.collection("animes").add({
    title: title,
    seriesId: seriesId,  
    season: season,     
    episode: episode,   
    image: finalImage, // Updated image field
    videoUrl: video,
    description: desc,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    alert(`Episode ${episode} of Series ${seriesId} Upload Successful!`);
    e.target.reset();
    // Home page ko refresh karein
    loadAnimeList(currentPage);
  })
  .catch((error) => alert("Upload Failed: " + error.message));
}


// 🔥 PAGINATION SUPPORTED loadAnimeList (FIXED FOR UNIQUE CARDS) 🔥
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
        
      // allAnimeData में सभी Docs को Push करें
      docsToProcess.forEach((doc) => {
          // Document ID ko data mein jodein taki Watch page par use ho sake
          const dataWithId = doc.data();
          dataWithId.docId = doc.id; // Document ID joda
          allAnimeData.push(dataWithId); 
      });
        
      // 🔥 FIX: अब unique series heads को ही render करें
      const uniqueSeriesData = getUniqueSeriesHeads(allAnimeData);
        
      // Document Snapshots ko store karein Next/Previous ke liye
      lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      firstVisibleHistory[page + 1] = lastVisible; 

      const firstVisible = querySnapshot.docs[0];
      firstVisibleHistory[page] = firstVisible; 

      // Update global page number
      currentPage = page;

      // Render the unique list
      renderAnimeCards(uniqueSeriesData, listContainer);

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

// 🔥 NEW: Unique Series/Movie Data निकालने के लिए फ़ंक्शन (Image Logic Updated) 🔥
function getUniqueSeriesHeads(dataArray) {
    const uniqueMap = new Map();

    dataArray.forEach(data => {
        const uniqueKey = (data.seriesId || data.title).trim().toUpperCase();
        const currentData = { ...data };
        
        const currentTimestamp = data.timestamp ? (data.timestamp.seconds || 0) : 0;
        const existingData = uniqueMap.get(uniqueKey);
        const existingTimestamp = existingData ? (existingData.timestamp ? (existingData.timestamp.seconds || 0) : 0) : 0;
        
        if (!existingData) {
            // New series: Store it
            uniqueMap.set(uniqueKey, currentData);
        } else {
            // Existing series: Update if current is newer (to keep latest episode as the head)
            if (currentTimestamp > existingTimestamp) {
                uniqueMap.set(uniqueKey, currentData);
            }
            
            // 🔥 FIX 1 PART 2: Series ka poster preserve karna.
            // Agar latest entry mein image 'SERIES_PLACEHOLDER' hai, 
            // aur old entry mein valid image thi, toh old image use karo.
            if (existingData.image && existingData.image !== 'SERIES_PLACEHOLDER' && currentData.image === 'SERIES_PLACEHOLDER') {
                uniqueMap.get(uniqueKey).image = existingData.image;
            }
        }
    });

    // Final check for 'SERIES_PLACEHOLDER' and replacing it with the actual poster
    // Hum maan rahe hain ki agar kisi ek episode mein bhi image di gayi hai, toh woh series poster hai.
    const finalMap = new Map();
    
    // Step 1: Sabse pehle unique keys ko latest data se set karo
    Array.from(uniqueMap.values()).forEach(data => {
        const key = (data.seriesId || data.title).trim().toUpperCase();
        finalMap.set(key, data);
    });

    // Step 2: Pure allAnimeData mein ghoom kar series poster dhoondo.
    dataArray.forEach(data => {
        const key = (data.seriesId || data.title).trim().toUpperCase();
        const headData = finalMap.get(key);
        
        // Agar head data ka image placeholder hai, aur is current episode mein valid image hai.
        if (headData && (headData.image === 'SERIES_PLACEHOLDER' || headData.image === '') && data.image && data.image !== 'SERIES_PLACEHOLDER') {
            headData.image = data.image; // Use the first found valid image as poster
            finalMap.set(key, headData);
        }
    });
    
    return Array.from(finalMap.values());
}

// Card Rendering Logic (Click handler updated)
function renderAnimeCards(dataArray, container) {
  dataArray.forEach((data) => {
    const card = document.createElement('div');
    card.className = 'card';
        
    const displayTitle = data.seriesId || data.title;
    const displayYear = data.year || (data.description ? data.description.substring(0, 4) : '—');

    // Image URL ko check karo, agar 'SERIES_PLACEHOLDER' hai toh generic placeholder dikhao.
    const imageSource = (data.image === 'SERIES_PLACEHOLDER' || !data.image) 
                        ? 'https://via.placeholder.com/220x270/000/fff?text=No+Image' 
                        : data.image;

    card.innerHTML = `
        <img class="thumb" src="${imageSource}" alt="${displayTitle}" onerror="this.src='https://via.placeholder.com/220x270/000/fff?text=No+Image'">
        <h3>${displayTitle}</h3>
        <p class="meta">${displayYear}</p>
    `;
        
    // 🔥 FIX 2: Watch page par navigate karne ke liye naya logic
    card.onclick = () => {
        const seriesIdentifier = data.seriesId || data.title;
        findAndPlayFirstEpisode(seriesIdentifier);
    }; 
    container.appendChild(card);
  });
}


// Search Filtering Logic (only on current page's data)
function filterAnimeList(query) {
  const listContainer = document.getElementById('animeList');
  const paginationControls = document.getElementById('paginationControls');
  listContainer.innerHTML = ""; // Clear existing list

  // Search ke waqt pagination controls chhupa do
  paginationControls.style.display = (query.length > 0) ? 'none' : 'flex';

  // 🔥 FIX: Filter karne se pehle unique items nikal lo 🔥
  const uniqueDataForSearch = getUniqueSeriesHeads(allAnimeData);

  const filteredData = uniqueDataForSearch.filter(data => {
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


// --- 5. SLIDER LOGIC (Click handler updated) ---
function loadTrendingSlider() {
    // ... (logic remains the same) ...
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
        
        // Image Check
        const imageSource = (data.image === 'SERIES_PLACEHOLDER' || !data.image) 
                            ? 'https://via.placeholder.com/130x150/111/fff?text=Image+Error' 
                            : data.image;
            
        const displayTitle = data.seriesId || data.title;

        slide.innerHTML = `
            <img src="${imageSource}" alt="${displayTitle}" onerror="this.src='https://via.placeholder.com/130x150/111/fff?text=Image+Error'">
            <h4>${displayTitle}</h4>
        `;
            
        // 🔥 FIX 2: Slider click par bhi first episode
        slide.onclick = () => {
            const seriesIdentifier = data.seriesId || data.title;
            findAndPlayFirstEpisode(seriesIdentifier);
        };
            
        sliderContainer.appendChild(slide);
    });
  });
}


// Player Setup (unchanged)
function setupPlayer(data) {
    // ... (logic remains the same) ...
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

// --- 6. SEARCH FUNCTIONALITY (unchanged) ---

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

// --- 7. PAGINATION CONTROL LOGIC (unchanged) ---

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
        nextBtn.disabled = false;
    }
}

function goToNextPage() {
    const nextPageIndex = currentPage + 1;
    loadAnimeList(nextPageIndex); 
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToPreviousPage() {
    if (currentPage > 1) {
        const prevPageIndex = currentPage - 1;
        loadAnimeList(prevPageIndex); 
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}


// 🔥 --- 8. ADMIN MANAGEMENT LOGIC (unchanged) --- 🔥

/**
 * Firestore से सभी सामग्री लोड करता है और एडमिन पैनल में दिखाता है।
 */
function loadAdminContentList() {
    const listContainer = document.getElementById('adminContentList');
    if (!listContainer) return;

    listContainer.innerHTML = '<h3>Loading all series/episodes...</h3>';

    db.collection("animes").orderBy("timestamp", "desc").get()
        .then((querySnapshot) => {
            listContainer.innerHTML = '';
            
            if (querySnapshot.empty) {
                listContainer.innerHTML = '<p>No content uploaded yet.</p>';
                return;
            }

            const list = document.createElement('ul');
            list.style.listStyle = 'none';
            list.style.padding = '0';

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const docId = doc.id; // Document ID को प्राप्त करें

                const listItem = document.createElement('li');
                listItem.style.display = 'flex';
                listItem.style.justifyContent = 'space-between';
                listItem.style.alignItems = 'center';
                listItem.style.padding = '10px 0';
                listItem.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';

                const titleElement = document.createElement('span');
                // Display Title and Episode/Season
                const displayTitle = data.seriesId || data.title;
                const displayEpisode = data.episode ? `E${data.episode}` : (data.season ? `S${data.season}` : '');
                titleElement.innerText = `${displayTitle} ${displayEpisode}`.trim();
                titleElement.style.flexGrow = '1';

                const buttonGroup = document.createElement('div');
                buttonGroup.className = 'button-group'; // CSS class added
                buttonGroup.style.display = 'flex';
                buttonGroup.style.gap = '10px';

                // 🔥 Edit Button (Updated to navigate to edit page) 🔥
                const editBtn = document.createElement('button');
                editBtn.innerText = 'Edit';
                editBtn.className = 'edit-btn';
                editBtn.onclick = () => { 
                    navigate('edit', { docId: docId }); // Edit page par docId ke saath navigate karein
                };

                // Delete Button
                const deleteBtn = document.createElement('button');
                deleteBtn.innerText = 'Delete';
                deleteBtn.className = 'delete-btn';
                deleteBtn.onclick = () => deleteContent(docId, displayTitle);

                buttonGroup.appendChild(editBtn);
                buttonGroup.appendChild(deleteBtn);
                listItem.appendChild(titleElement);
                listItem.appendChild(buttonGroup);
                list.appendChild(listItem);
            });
            listContainer.appendChild(list);

        })
        .catch(error => {
            listContainer.innerHTML = `<p style="color: red; text-align: center;">Error loading admin list: ${error.message}</p>`;
        });
}

/**
 * सामग्री को Firestore से हटाता है। (unchanged)
 * @param {string} docId - वह डॉक्यूमेंट ID जिसे हटाना है।
 * @param {string} title - सामग्री का शीर्षक (कंफर्मेशन के लिए)।
 */
function deleteContent(docId, title) {
    if (confirm(`Are you sure you want to permanently delete: ${title}? This action cannot be undone.`)) {
        db.collection("animes").doc(docId).delete()
            .then(() => {
                alert(`${title} successfully deleted.`);
                // लिस्ट को फिर से लोड करें
                loadAdminContentList(); 
                // Home page list ko bhi refresh karna padega
                loadAnimeList(currentPage); 
            })
            .catch((error) => {
                alert("Error removing document: " + error.message);
            });
    }
}

// 🔥 --- 8.1. CONTENT EDIT LOGIC (unchanged) --- 🔥

/**
 * Content को Firestore से fetch करता है और Edit form में fill करता है।
 * @param {string} docId - जिस document को edit करना है उसकी ID.
 */
function loadContentForEdit(docId) {
    // Template loading ke baad form ko find karein
    const editForm = document.getElementById('editForm');
    
    if (!editForm) return;

    // Document ID को display और hidden field में सेट करें
    const docIdDisplay = document.getElementById('edit-doc-id-display');
    if (docIdDisplay) docIdDisplay.innerText = `ID: ${docId}`;
    
    document.getElementById('e_docId').value = docId;

    db.collection("animes").doc(docId).get()
        .then(doc => {
            if (!doc.exists) {
                alert("Content not found.");
                navigate('admin');
                return;
            }

            const data = doc.data();
            
            // Form fields को fill करें
            document.getElementById('e_title').value = data.title || '';
            document.getElementById('e_seriesId').value = data.seriesId || '';
            document.getElementById('e_season').value = data.season || 1;
            document.getElementById('e_episode').value = data.episode || 1;
            
            // 🔥 Image Field Logic: 'SERIES_PLACEHOLDER' ko empty string se replace karein
            document.getElementById('e_image').value = (data.image === 'SERIES_PLACEHOLDER') ? '' : (data.image || '');

            document.getElementById('e_video').value = data.videoUrl || '';
            document.getElementById('e_desc').value = data.description || '';

            // Form Submit Listener को yahan attach karein (sirf ek baar)
            editForm.removeEventListener('submit', handleUpdate); 
            editForm.addEventListener('submit', handleUpdate);

        })
        .catch(error => {
            alert("Error loading content for edit: " + error.message);
            navigate('admin');
        });
}

/**
 * Edit form submit hone par content ko update karta hai.
 */
function handleUpdate(e) {
    e.preventDefault();
    
    const docId = document.getElementById('e_docId').value;

    // Loading state ke liye button ko disable karein
    const submitBtn = e.submitter;
    submitBtn.disabled = true;
    submitBtn.innerText = 'Saving...';

    const seriesId = document.getElementById('e_seriesId').value;
    const image = document.getElementById('e_image').value;
    
    // 🔥 FIX 1: Update ke time bhi check karein
    const finalImage = (seriesId && !image) ? 'SERIES_PLACEHOLDER' : image;
    
    const updatedData = {
        title: document.getElementById('e_title').value,
        seriesId: seriesId,
        season: parseInt(document.getElementById('e_season').value),
        episode: parseInt(document.getElementById('e_episode').value),
        image: finalImage, // Updated image field
        videoUrl: document.getElementById('e_video').value,
        description: document.getElementById('e_desc').value,
        updatedTimestamp: firebase.firestore.FieldValue.serverTimestamp() // Update time store karein
    };

    if (!docId) {
        alert("Error: Document ID is missing.");
        submitBtn.disabled = false;
        submitBtn.innerText = 'Save Changes';
        return;
    }

    // Firestore update operation
    db.collection("animes").doc(docId).update(updatedData)
        .then(() => {
            alert("Content updated successfully!");
            // Update ke baad admin list page par wapas jaana
            navigate('admin');
        })
        .catch((error) => {
            alert("Update Failed: " + error.message);
            submitBtn.disabled = false;
            submitBtn.innerText = 'Save Changes';
        });
}


// 🔥 --- 8.2. FIRST EPISODE REDIRECTION LOGIC (NEW FUNCTION) --- 🔥

/**
 * Series ID के आधार पर Season 1, Episode 1 का data ढूँढता है और उसे play करता है।
 * @param {string} seriesIdentifier - Series का ID या Title
 */
function findAndPlayFirstEpisode(seriesIdentifier) {
    
    // User को feedback देने के लिए screen clear कर दो
    document.getElementById('view').innerHTML = '<h3 style="text-align:center; padding: 50px; color: var(--accent);">Loading Series...</h3>';

    // 1. Series ID/Title के आधार पर Query set करें
    let query;
    const isSeries = seriesIdentifier.length > 0 && seriesIdentifier.toUpperCase() !== seriesIdentifier; // Simple guess

    if (isSeries) {
        // Series है, तो S1 E1 ढूँढो
        query = db.collection("animes")
            .where("seriesId", "==", seriesIdentifier)
            .orderBy("season", "asc")
            .orderBy("episode", "asc")
            .limit(1);
    } else {
        // Standalone Movie/Episode है, तो Title से ढूँढो (जो कि latest upload में मौजूद है)
        query = db.collection("animes")
            .where("title", "==", seriesIdentifier)
            .limit(1);
    }
    
    // 2. Query Execute करें
    query.get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                const firstEpisodeData = querySnapshot.docs[0].data();
                // DocId is necessary for subsequent episode loading on watch page
                firstEpisodeData.docId = querySnapshot.docs[0].id; 
                
                // First Episode मिल गया, अब watch page पर navigate करो
                navigate('watch', firstEpisodeData);
            } else {
                alert("Error: Episode/Series data not found.");
                navigate('home');
            }
        })
        .catch(error => {
            alert("Error finding first episode: " + error.message);
            navigate('home');
        });
}


// 🔥 --- 9. MOBILE UI LOGIC (unchanged) --- 🔥
// ... (Your existing Mobile UI Logic functions are here: openSidebar, closeSidebar, toggleUserMenu, closeUserMenu, scrollToSection) ...
function openSidebar() {
    document.getElementById("sidebarMenu").style.width = "250px"; 
    document.getElementById("sidebarOverlay").style.display = "block";
    closeUserMenu(); // Make sure user menu is closed
}

function closeSidebar() {
    const sidebar = document.getElementById("sidebarMenu");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar && overlay) {
        sidebar.style.width = "0";
        overlay.style.display = "none";
    }
}

function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        // Toggle the display
        const isHidden = userMenu.style.display === 'none' || userMenu.style.display === '';
        
        if (isHidden) {
            // Close sidebar before opening user menu
            closeSidebar(); 
            userMenu.style.display = 'block';
        } else {
            userMenu.style.display = 'none';
        }
    }
}

function closeUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.style.display = 'none';
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        // Search bar aur header ke size ke liye offset
        const offset = 110; 
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = section.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
        closeSidebar();
    } else {
        // Agar section home page par nahi hai, toh pehle home par navigate karein
        navigate('home'); 
        // Aur thodi der baad scroll karein
        setTimeout(() => scrollToSection(sectionId), 500);
    }
}


// --- 10. INITIALIZATION (Window Load Fix and Event Listeners) ---
window.onload = () => {
    checkLoginStatus();
    navigate('home');  
    
    // 🔥 Attach Mobile UI Event Listeners 🔥
    document.getElementById('menuToggle').addEventListener('click', openSidebar);
    document.getElementById('userToggle').addEventListener('click', toggleUserMenu);
};
