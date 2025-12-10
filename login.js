// --- login.js फाइल (Supabase Authentication) ---

// 🚨 महत्वपूर्ण: अपनी वास्तविक Supabase Keys से बदलें 🚨
const SUPABASE_URL = 'https://jdndxourrdcfxwegvttr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbmR4b3VycmRjZnh3ZWd2dHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzQyMjgsImV4cCI6MjA4MDk1MDIyOH0.Ffw5ojAiv2W_yTS2neZw5_kvTXXuo5pQRfBwhNRssnM'; 

// Supabase क्लाइंट को initialize करें
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('admin-login-form');
    const errorMessage = document.getElementById('error-message');

    // पेज लोड होने पर, यदि कोई एक्टिव सेशन है, तो उसे लॉगआउट कर दें 
    // ताकि यूजर हमेशा फ्रेश लॉग इन करे।
    await supabase.auth.signOut();
    
    // यह सुनिश्चित करने के लिए कि कोई पुराने Firebase ऑब्जेक्ट्स न बचें:
    // यदि आप अभी भी login.html में Firebase SDK लोड कर रहे हैं, तो उसे हटा दें।

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => { // async कीवर्ड आवश्यक है
            e.preventDefault();

            // Firebase में 'username' ईमेल था, यहाँ भी वही उपयोग होगा
            const email = document.getElementById('username').value.trim(); 
            const password = document.getElementById('password').value.trim();
            
            errorMessage.style.display = 'none';

            if (!email || !password) {
                errorMessage.textContent = 'Please enter both email and password.';
                errorMessage.style.display = 'block';
                return;
            }

            // --- 1. Supabase Auth: Email और Password के साथ लॉगिन करें ---
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                // Login Failed!
                let message = 'Login failed. Check your credentials.';

                // Supabase में अक्सर यह 'Invalid login credentials' एरर आता है
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
