// 🔥 --- 1. FIREBASE INITIALIZATION AND CONFIGURATION --- 🔥
// Your provided Firebase Config is integrated here
const firebaseConfig = {
  apiKey: "AIzaSyDVreUCEz4qFF8LpMhQM963F4tTMgU4pY0",
  authDomain: "zookeranime.firebaseapp.com",
  projectId: "zookeranime",
  storageBucket: "zookeranime.firebasestorage.app",
  messagingSenderId: "440126522624",
  appId: "1:440126522624:web:abcd13f6715bda85721fe5"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();
let isAdmin = false;
let lastVisible = null; // Pagination cursor
const PAGE_SIZE = 10; // Items per page
let currentPage = 1;


// --- 2. TEMPLATE AND ROUTING LOGIC ---
const viewEl = document.getElementById('view');

/**
 * Renders a new view based on the template ID.
 * @param {string} templateId - The ID of the HTML template to load (e.g., 'home', 'login').
 * @param {object} [data] - Optional data to pass to the view (e.g., episode data for 'watch').
 */
function navigate(templateId, data) {
    // 1. Close mobile menus before navigation
    closeSidebar();
    closeUserMenu();
    
    const templateEl = document.getElementById(`tpl-${templateId}`);
    if (!templateEl) {
        console.error("Template not found:", templateId);
        viewEl.innerHTML = `
            <div style="text-align:center; padding: 50px;">
                <h3 style="color: var(--error);">404 - Page Not Found</h3>
                <button onclick="navigate('home');" class="primary-btn" style="margin-top: 20px;">Go Home</button>
            </div>
        `;
        document.getElementById('paginationControls').style.display = 'none';
        return;
    }

    // 2. Load the template content
    const clone = document.importNode(templateEl.content, true);
    viewEl.innerHTML = ''; // Clear current view
    viewEl.appendChild(clone);
    document.getElementById('paginationControls').style.display = 'none';

    // 3. Execute view-specific logic
    switch (templateId) {
        case 'home':
            loadAnimeList();
            loadTrendingSlider();
            break;
        case 'login':
            setupAuthForm('loginForm', handleLogin);
            break;
        case 'signup':
            setupAuthForm('signupForm', handleSignup);
            break;
        case 'upload':
            setupUploadForm();
            break;
        case 'admin':
            if (isAdmin) renderAdminList();
            else navigate('home');
            break;
        case 'edit':
            if (isAdmin && data) setupEditForm(data);
            else navigate('home');
            break;
        case 'watch':
            if (data) renderWatchPage(data);
            else navigate('home');
            break;
    }
}


// --- 3. AUTHENTICATION LOGIC ---

/** Updates the header/mobile menu based on login status. */
function checkLoginStatus() {
    auth.onAuthStateChanged(user => {
        const desktopNav = document.getElementById('desktopNav');
        const userMenu = document.getElementById('userMenu');
        const authLink = document.getElementById('authLink');
        const logoutBtn = document.getElementById('logoutBtn');
        const uploadLink = document.getElementById('uploadLink');
        const adminLink = document.getElementById('adminLink');

        if (user) {
            // Logged In
            authLink.style.display = 'none';
            logoutBtn.style.display = 'inline';
            
            // Check for Admin status (Assuming simple admin check)
            isAdmin = user.email === 'admin@zooker.com'; 
            
            uploadLink.style.display = isAdmin ? 'inline' : 'none';
            adminLink.style.display = isAdmin ? 'inline' : 'none';

            // Mobile User Menu
            userMenu.innerHTML = `
                <a href="#" class="user-email-display" style="color:var(--accent);">${user.email.split('@')[0]}</a>
                <a href="#" onclick="navigate('upload'); closeUserMenu();" style="display:${isAdmin ? 'block' : 'none'};">Upload Content</a>
                <a href="#" onclick="navigate('admin'); closeUserMenu();" style="display:${isAdmin ? 'block' : 'none'};">Admin Panel</a>
                <a href="#" onclick="logoutUser(); closeUserMenu();">Logout</a>
            `;

        } else {
            // Logged Out
            isAdmin = false;
            authLink.style.display = 'inline';
            logoutBtn.style.display = 'none';
            uploadLink.style.display = 'none';
            adminLink.style.display = 'none';
            
            // Mobile User Menu
            userMenu.innerHTML = `
                <a href="#" onclick="navigate('login'); closeUserMenu();">Login</a>
                <a href="#" onclick="navigate('signup'); closeUserMenu();">Sign Up</a>
            `;
        }
    });
}

/** Sets up form submission handler for login/signup forms. */
function setupAuthForm(formId, handlerFunction) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', handlerFunction);
    }
}

/** Handles user login. */
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;

    auth.signInWithEmailAndPassword(email, pass)
        .then(() => {
            alert("Login Successful!");
            navigate('home');
        })
        .catch(error => {
            alert("Login Failed: " + error.message);
        });
}

