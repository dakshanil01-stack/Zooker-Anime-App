// --- admin.js फाइल (Supabase Storage & Database) ---

// 🚨 अपनी वास्तविक Supabase Keys से बदलें 🚨
const SUPABASE_URL = 'https://jdndxourrdcfxwegvttr.supabase.co'; 
const SUPABASE_ANON_KEY = 'process.env.SUPABASE_KEY'; 

// Supabase क्लाइंट को initialize करें
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- 1. Storage Upload Helper Function (Supabase) ---
/**
 * फ़ाइल को Supabase Storage में अपलोड करता है और उसका सार्वजनिक URL लौटाता है।
 * @param {File} file - वह फाइल जिसे अपलोड करना है।
 * @returns {Promise<string>} - फ़ाइल का सार्वजनिक URL।
 */
async function uploadFileAndGetUrl(file) {
    // Storage में एक अद्वितीय (unique) फ़ाइल नाम बनाएँ
    // सुनिश्चित करें कि यह 'screenshots/' बकेट से मेल खाता है जिसे आपने Supabase में बनाया है
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


// --- 2. DOMContentLoaded (सभी इवेंट हैंडलर) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Note: Supabase Auth के लिए अलग लॉजिक की आवश्यकता होगी, 
    // अभी हम केवल डेटा और स्टोरेज पर ध्यान केंद्रित कर रहे हैं।
    // अगर आप Firebase Auth का उपयोग कर रहे थे, तो उसे यहाँ बनाए रखें।
    // For now, removing Firebase Auth check for clean Supabase integration:
    // firebase.auth().onAuthStateChanged(function(user) { ... });

    // --- Variables ---
    const navLinks = document.querySelectorAll('.admin-nav .nav-link');
    const sections = document.querySelectorAll('.admin-section');
    const addForm = document.getElementById('add-content-form');
    const screenshotFilesInput = document.getElementById('screenshot-files');
    // ... बाकी वेरिएबल्स ...


    // --- 3. Tab Switching Logic (आपका existing logic) ---
    // (लॉजिक यहाँ जारी है...)
    navLinks.forEach(link => { /* ... */ });

    // --- 4. Add Content Form Submission (Supabase UPDATED) ---
    addForm.addEventListener('submit', async (e) => { 
        e.preventDefault();
        
        const screenshotFiles = screenshotFilesInput ? screenshotFilesInput.files : [];
        let screenshotUrls = [];

        // A. Images को अपलोड करें (अगर मौजूद हैं)
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
            // स्क्रीनशॉट URLs को array के रूप में भेजें
            "screenshotUrls": screenshotUrls, 
            // Supabase खुद ही 'created_at' timestamp जोड़ देगा
        };

        const { data, error } = await supabase
            .from('movies') // आपके टेबल का नाम
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
