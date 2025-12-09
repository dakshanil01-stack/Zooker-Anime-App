document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const errorMessage = document.getElementById('error-message');
    
    // 1. अपनी Firebase कॉन्फ़िगरेशन डिटेल्स यहाँ भरें
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY_HERE",       // <-- अपनी Key यहाँ डालें
      authDomain: "your-project-id.firebaseapp.com",
      projectId: "your-project-id",
      // अन्य सेटिंग्स...
    };

    // 2. Firebase को Initialize करें
    firebase.initializeApp(firebaseConfig);

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim(); // Username को Email के तौर पर उपयोग करेंगे
        const password = document.getElementById('password').value.trim();
        
        errorMessage.style.display = 'none';

        if (!username || !password) {
            errorMessage.textContent = 'Please enter both email and password.';
            errorMessage.style.display = 'block';
            return;
        }

        // 3. Firebase Email/Password से साइन-इन करें
        firebase.auth().signInWithEmailAndPassword(username, password)
            .then((userCredential) => {
                // Login Successful!
                console.log("User logged in:", userCredential.user);
                alert('Login Successful! Redirecting to Admin Panel...');
                // सफलता पर एडमिन पैनल पर भेजें
                window.location.href = 'admin.html'; 
            })
            .catch((error) => {
                // Login Failed!
                let message = 'Login failed. Check your credentials.';
                if (error.code === 'auth/user-not-found') {
                    message = 'User not found. Check the email.';
                } else if (error.code === 'auth/wrong-password') {
                    message = 'Incorrect password.';
                }
                
                errorMessage.textContent = message;
                errorMessage.style.display = 'block';
                console.error("Login error:", error.message);
            });
    });

    // 4. सुनिश्चित करें कि कोई लॉग इन नहीं है
    firebase.auth().signOut();
});