/** Handles user signup. */
function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signEmail').value;
    const pass = document.getElementById('signPass').value;

    auth.createUserWithEmailAndPassword(email, pass)
        .then(() => {
            alert("Account Created! You are now logged in.");
            navigate('home');
        })
        .catch(error => {
            alert("Signup Failed: " + error.message);
        });
}

/** Handles user logout. */
function logoutUser() {
    auth.signOut()
        .then(() => {
            alert("Logged out successfully.");
            navigate('home');
        })
        .catch(error => {
            alert("Logout Error: " + error.message);
        });
}


// --- 4. UPLOAD AND EDIT LOGIC ---

/** Sets up content upload form submission. */
function setupUploadForm() {
    const form = document.getElementById('uploadForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            title: document.getElementById('u_title').value,
            seriesId: document.getElementById('u_seriesId').value.trim(),
            season: parseInt(document.getElementById('u_season').value),
            episode: parseInt(document.getElementById('u_episode').value),
            image: document.getElementById('u_image').value,
            video: document.getElementById('u_video').value,
            desc: document.getElementById('u_desc').value,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection("animes").add(data)
            .then(() => {
                alert("Content uploaded successfully!");
                form.reset();
                navigate('admin'); 
            })
            .catch(error => {
                alert("Upload Error: " + error.message);
            });
    });
}

/** Sets up content edit form and pre-fills data. */
function setupEditForm(data) {
    const form = document.getElementById('editForm');
    if (!form || !data.docId) return navigate('admin');

    // Pre-fill fields
    document.getElementById('edit-doc-id-display').textContent = `Doc ID: ${data.docId}`;
    document.getElementById('e_docId').value = data.docId;
    document.getElementById('e_title').value = data.title || '';
    document.getElementById('e_seriesId').value = data.seriesId || '';
    document.getElementById('e_season').value = data.season || 1;
    document.getElementById('e_episode').value = data.episode || 1;
    document.getElementById('e_image').value = data.image || '';
    document.getElementById('e_video').value = data.video || '';
    document.getElementById('e_desc').value = data.desc || '';

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const docId = document.getElementById('e_docId').value;
        const updatedData = {
            title: document.getElementById('e_title').value,
            seriesId: document.getElementById('e_seriesId').value.trim(),
            season: parseInt(document.getElementById('e_season').value),
            episode: parseInt(document.getElementById('e_episode').value),
            image: document.getElementById('e_image').value,
            video: document.getElementById('e_video').value,
            desc: document.getElementById('e_desc').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection("animes").doc(docId).update(updatedData)
            .then(() => {
                alert("Content updated successfully!");
                navigate('admin');
            })
            .catch(error => {
                alert("Update Error: " + error.message);
            });
    });
}

/** Deletes a content document. */
function deleteContent(docId) {
    if (!confirm("Are you sure you want to delete this content?")) return;

    db.collection("animes").doc(docId).delete()
        .then(() => {
            alert("Content deleted successfully!");
            renderAdminList(); // Reload the list
        })
        .catch(error => {
            alert("Delete Error: " + error.message);
        });
}

/** Fetches document data and navigates to the edit page. */
function editContent(docId) {
    db.collection("animes").doc(docId).get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                data.docId = doc.id;
                navigate('edit', data);
            } else {
                alert("Document not found for editing.");
                renderAdminList();
            }
        })
        .catch(error => {
            alert("Error fetching document: " + error.message);
        });
}


// --- 5. DATA FETCHING AND RENDERING (HOME PAGE) ---

/** Generates HTML for a skeleton loader card. */
function generateSkeletonCards(count, isSlider = false) {
    let html = '';
    const classType = isSlider ? 'slider-card' : 'card';
    const imgHeight = isSlider ? '200px' : '250px';

    for (let i = 0; i < count; i++) {
        html += `
            <div class="${classType}">
                <div class="skeleton-loader" style="width: 100%; height: ${imgHeight}; border-radius: 8px; margin-bottom: 5px;"></div>
                <div class="skeleton-loader" style="width: 80%; height: 12px; margin: 4px auto;"></div>
                <div class="skeleton-loader" style="width: 50%; height: 8px; margin: 4px auto;"></div>
            </div>
        `;
    }
    return html;
}


