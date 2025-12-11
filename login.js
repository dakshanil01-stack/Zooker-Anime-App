// --- login.js फाइल (FINAL FIXED VERSION) ---

// 🚨 महत्वपूर्ण: अपनी वास्तविक Supabase Keys से बदलें 🚨
const SUPABASE_URL = 'https://jdndxourrdcfxwegvttr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbmR4b3VycmRjZnh3ZWd2dHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzQyMjgsImV4cHA6MjA4MDk1MDIyOH0.Ffw5ojAiv2W_yTS2neZw5_kvTXXuo5pQRfBwhNRssnM'; 

// ✅ क्लाइंट इनिशियलाइज़ेशन फिक्स: 'supabaseClient' वेरिएबल का उपयोग करें
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('admin-login-form');
    const errorMessage = document.getElementById('error-message');

    // पेज लोड होने पर, यदि कोई एक्टिव सेशन है, तो उसे लॉगआउट कर दें 
    // supabaseClient का उपयोग करें
    await supabaseClient.auth.signOut();
    
    // यह सुनिश्चित करने के लिए कि कोई पुराने Firebase ऑब्जेक्ट्स न बचें:
    // यह मानकर चल रहे हैं कि आपने login.html से Firebase SDK हटा दिए हैं।

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('username').value.trim(); 
            const password = document.getElementById('password').value.trim();
            
            errorMessage.style.display = 'none';

            if (!email || !password) {
                errorMessage.textContent = 'Please enter both email and password.';
                errorMessage.style.display = 'block';
                return;
            }

            // --- 1. Supabase Auth: Email और Password के साथ लॉगिन करें ---
            // supabaseClient का उपयोग करें
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                // Login Failed!
                let message = 'Login failed. Check your credentials.';

                if (error.status === 400) {
                    message = 'Invalid email or password.';
                }
                
                errorMessage.textContent = message;
                errorMessage.style.display = 'block';
                console.error('Supabase Login Error:', error);

            } else {
                // Login Successful!
                console.log('Login Successful! User:', data.user);
                alert('Login Successful! Redirecting to Admin Panel...');
                
                // सफलता पर admin.html पर रीडायरेक्ट करें
                window.location.href = 'admin.html';
            }
        });
    }
});
