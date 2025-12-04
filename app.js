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
  
  // 🔥 FIX: Upload Form Event Listener (Yeh pehle missing tha) 🔥
  if (pageId === 'upload') {
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
  }
    
  if (pageId === 'watch' && data) setupPlayer(data);
  
  // 🔥 FIX: Login/Signup Event Listeners ko yahan attach karein 🔥
  if (pageId === 'login') {
      const loginForm = document.getElementById('loginForm');
      if (loginForm) {
          loginForm.addEventListener('submit', handleLogin);
      }
  }

  if (pageId === 'signup') {
      const signupForm = document.getElementById('signupForm');
      if (signupForm) {
          signupForm.addEventListener('submit', handleSignup);
      }
  }
  // 🔥 END FIX 🔥
  
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
        // Default user ko 'USER' displayName de do (Admin access dene ke liye manually Firebase Console use karein)
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
            allAnimeData.push(doc.data()); 
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

// 🔥 NEW: Unique Series/Movie Data निकालने के लिए फ़ंक्शन 🔥
function getUniqueSeriesHeads(dataArray) {
    const uniqueMap = new Map();

    dataArray.forEach(data => {
        // Unique Key: SeriesID ko prioritize karein, agar nahi hai toh Title ko
        const uniqueKey = (data.seriesId || data.title).trim().toUpperCase();
        
        // Map में केवल एक ही uniqueKey वाला item होगा।
        // हम उस item को रखते हैं जिसका Timestamp सबसे नया है (latest upload)
        if (!uniqueMap.has(uniqueKey) || data.timestamp > uniqueMap.get(uniqueKey).timestamp) {
            uniqueMap.set(uniqueKey, data);
        }
    });

    // Map से Array वापस करें
    return Array.from(uniqueMap.values());
}

// Card Rendering Logic
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


// --- 5. SLIDER LOGIC ---
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


// Player Setup
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

// --- 7. PAGINATION CONTROL LOGIC ---

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
    // Note: Agar hum unique items ko filter kar rahe hain, toh yeh count thoda misleading ho sakta hai.
    // Lekin Firebase limit `itemsPerPage` ke barabar hai, isliye yeh check theek hai.
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


// 🔥 --- 8. ADMIN MANAGEMENT LOGIC --- 🔥

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
                buttonGroup.style.display = 'flex';
                buttonGroup.style.gap = '10px';

                // Edit Button (Placeholder)
                const editBtn = document.createElement('button');
                editBtn.innerText = 'Edit';
                editBtn.className = 'edit-btn';
                // Note: Agar aap Tailwind use kar rahe hain, toh yahan CSS classes use karein. Abhi inline styles hain.
                editBtn.style.background = 'var(--accent2)';
                editBtn.style.color = 'var(--bg)';
                editBtn.style.border = 'none';
                editBtn.style.padding = '5px 10px';
                editBtn.style.borderRadius = '4px';
                editBtn.onclick = () => { 
                    alert(`Edit functionality for ${displayTitle} (ID: ${docId}) is coming soon!`);
                };

                // Delete Button
                const deleteBtn = document.createElement('button');
                deleteBtn.innerText = 'Delete';
                deleteBtn.className = 'delete-btn';
                deleteBtn.style.background = 'red';
                deleteBtn.style.color = 'white';
                deleteBtn.style.border = 'none';
                deleteBtn.style.padding = '5px 10px';
                deleteBtn.style.borderRadius = '4px';
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
 * सामग्री को Firestore से हटाता है।
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

// 🔥 --- 9. MOBILE UI LOGIC --- 🔥

/**
 * Mobile Sidebar Menu खोलता है।
 */
function openSidebar() {
    document.getElementById("sidebarMenu").style.width = "250px"; 
    document.getElementById("sidebarOverlay").style.display = "block";
    closeUserMenu(); // Make sure user menu is closed
}

/**
 * Mobile Sidebar Menu बंद करता है।
 */
function closeSidebar() {
    const sidebar = document.getElementById("sidebarMenu");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar && overlay) {
        sidebar.style.width = "0";
        overlay.style.display = "none";
    }
}

/**
 * Mobile User Menu dropdown को खोलता/बंद करता है।
 */
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

/**
 * Mobile User Menu dropdown को बंद करता है।
 */
function closeUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.style.display = 'none';
    }
}

/**
 * Section तक smooth scroll करता है।
 */
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
