
ZOOKER - Static SPA for Netlify
==============================

What this is
------------
A static single-page app (SPA) that demonstrates:
- Responsive neon-styled UI
- Client-side login/signup (localStorage)
- Admin "upload" form that stores media metadata in localStorage
- Watch/player page which uses third-party video URLs (or hosted files)

Important notes
---------------
- This is a static site meant for Netlify. Netlify itself does not provide server-side file uploads or databases.
- For real file uploads or persistent server storage, connect to a backend (Firebase, Supabase, or your own API).
- Demo video links included point to public sample videos (Big Buck Bunny, Tears of Steel) which are license-friendly.
- To deploy: unzip and drag the folder to Netlify, or connect a Git repo.

How to use
----------
1. Upload to Netlify as a site (drag & drop the zipped folder content).
2. Visit /#/signup to create a demo account. Check "Make this an admin account" to enable upload.
3. Go to /#/upload to add entries (paste video URLs or links to files you host).
4. Click Play to view.

Customization
-------------
- Replace thumbnails and video URLs in localStorage or edit /app.js initial samples.
- If you want a server-backed solution, I can help add a Firebase/Supabase integration.

License
-------
Provided as-is. You are free to modify and use. The demo media used (Big Buck Bunny, Tears of Steel) are Creative Commons / permissive examples.
