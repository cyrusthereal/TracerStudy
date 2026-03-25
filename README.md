# Tracer Study (Firebase Authentication + Firestore)

## Forms (Philippines address + Firebase email verification)

- **Address:** Cascading region → province → city/municipality → barangay via [PSGC API](https://psgc.gitlab.io/api), plus optional street line. See [`address-psgc.js`](address-psgc.js) and [`pages/forms.html`](pages/forms.html).
- **Email Verification:** Firebase handles email link authentication and data storage in Firestore.

## Setup Instructions

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (e.g., "tracer-study-app")
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" (includes email link authentication)
4. Set up Firestore:
   - Go to Firestore Database > Create database
   - Choose "Start in test mode" for development
5. Get your Firebase config from Project settings > General > Your apps > Add app (Web)

### 2. Configure the App
1. In `pages/forms.html`, replace the `firebaseConfig` object with your actual Firebase config
2. Deploy or serve the static files
3. Add your domain to Firebase Authentication > Settings > Authorized domains

### 3. Firestore Security Rules (Production)
Update Firestore rules to allow authenticated writes:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tracer-study-submissions/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## How It Works
1. User fills form and submits
2. Firebase sends verification email with sign-in link
3. User clicks link, gets redirected back to form page
4. Firebase verifies the link and authenticates user
5. Form data is saved to Firestore
6. User is redirected to success page

## Benefits of Firebase
- ✅ No custom backend server needed
- ✅ Built-in email delivery
- ✅ Secure authentication
- ✅ Scalable database
- ✅ Real-time capabilities
