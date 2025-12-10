// --- admin.js फाइल ---

// 🚨 महत्वपूर्ण: अपनी वास्तविक Supabase Public Key (Anon Key) से बदलें 🚨
// यदि आप सीधे ब्राउज़र में चला रहे हैं, तो 'process.env.SUPABASE_KEY' काम नहीं करेगा।
const SUPABASE_URL = 'https://jdndxourrdcfxwegvttr.supabase.co'; 
const SUPABASE_ANON_KEY = 'YOUR_ACTUAL_SUPABASE_ANON_KEY_HERE'; 

// Supabase क्लाइंट को initialize करें
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- 1. LOGOUT फंक्शन (Supabase Auth का उपयोग) ---
async function handleLogout() {
    try {
        // Supabase Logout
        const { error } = await supabase.auth.signOut();
        
        if (error) {
             console.error("Supabase Logout Error:", error);
             alert("Logout failed: " + error.message);
        } else {
             alert('Successfully logged out!');
             window.location.href = 'login.html'; // लॉगिन पेज पर रीडायरेक्ट करें
        }

    } catch (error) {
        console.error("Unexpected Logout Error:", error);
    }
}


// --- 2. Storage Upload Helper Function (Supabase) ---
/**
 * फ़ाइल को Supabase Storage में अपलोड करता है और उसका सार्वजनिक URL लौटाता है।
 * @param {File} file - वह फाइल जिसे अपलोड करना है।
 * @returns {Promise<string>} - फ़ाइल का सार्वजनिक URL।
 */
async function uploadFileAndGetUrl(file) {
    // Storage में एक अद्वितीय (unique) फ़ाइल नाम बनाएँ
    const uniqueFileName = `public/${Date.now()}_${file.name}`; 

    // फ़ाइल को 'screenshots' बकेट में अपलोड करें
    const { data, error } = await supabase.storage
        .from('screenshots') // आपके बकेट का नाम
        .upload(uniqueFileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        throw new Error("Supabase Storage Upload Failed: " + error.message);
    }
    
    // फ़ाइल का सार्वजनिक रूप से एक्सेस किया जा सकने वाला URL प्राप्त करें
    const { data: publicUrlData } = supabase.storage
        .from('screenshots')
        .getPublicUrl(uniqueFileName); 

    if (publicUrlData && publicUrlData.publicUrl) {
        return publicUrlData.publicUrl;
    } else {
        throw new Error("Failed to get public URL after upload.");
    }
}


// --- 3. DOMContentLoaded (सभी इवेंट हैंडलर, Auth Check के साथ) ---
document.addEventListener('DOMContentLoaded', async () => {
    
    // A. SUPABASE AUTH चेक (सबसे पहले)
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // यदि यूज़र लॉग इन नहीं है, तो उसे लॉगिन पेज पर भेज दें
        window.location.href = 'login.html'; 
        return; // आगे का कोड न चलाएं
    } else {
        console.log("Admin is logged in:", user.email);
    }
    
    // --- Variables ---
    const navLinks = document.querySelectorAll('.admin-nav .nav-link');
    const sections = document.querySelectorAll('.admin-section');
    const addForm = document.getElementById('add-content-form');
    const screenshotFilesInput = document.getElementById('screenshot-files');
    const logoutBtn = document.getElementById('logout-btn'); 

    // B. LOGOUT बटन इवेंट हैंडलर
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
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
