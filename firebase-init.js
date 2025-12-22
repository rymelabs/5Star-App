// Run this script to initialize your Firebase database with sample data
// Usage: node firebase-init.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc } from 'firebase/firestore';

// Your Firebase config (replace with actual values)
const firebaseConfig = {
  // Add your config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sampleTeams = [
  {
    name: 'Arsenal',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png',
    stadium: 'Emirates Stadium',
    founded: '1886',
    manager: 'Mikel Arteta'
  },
  {
    name: 'Chelsea',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png',
    stadium: 'Stamford Bridge',
    founded: '1905',
    manager: 'Mauricio Pochettino'
  },
  {
    name: 'Manchester United',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-United-Logo.png',
    stadium: 'Old Trafford',
    founded: '1878',
    manager: 'Erik ten Hag'
  },
  {
    name: 'Liverpool',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png',
    stadium: 'Anfield',
    founded: '1892',
    manager: 'Jurgen Klopp'
  }
];

const initializeDatabase = async () => {
  try {
    console.log('Initializing Firebase database...');
    
    // Add sample teams
    for (const team of sampleTeams) {
      await addDoc(collection(db, 'teams'), team);
    }
    
    // Add sample admin user data (you'll need to create this user first)
    await setDoc(doc(db, 'users', 'admin-uid'), {
      name: 'Admin User',
      email: 'admin@fivescores.com',
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initializeDatabase();