// --- Firebase SDKs को अपने admin.html के <head> में जोड़ना सुनिश्चित करें: ---
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-storage.js"></script> 
// -------------------------------------------------------------------------


// --- Firebase कॉन्फ़िगरेशन ---
const firebaseConfig = {
  apiKey: "AIzaSyDVreUCEz4qFF8LpMhQM963F4tTMgU4pY0",
  authDomain: "zookeranime.firebaseapp.com",
  projectId: "zookeranime",
  storageBucket: "zookeranime.firebasestorage.app",
  messagingSenderId: "440126522624",
  appId: "1:440126522624:web:abcd13f6715bda85721fe5"
};

// सुनिश्चित करें कि app, firestore, और storage initialize हों
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); 
const storage = firebase.storage(); // Firebase Storage को initialize करें


// --- 1. Storage Upload Helper Function ---
/**
 * फ़ाइल को Firebase Storage में अपलोड करता है और उसका सार्वजनिक URL लौटाता है।
 * @param {File} file - वह फाइल जिसे अपलोड करना है।
 * @returns {Promise<string>} - फ़ाइल का डाउनलोड URL।
 */
async function uploadFileAndGetUrl(file) {
    const storageRef = storage.ref();
    // Storage में एक अद्वितीय (unique) फ़ाइल नाम बनाएँ
    const uniqueFileName = `screenshots/${Date.now()}_${file.name}`;
    const fileRef = storageRef.child(uniqueFileName);

    // फ़ाइल अपलोड करें
    const uploadTask = fileRef.put(file);

    // अपलोड होने तक प्रतीक्षा करें
    await uploadTask;

    // डाउनलोड URL प्राप्त करें
    const downloadURL = await fileRef.getDownloadURL();
    return downloadURL;
}


// --- 2. DOMContentLoaded (सभी इवेंट हैंडलर) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Login Check (आपका existing logic) ---
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            // यदि यूजर लॉग इन नहीं है, तो उसे लॉगिन पेज पर भेज दें
            // alert('Access Denied. Please log in.'); // Console में चेक करने के लिए alert को हटाया जा सकता है
            window.location.href = 'login.html';
        } else {
            console.log("Admin is logged in:", user.email);
        }
    });

    // --- Variables ---
    const navLinks = document.querySelectorAll('.admin-nav .nav-link');
    const sections = document.querySelectorAll('.admin-section');
    const addForm = document.getElementById('add-content-form');
    const contentList = document.getElementById('content-list');
    const editFormPlaceholder = document.getElementById('edit-form-placeholder');
    const screenshotFilesInput = document.getElementById('screenshot-files');


    // --- 3. Tab Switching Logic (आपका existing logic) ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href').startsWith('#')) {
                e.preventDefault(); 
                navLinks.forEach(l => l.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active-section'));
                editFormPlaceholder.classList.add('hidden'); 

                link.classList.add('active');
                const targetId = link.getAttribute('href').substring(1); 
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.add('active-section');
                }
            }
        });
    });


    // --- 4. Add Content Form Submission (Firebase के साथ UPDATED) ---
    addForm.addEventListener('submit', async (e) => { // 'async' कीवर्ड जोड़ना आवश्यक है
        e.preventDefault();
        
        const screenshotFiles = screenshotFilesInput ? screenshotFilesInput.files : [];
        let screenshotUrls = [];

        // A. Images को अपलोड करें (अगर मौजूद हैं)
        if (screenshotFiles.length > 0) {
            try {
                // लोडिंग फीडबैक देने के लिए alert
                const uploadAlert = alert('Images are being uploaded... Please wait for the final success message.');
                
                // सभी इमेजेस को Firebase Storage पर अपलोड करें
                const uploadPromises = Array.from(screenshotFiles).map(file => {
                    return uploadFileAndGetUrl(file);
                });
                
                screenshotUrls = await Promise.all(uploadPromises);
                console.log('All images uploaded successfully:', screenshotUrls);

            } catch (uploadError) {
                alert("इमेज अपलोड करने में गंभीर त्रुटि आई। कृपया कंसोल देखें और पुनः प्रयास करें।");
                console.error("Image Upload Error:", uploadError);
                return; // अगर इमेज अपलोड में फेल हो जाए तो डेटाबेस में सेव न करें
            }
        }
        
        // B. Firestore में डेटा सेव करें
        const contentData = {
            title: document.getElementById('title').value,
            releaseDate: document.getElementById('release-date').value,
            category: document.getElementById('category').value,
            tag: document.getElementById('web-dl-tag').value,
            posterUrl: document.getElementById('poster-url').value,
            description: document.getElementById('description').value,
            downloadLink: document.getElementById('download-link').value,
            // नया: स्क्रीनशॉट URLs को यहाँ सेव करें
            screenshotUrls: screenshotUrls, 
            timestamp: firebase.firestore.FieldValue.serverTimestamp() 
        };

        db.collection("movies").add(contentData)
            .then((docRef) => {
                alert("सफलता! कंटेंट (और इमेजेस) Firebase में अपलोड हो गया है। कंटेंट ID: " + docRef.id);
                addForm.reset();
            })
            .catch((error) => {
                alert("त्रुटि: डेटाबेस में सेव करने में समस्या आई। " + error.message);
                console.error("Error adding document: ", error);
            });
    });


    // --- 5. Manage Content Actions (आपका existing logic) ---
    contentList.addEventListener('click', (e) => {
        const item = e.target.closest('.content-item');
        if (!item) return;

        const title = item.querySelector('.item-title').textContent;

        if (e.target.closest('.edit-btn')) {
            document.getElementById('current-edit-title').textContent = title;
            editFormPlaceholder.classList.remove('hidden');
            // TODO: Real-world: Fetch data from Firebase for editing.
            
        } else if (e.target.closest('.delete-btn')) {
            if (confirm(`Are you sure you want to delete "${title}"?`)) {
                // TODO: Real-world: Implement actual deletion logic using Firebase.
                alert(`Frontend simulated deletion: "${title}" would be deleted.`);
                item.remove();
            }
        }
    });
    
    // Save Changes button logic
    document.querySelector('.save-btn').addEventListener('click', () => {
        alert('Changes saved! (Simulated backend update)');
        editFormPlaceholder.classList.add('hidden');
        // TODO: Real-world: Implement actual update logic using Firebase.
    });
});
