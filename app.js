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

// --- 2. ROUTING (Page badalne ka system) ---
function navigate(pageId, data = null) {
  const view = document.getElementById('view');
  const template = document.getElementById(`tpl-${pageId}`);
  
  if (!template) return;
  
  // View clear karke naya content daalo
  view.innerHTML = "";
  const clone = template.content.cloneNode(true);
  view.appendChild(clone);

  // Agar Home page hai toh dono functions call karo (Sahi Logic)
  if (pageId === 'home') {
    loadAnimeList();
    loadTrendingSlider(); // 🚨 Yahan Naya Slider Function Call Ho Raha Hai
  }
  
  // Agar Watch page hai toh player setup karo
  if (pageId === 'watch' && data) setupPlayer(data);
}

// Shuru mein Home page dikhao
window.onload = () => {
  checkLoginStatus();
  navigate('home');
};

// --- 3. AUTHENTICATION (Login/Signup/Logout) ---

// Check user login hai ya nahi
function checkLoginStatus() {
  auth.onAuthStateChanged(user => {
    const authLink = document.getElementById('authLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const uploadLink = document.getElementById('uploadLink');

    if (user) {
      // User logged in hai
      authLink.style.display = 'none';
      logoutBtn.style.display = 'inline';
      
      // Check agar wo ADMIN hai (Humne signup ke waqt naam me store kiya tha simple tareeke ke liye)
      if(user.displayName === 'ADMIN') {
        uploadLink.style.display = 'inline';
      }
    } else {
      // Koi logged in nahi
      authLink.style.display = 'inline';
      logoutBtn.style.display = 'none';
      uploadLink.style.display = 'none';
    }
  });
}

// Signup Function
// Signup Function (Naya aur zyada reliable code)
function handleSignup(e) {
  e.preventDefault();
  const email = document.getElementById('signEmail').value;
  const pass = document.getElementById('signPass').value;
  const isAdmin = document.getElementById('isAdmin').checked;

  auth.createUserWithEmailAndPassword(email, pass)
    .then((userCredential) => {
      if(isAdmin) {
        // Hum profile update ka wait kar rahe hain (Promise chaining)
        return userCredential.user.updateProfile({ displayName: "ADMIN" })
          .then(() => userCredential); 
      }
      return userCredential;
    })
    .then(() => {
      // Profile update hone ke baad, hum user ko logout kar denge 
      // taaki woh dobara login karein aur naya ADMIN status load ho.
      return auth.signOut(); 
    })
    .then(() => {
      alert("Admin Account Successfully Created! Please use the Login button now.");
      navigate('login'); // Ab login page par bhejenge
    })
    .catch((error) => alert("Error: " + error.message));
}

// Login Function
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;

  auth.signInWithEmailAndPassword(email, pass)
    .then((userCredential) => {
      alert("Welcome back!");
      navigate('home'); // Login ke baad home pe bhej do
    })
    .catch((error) => alert("Error: " + error.message));
}

// Logout Function
function logoutUser() {
  auth.signOut().then(() => {
    alert("Logged out");
    navigate('home');
  });
}

// --- 4. DATABASE (Upload & Read) ---
// Upload Function (Sirf Admin kar payega)
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
    seriesId: seriesId, // Naya field
    season: season,     // Naya field
    episode: episode,   // Naya field
    image: image,
    videoUrl: video,
    description: desc,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    alert(`Episode ${episode} of Series ${seriesId} Upload Successful!`);
    e.target.reset(); // Form clear karo
  })
  .catch((error) => alert("Upload Failed: " + error.message));
}

