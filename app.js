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

  // Agar Home page hai toh data fetch karo
  if (pageId === 'home') loadAnimeList();
  
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
// Read Function (Home page pe list dikhana)
function loadAnimeList() {
  const listContainer = document.getElementById('animeList');
  
  db.collection("animes").orderBy("timestamp", "desc").get().then((querySnapshot) => {
    listContainer.innerHTML = ""; // Purana loading text hatao
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;

      // Card HTML banao
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="${data.image}" alt="${data.title}" onerror="this.src='https://via.placeholder.com/200'">
        <h3>${data.title}</h3>
      `;
      
      // Click karne par Watch page pe le jao
      card.onclick = () => navigate('watch', data);
      
      listContainer.appendChild(card);
    });
  }); }
// Player Setup (Ab Series ke episodes bhi dikhayega)
function setupPlayer(data) {
  document.getElementById('watchTitle').innerText = data.title;
  document.getElementById('watchDesc').innerText = data.description;
  
  let videoSrc = data.videoUrl;
  
  // Mixed Content Fix
  if (videoSrc.startsWith('http:')) {
      videoSrc = videoSrc.replace('http:', 'https:');
  }

  // Video Source Set Karo
  document.getElementById('videoPlayer').src = videoSrc;

  // --- Episode Listing Logic ---
  const listContainer = document.getElementById('episodeListContainer');
  listContainer.innerHTML = ''; // Pehle container ko clear karo

  if (data.seriesId) {
    // Agar seriesId hai, toh saare episodes ko fetch karo
    listContainer.innerHTML = '<h3>Loading Episodes...</h3>';

    db.collection("animes")
      .where("seriesId", "==", data.seriesId)
      .orderBy("season", "asc")
      .orderBy("episode", "asc")
      .get()
      .then((querySnapshot) => {
        listContainer.innerHTML = `<h3>${data.seriesId} - Episodes:</h3>`;
        
        querySnapshot.forEach((doc) => {
          const epData = doc.data();
          
          const epButton = document.createElement('button');
          epButton.innerText = `S${epData.season} E${epData.episode}`;
          
          // Agar yeh current episode hai, toh use highlight karo
          if (epData.title === data.title) {
              epButton.classList.add('active');
          }
          
          // Button click karne par naya video load karo
          epButton.onclick = () => {
             // Sirf player ka source badlo, page refresh nahi
             let newSrc = epData.videoUrl.startsWith('http:') ? epData.videoUrl.replace('http:', 'https:') : epData.videoUrl;
             document.getElementById('videoPlayer').src = newSrc;
             document.getElementById('watchTitle').innerText = epData.title;
             
             // Active class change karo
             document.querySelectorAll('.episode-list button').forEach(btn => btn.classList.remove('active'));
             epButton.classList.add('active');
          };
          
          listContainer.appendChild(epButton);
        });
      })
      .catch(error => {
          listContainer.innerHTML = `<p>Error loading episodes: ${error.message}</p>`;
      });
  }
}