/** Renders the list of anime cards with pagination. */
function loadAnimeList() {
    const listEl = document.getElementById('animeList');
    if (!listEl) return;
    
    // Show skeleton loaders while loading
    listEl.innerHTML = generateSkeletonCards(10, false);
    document.getElementById('paginationControls').style.display = 'flex';
    document.getElementById('pageInfo').textContent = `Page ${currentPage}`;

    let query = db.collection("animes")
        .where("episode", "==", 1) // Only show the first episode/entry for the grid
        .orderBy("timestamp", "desc")
        .limit(PAGE_SIZE);

    // Apply pagination cursor
    if (currentPage > 1 && lastVisible) {
        query = query.startAfter(lastVisible);
    }

    query.get()
        .then((querySnapshot) => {
            if (querySnapshot.empty && currentPage > 1) {
                // No more data, go back
                currentPage--;
                loadAnimeList();
                return;
            }
            
            // Get the last visible document for the next page query
            lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
            
            listEl.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const card = `
                    <div class="card" onclick="findAndPlayFirstEpisode('${data.seriesId || data.title}')">
                        <img src="${data.image}" alt="${data.title}" loading="lazy"/>
                        <h3>${data.title}</h3>
                        <p class="meta">${data.desc.split(' ').slice(0, 5).join(' ')}...</p>
                    </div>
                `;
                listEl.innerHTML += card;
            });

            // Update pagination buttons
            document.getElementById('prevBtn').disabled = currentPage === 1;
            // You'll need a way to check if next page has data, 
            // but for simplicity, we'll enable it unless the result count is less than PAGE_SIZE
            document.getElementById('nextBtn').disabled = querySnapshot.size < PAGE_SIZE;

        })
        .catch(error => {
            console.error("Error loading anime list:", error);
            listEl.innerHTML = `<h3 style="color:var(--error);">Error loading content: ${error.message}</h3>`;
        });
}

/** Renders the trending slider (first 8 items, not paginated). */
function loadTrendingSlider() {
    const sliderEl = document.getElementById('trendingSlider');
    if (!sliderEl) return;

    sliderEl.innerHTML = generateSkeletonCards(8, true);

    // Fetch up to 8 items, ordered by timestamp for simplicity (could be a separate 'views' field in a real app)
    db.collection("animes")
        .where("episode", "==", 1) // Only show the main entry
        .orderBy("timestamp", "desc") 
        .limit(8)
        .get()
        .then((querySnapshot) => {
            sliderEl.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const card = `
                    <div class="slider-card" onclick="findAndPlayFirstEpisode('${data.seriesId || data.title}')">
                        <img src="${data.image}" alt="${data.title}" loading="lazy"/>
                        <h4>${data.title}</h4>
                    </div>
                `;
                sliderEl.innerHTML += card;
            });
        })
        .catch(error => {
            console.error("Error loading trending slider:", error);
            sliderEl.innerHTML = `<p style="color:var(--error);">Error loading slider.</p>`;
        });
}


// --- 6. PAGINATION CONTROLS ---

function goToPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        lastVisible = null; // Reset lastVisible to recalculate starting point
        loadAnimeList();
    }
}

function goToNextPage() {
    currentPage++;
    // Note: lastVisible is set in loadAnimeList
    loadAnimeList();
}


// --- 7. ADMIN LIST RENDERING ---

