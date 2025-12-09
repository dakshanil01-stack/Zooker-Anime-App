document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.admin-nav .nav-link');
    const sections = document.querySelectorAll('.admin-section');
    const addForm = document.getElementById('add-content-form');
    const contentList = document.getElementById('content-list');
    const editFormPlaceholder = document.getElementById('edit-form-placeholder');

    // --- Tab Switching Logic ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Prevent default hash jump if it's a section link
            if (link.getAttribute('href').startsWith('#')) {
                e.preventDefault(); 
                
                // 1. Deactivate all links and sections
                navLinks.forEach(l => l.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active-section'));
                editFormPlaceholder.classList.add('hidden'); // Hide edit form when switching tabs

                // 2. Activate the clicked link and its corresponding section
                link.classList.add('active');
                const targetId = link.getAttribute('href').substring(1); // Get section ID from href
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.add('active-section');
                }
            }
        });
    });

    // --- Add Content Form Submission (Frontend Logic Only) ---
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // In a real application, you would collect the form data and send it to your server here.
        const title = document.getElementById('title').value;
        const date = document.getElementById('release-date').value;

        // Display a success message (Frontend feedback)
        alert(`Content successfully prepared for upload! 
        Title: ${title}
        Date: ${date}
        
        **Note:** This data has not been saved to a live server. A backend system is required for actual storage.`);

        // Clear the form after 'successful' submission
        addForm.reset();
    });

    // --- Manage Content Actions (Frontend Logic Only) ---
    contentList.addEventListener('click', (e) => {
        const item = e.target.closest('.content-item');
        if (!item) return;

        const title = item.querySelector('.item-title').textContent;

        if (e.target.closest('.edit-btn')) {
            // Show the dynamic edit form
            document.getElementById('current-edit-title').textContent = title;
            editFormPlaceholder.classList.remove('hidden');
            // In a real app, the form inputs would be filled with data retrieved from the server.
            
        } else if (e.target.closest('.delete-btn')) {
            if (confirm(`Are you sure you want to delete "${title}"?`)) {
                // In a real app, you would send a delete request to your server.
                alert(`Frontend simulated deletion: "${title}" would be deleted.`);
                item.remove(); // Remove item from the list visually
            }
        }
    });
    
    // Save Changes button logic (inside the dynamically shown edit form)
    document.querySelector('.save-btn').addEventListener('click', () => {
        alert('Changes saved! (Simulated backend update)');
        editFormPlaceholder.classList.add('hidden');
    });
});
