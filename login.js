document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const errorMessage = document.getElementById('error-message');
    
    // --- यह फ्रंट-एंड में एक डेमो है। असली सुरक्षा के लिए, यह Backend Server पर होनी चाहिए। ---
    const DEMO_USERNAME = 'admin'; 
    const DEMO_PASSWORD = 'zookersuperadmin'; 

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        errorMessage.style.display = 'none';

        // --- यहाँ से Backend Server से कनेक्शन शुरू होता है ---
        
        // एक असली एप्लीकेशन में, आप 'fetch' का उपयोग करके अपने सर्वर पर एक POST रिक्वेस्ट भेजेंगे:
        /* fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // सर्वर ने सफलता दी: Admin Panel पर भेज दें।
                window.location.href = 'admin.html';
            } else {
                // सर्वर ने विफलता दी: एरर दिखाएँ।
                errorMessage.textContent = data.message || 'Login failed. Please check your credentials.';
                errorMessage.style.display = 'block';
            }
        });
        */
        
        // **डेमो के लिए (बिना सर्वर के):**
        if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
            alert('Login Successful! Redirecting to Admin Panel...');
            window.location.href = 'admin.html'; // सफलता पर एडमिन पैनल पर भेजें
        } else {
            errorMessage.textContent = 'गलत Username या Password। कृपया पुनः प्रयास करें।';
            errorMessage.style.display = 'block';
        }
    });
});