/** Renders the full list of content for the Admin Panel. */
function renderAdminList() {
    const listEl = document.getElementById('adminContentList');
    if (!listEl) return;

    listEl.innerHTML = generateSkeletonCards(5).replace(/card/g, 'admin-list-item'); // Reuse skeleton style

    db.collection("animes").orderBy("seriesId", "asc").orderBy("season", "asc").get()
        .then((querySnapshot) => {
            listEl.innerHTML = '';
            const ul = document.createElement('ul');
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${data.seriesId} - S${data.season} E${data.episode}: ${data.title}</span>
                    <div class="button-group">
                        <button class="edit-btn" onclick="editContent('${doc.id}')">Edit</button>
                        <button class="delete-btn" onclick="deleteContent('${doc.id}')">Delete</button>
                    </div>
                `;
                ul.appendChild(li);
            });
            listEl.appendChild(ul);
        })
        .catch(error => {
            listEl.innerHTML = `<h3 style="color:var(--error);">Admin Load Error: ${error.message}</h3>`;
        });
}


// --- 8. WATCH PAGE LOGIC ---

/** Renders the video player and details for a specific episode. */
function renderWatchPage(episodeData) {
    document.getElementById('watchTitle').textContent = episodeData.title || 'Episode Title';
    document.getElementById('watchDesc').textContent = episodeData.desc || 'No description available.';
    document.getElementById('videoPlayer').src = episodeData.video || '';
    
    // Now load all episodes for the series
    if (episodeData.seriesId) {
        loadEpisodeList(episodeData.seriesId, episodeData.docId);
    }
}

/** Loads and renders all episodes/seasons for a given seriesId. */
function loadEpisodeList(seriesId, activeDocId) {
    const container = document.getElementById('episodeListContainer');
    if (!container) return;

    container.innerHTML = '<h3>Episodes</h3><p style="color:var(--muted);">Loading episode list...</p>';

    db.collection("animes")
        .where("seriesId", "==", seriesId)
        .orderBy("season", "asc")
        .orderBy("episode", "asc")
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                container.innerHTML = '<h3>Episodes</h3><p style="color:var(--muted);">No more episodes found for this series.</p>';
                return;
            }

            let currentSeason = 0;
            let seasonHtml = '';
            let buttonsHtml = '';

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const docId = doc.id;
                
                // Start a new season group
                if (data.season !== currentSeason) {
                    if (currentSeason !== 0) {
                        seasonHtml += `<div class="episode-buttons-container">${buttonsHtml}</div>`;
                    }
                    seasonHtml += `<h4 class="season-heading">Season ${data.season}</h4>`;
                    buttonsHtml = '';
                    currentSeason = data.season;
                }

                // Append episode button
                const isActive = (docId === activeDocId) ? 'active' : '';
                buttonsHtml += `
                    <button class="${isActive}" onclick="playEpisode('${docId}')">E${data.episode}</button>
                `;
            });
            
            // Append the last season's buttons
            seasonHtml += `<div class="episode-buttons-container">${buttonsHtml}</div>`;
            container.innerHTML = `<h3>Episodes</h3>${seasonHtml}`;

        })
        .catch(error => {
            container.innerHTML = `<h3 style="color:var(--error);">Error loading episodes: ${error.message}</h3>`;
        });
}

/** Plays a specific episode when its button is clicked. */
function playEpisode(docId) {
    db.collection("animes").doc(docId).get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                data.docId = doc.id;
                // Re-render the watch page with the new episode data
                renderWatchPage(data);
                
                // Highlight the new active button (optional, handled by renderWatchPage)
                // You might need to add a small scroll-to-top here
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert("Episode data not found.");
            }
        })
        .catch(error => {
            alert("Error loading episode: " + error.message);
        });
}


/** Finds the first episode of a series/movie and navigates to the watch page. */
function findAndPlayFirstEpisode(seriesIdentifier) {
    // 1. User feedback and query setup
    document.getElementById('view').innerHTML = '<h3 style="text-align:center; padding: 50px; color: var(--accent);">Loading Series...</h3>';
    document.getElementById('paginationControls').style.display = 'none';

    // Query the database for the series/movie entry
    const query = db.collection("animes")
        .where("seriesId", "==", seriesIdentifier)
        .orderBy("season", "asc")
        .orderBy("episode", "asc")
        .limit(1);
    
    // 2. Query Execute
    query.get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                const firstEpisodeData = querySnapshot.docs[0].data();
                firstEpisodeData.docId = querySnapshot.docs[0].id; 
                
                navigate('watch', firstEpisodeData);
            } else {
                document.getElementById('view').innerHTML = `
                    <div style="text-align:center; padding: 50px;">
                        <h3 style="color: var(--warning);">Oops! Content Not Found.</h3>
                        <p>No data found for the series: **${seriesIdentifier}**.</p>
                        <button onclick="navigate('home');" class="primary-btn" style="margin-top: 20px;">Go to Home</button>
                    </div>
                `;
            }
        })
        .catch(error => {
            document.getElementById('view').innerHTML = `
                <div style="text-align:center; padding: 50px;">
                    <h3 style="color: var(--error);">Database Error</h3>
                    <p>Error finding content: ${error.message}</p>
                    <button onclick="navigate('home');" class="primary-btn" style="margin-top: 20px;">Go to Home</button>
                </div>
            `;
        });
}


// --- 9. MOBILE UI LOGIC ---

function openSidebar() {
    document.getElementById("sidebarMenu").style.width = "250px"; 
    document.getElementById("sidebarOverlay").style.display = "block";
    closeUserMenu(); 
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
        const isHidden = userMenu.style.display === 'none' || userMenu.style.display === '';
        
        if (isHidden) {
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
        navigate('home'); 
        setTimeout(() => scrollToSection(sectionId), 500);
    }
}


// --- 10. INITIALIZATION (Window Load Fix and Event Listeners) ---
window.onload = () => {
    // 1. Initial Checks and Routing
    checkLoginStatus();
    navigate('home'); 
    
    // 2. Attach Mobile UI Event Listeners 
    document.getElementById('menuToggle').addEventListener('click', openSidebar);
    document.getElementById('userToggle').addEventListener('click', toggleUserMenu);
    
    // 3. Search Bar Listener
    document.getElementById('searchBar').addEventListener('keyup', (e) => {
        const query = e.target.value.toLowerCase();
        // In a real application, you would make a new Firestore query here.
        // For now, this is a placeholder. You could filter currently visible cards.
        // Since we are using Firestore, a full-text search is complex and usually requires a service like Algolia.
        if (query.length > 2) {
            // Placeholder for a real search function
            console.log("Searching for: " + query);
        }
    });
};