// Read Function (Ab Series aur Movies ko sirf ek baar dikhayega)
function loadAnimeList() {
  const listContainer = document.getElementById('animeList');
  
  // Is Set ka use karke hum track rakhenge ki kaun si series/movie pehle hi render ho chuki hai
  const renderedItems = new Set();
  
  db.collection("animes").orderBy("timestamp", "desc").get().then((querySnapshot) => {
    listContainer.innerHTML = ""; // Purana loading text hatao
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Agar seriesId hai toh use unique key banao, warna title ko banao
      const uniqueKey = data.seriesId || data.title; 

      // Agar yeh item pehle hi render ho chuka hai, toh skip karo
      if (renderedItems.has(uniqueKey)) {
          return;
      }
      
      // Item ko rendered list mein daalo
      renderedItems.add(uniqueKey);

      // Card HTML banao
      const card = document.createElement('div');
      card.className = 'card';
      
      // Zaroori: Image mein 'thumb' class jodo aur Title mein thoda badlav karo
      card.innerHTML = `
        <img class="thumb" src="${data.image}" alt="${data.title}" onerror="this.src='https://via.placeholder.com/200/000/fff?text=No+Image'">
        <h3>${data.seriesId || data.title}</h3>
        <p class="meta">${data.description ? data.description.substring(0, 50) + '...' : 'No description provided'}</p>
      `;
      
      // Click karne par Watch page pe le jao
      card.onclick = () => navigate('watch', data);
      
      listContainer.appendChild(card);
    });
  });
}

// --- 5. SLIDER LOGIC (Trending List Dikhana - Naya Function) ---
function loadTrendingSlider() {
    const sliderContainer = document.getElementById('trendingSlider');
    
    // Sirf top 5 latest items fetch karo
    db.collection("animes").orderBy("timestamp", "desc").limit(5).get().then((querySnapshot) => {
        sliderContainer.innerHTML = ""; // Purana loading text hatao
        
        const renderedItems = new Set(); // Duplicates se bachne ke liye
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const uniqueKey = data.seriesId || data.title;
            
            // Duplicate series ko skip karein
            if (renderedItems.has(uniqueKey)) {
                return;
            }
            renderedItems.add(uniqueKey);

            // Slider Item (Card) HTML banao
            const slide = document.createElement('div');
            slide.className = 'slider-card';
            slide.innerHTML = `
                <img src="${data.image}" alt="${data.title}" onerror="this.src='https://via.placeholder.com/250/111/fff?text=Trending'">
                <h4>${data.seriesId || data.title}</h4>
            `;
            
            // Click karne par Watch page pe le jao
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
  
  // Mixed Content Fix
  if (videoSrc.startsWith('http:')) {
      videoSrc = videoSrc.replace('http:', 'https:');
  }

  // Video Source Set Karo (jo episode click hua hai woh play hoga)
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
        
        // 1. Episodes ko Season ke hisaab se group karein (Map ka use karke)
        const episodesBySeason = {};
        querySnapshot.forEach((doc) => {
            const epData = doc.data();
            const seasonKey = `Season ${epData.season}`;
            
            if (!episodesBySeason[seasonKey]) {
                episodesBySeason[seasonKey] = [];
            }
            episodesBySeason[seasonKey].push(epData);
        });

        // 2. Rendering: Grouped data ko display karein
        listContainer.innerHTML = `<h3>${data.seriesId} - Full Series:</h3>`; // Top heading

        for (const seasonTitle in episodesBySeason) {
            const episodes = episodesBySeason[seasonTitle];
            
            // Season Heading / Title
            const seasonHeading = document.createElement('h4');
            seasonHeading.className = 'season-heading'; // CSS ke liye naya class
            seasonHeading.innerText = seasonTitle;
            listContainer.appendChild(seasonHeading);
            
            // Episode Buttons Container
            const episodeButtonsContainer = document.createElement('div');
            episodeButtonsContainer.className = 'episode-buttons-container';
            listContainer.appendChild(episodeButtonsContainer);

            // Har Season ke liye Episode Buttons banao
            episodes.forEach((epData) => {
                const epButton = document.createElement('button');
                epButton.innerText = `E${epData.episode}`; // Sirf Episode number dikhayein
                
                // Current episode ko highlight karein
                if (epData.videoUrl === data.videoUrl) {
                    epButton.classList.add('active');
                }
                
                // Button click event
                epButton.onclick = () => {
                   // Video URL ko https mein badlein (safety ke liye)
                   let newSrc = epData.videoUrl.startsWith('http:') ? epData.videoUrl.replace('http:', 'https:') : epData.videoUrl;
                   
                   // Player update
                   document.getElementById('videoPlayer').src = newSrc;
                   document.getElementById('watchTitle').innerText = epData.title;
                   
                   // Active button change karein
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
