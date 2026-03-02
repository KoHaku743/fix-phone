# fix-phone

FixPhone is a phone repair service website where customers can browse repair services and book appointments online.

## Accessing the Website

### Live Website (GitHub Pages)

The frontend is automatically deployed to GitHub Pages on every push to `main`.
You can access it at:

**https://kohaku743.github.io/fix-phone/**

> **Note:** The GitHub Pages version serves the static frontend only. Features that require the backend (booking appointments, loading live service data) will not be functional without also running the backend server locally.

### Running Locally (Full Functionality)

To run the full application with backend support:

1. **Install dependencies**

   ```bash
   cd backend
   npm install
   ```

2. **Start the server**

   ```bash
   npm start
   ```

3. **Open the website**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

   The admin panel is available at [http://localhost:3000/admin](http://localhost:3000/admin).
