// --- admin.js फाइल (FINAL FIXED VERSION) ---

// 🚨 महत्वपूर्ण: आपकी Keys सही हैं, लेकिन सार्वजनिक हैं
const SUPABASE_URL = 'https://jdndxourrdcfxwegvttr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbmR4b3VycmRjZnh3ZWd2dHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzQyMjgsImV4cHA6MjA4MDk1MDIyOH0.Ffw5ojAiv2W_yTS2neZw5_kvTXXuo5pQRfBwhNRssnM'; 

// ✅ क्लाइंट इनिशियलाइज़ेशन फिक्स: 'supabaseClient' वेरिएबल का उपयोग करें
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- 1. LOGOUT फंक्शन ---
async function handleLogout() {
    try {
        console.log("Attempting Supabase Logout...");
        
        // Supabase Logout: supabaseClient का उपयोग करें
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
             console.error("Supabase Logout Error:", error);
             alert("Logout failed: " + error.message);
        } else {
             window.location.href = 'login.html'; 
        }

    } catch (error) {
        console.error("Unexpected Logout Error:", error);
    }
}


// --- LOGOUT बटन सेटअप (यह हिस्सा DOMContentLoaded से पहले चलेगा) ---
(function setupLogoutListener() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout); 
        console.log("Logout button listener attached successfully.");
    }
})(); 
// ------------------------------------------------------------


// --- 2. Storage Upload Helper Function (Supabase) ---
async function uploadFileAndGetUrl(file) {
    const uniqueFileName = `public/${Date.now()}_${file.name}`; 

    // supabaseClient का उपयोग करें
    const { data, error } = await supabaseClient.storage
        .from('screenshots') 
        .upload(uniqueFileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        throw new Error("Supabase Storage Upload Failed: " + error.message);
    }
    
    // supabaseClient का उपयोग करें
    const { data: publicUrlData } = supabaseClient.storage
        .from('screenshots')
        .getPublicUrl(uniqueFileName); 

    if (publicUrlData && publicUrlData.publicUrl) {
        return publicUrlData.publicUrl;
    } else {
        throw new Error("Failed to get public URL after upload.");
    }
}


// --- 3. DOMContentLoaded (Auth Check और Form Logic) ---
document.addEventListener('DOMContentLoaded', async () => {
    
    // A. SUPABASE AUTH चेक: supabaseClient का उपयोग करें
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        // यदि यूज़र लॉग इन नहीं है, तो उसे लॉगिन पेज पर भेज दें
        window.location.href = 'login.html'; 
        return; 
    } else {
        console.log("Admin is logged in:", user.email);
    }
    
    // --- Variables ---
    const navLinks = document.querySelectorAll('.admin-nav .nav-link');
    const sections = document.querySelectorAll('.admin-section');
    const addForm = document.getElementById('add-content-form');
    const screenshotFilesInput = document.getElementById('screenshot-files');
    
    // --- Tab Switching Logic (कोई बदलाव नहीं) ---
    navLinks.forEach(link => { 
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            sections.forEach(section => {
                section.classList.remove('active-section');
            });
            document.getElementById(targetId).classList.add('active-section');
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // --- Add Content Form Submission (Supabase INSERT) ---
    addForm.addEventListener('submit', async (e) => { 
        e.preventDefault();
        
        const screenshotFiles = screenshotFilesInput ? screenshotFilesInput.files : [];
        let screenshotUrls = [];

        // A. Images को अपलोड करें (uploadFileAndGetUrl फिक्स किया गया है)
        if (screenshotFiles.length > 0) {
            try {
                alert('Images are being uploaded to Supabase Storage... Please wait.');
                
                const uploadPromises = Array.from(screenshotFiles).map(file => {
                    return uploadFileAndGetUrl(file);
                });
                
                screenshotUrls = await Promise.all(uploadPromises);

            } catch (uploadError) {
                alert("इमेज अपलोड करने में त्रुटि आई। कृपया कंसोल देखें।");
                console.error("Image Upload Error:", uploadError);
                return;
            }
        }
        
        // B. Supabase Database में डेटा सेव करें (movies टेबल): supabaseClient का उपयोग करें
        const contentData = {
            title: document.getElementById('title').value,
            releaseDate: document.getElementById('release-date').value,
            category: document.getElementById('category').value,
            tag: document.getElementById('web-dl-tag').value,
            posterUrl: document.getElementById('poster-url').value,
            description: document.getElementById('description').value,
            downloadLink: document.getElementById('download-link').value,
            "screenshotUrls": screenshotUrls, 
        };

        const { data, error } = await supabaseClient
            .from('movies') 
            .insert([contentData]);

        if (error) {
            alert("त्रुटि: डेटाबेस में सेव करने में समस्या आई। " + error.message);
            console.error("Supabase Database Error: ", error);
        } else {
            alert("सफलता! कंटेंट Supabase में अपलोड हो गया है।");
            addForm.reset();
        }
    });

    // ... बाकी Tab Switching, Manage Content Actions, etc. यहाँ जारी हैं ...
});
