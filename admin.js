// --- admin.js फाइल (फिक्स्ड लॉगआउट के साथ) ---

// 🚨 महत्वपूर्ण: आपकी Keys सही हैं, लेकिन सार्वजनिक हैं
const SUPABASE_URL = 'https://jdndxourrdcfxwegvttr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbmR4b3VycmRjZnh3ZWd2dHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzQyMjgsImV4cHA6MjA4MDk1MDIyOH0.Ffw5ojAiv2W_yTS2neZw5_kvTXXuo5pQRfBwhNRssnM'; 

// Supabase क्लाइंट को initialize करें
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- 1. LOGOUT फंक्शन ---
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
             console.error("Supabase Logout Error:", error);
             alert("Logout failed: " + error.message);
        } else {
             alert('Successfully logged out!');
             window.location.href = 'login.html'; 
        }

    } catch (error) {
        console.error("Unexpected Logout Error:", error);
    }
}


// --- 2. Storage Upload Helper Function (Supabase) ---
async function uploadFileAndGetUrl(file) {
    const uniqueFileName = `public/${Date.now()}_${file.name}`; 

    const { data, error } = await supabase.storage
        .from('screenshots') 
        .upload(uniqueFileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        throw new Error("Supabase Storage Upload Failed: " + error.message);
    }
    
    const { data: publicUrlData } = supabase.storage
        .from('screenshots')
        .getPublicUrl(uniqueFileName); 

    if (publicUrlData && publicUrlData.publicUrl) {
        return publicUrlData.publicUrl;
    } else {
        throw new Error("Failed to get public URL after upload.");
    }
}


// --- 3. DOMContentLoaded (फिक्स्ड) ---
document.addEventListener('DOMContentLoaded', async () => {
    
    // --- Variables (Logout बटन सहित) ---
    const logoutBtn = document.getElementById('logout-btn'); 
    const navLinks = document.querySelectorAll('.admin-nav .nav-link');
    const sections = document.querySelectorAll('.admin-section');
    const addForm = document.getElementById('add-content-form');
    const screenshotFilesInput = document.getElementById('screenshot-files');

    // B. LOGOUT बटन इवेंट हैंडलर (इसे Auth चेक से पहले रखा गया है)
    if (logoutBtn) {
        // यह सुनिश्चित करता है कि बटन पर क्लिक इवेंट तुरंत काम करे
        logoutBtn.addEventListener('click', handleLogout); 
    }

    // A. SUPABASE AUTH चेक (अब यह सुरक्षित रूप से 'await' कर सकता है)
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = 'login.html'; 
        return; 
    } else {
        console.log("Admin is logged in:", user.email);
    }
    
    // --- Tab Switching Logic (आपका existing logic) ---
    navLinks.forEach(link => { /* ... (लॉजिक यहाँ जारी है) */ });

    // --- Add Content Form Submission (Supabase INSERT) ---
    addForm.addEventListener('submit', async (e) => { 
        e.preventDefault();
        
        const screenshotFiles = screenshotFilesInput ? screenshotFilesInput.files : [];
        let screenshotUrls = [];

        // A. Images को अपलोड करें
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
        
        // B. Supabase Database में डेटा सेव करें (movies टेबल)
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

        const { data, error } = await supabase
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
