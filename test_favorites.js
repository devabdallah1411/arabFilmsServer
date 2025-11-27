const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api'; // Change this to your server URL
let authToken = '';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

const testWork = {
  type: 'film',
  nameArabic: 'فيلم تجريبي',
  nameEnglish: 'Test Film',
  year: 2024,
  director: 'مخرج تجريبي',
  assistantDirector: 'مخرج مساعد تجريبي',
  genre: 'دراما',
  cast: ['ممثل أول', 'ممثلة ثانية'],
  country: 'مصر',
  filmingLocation: 'القاهرة',
  summary: 'ملخص تجريبي للفيلم'
};

async function testFavorites() {
  try {
    console.log('🧪 Testing Favorites Feature...\n');

    // 1. Sign in user
    console.log('1️⃣ Signing in user...');
    const signinResponse = await axios.post(`${BASE_URL}/users/signin`, testUser);
    authToken = signinResponse.data.token;
    console.log('✅ User signed in successfully\n');

    // 2. Create a test work
    console.log('2️⃣ Creating test work...');
    const workResponse = await axios.post(`${BASE_URL}/works`, testWork, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const workId = workResponse.data._id;
    console.log(`✅ Work created with ID: ${workId}\n`);

    // 3. Check initial favorite status
    console.log('3️⃣ Checking initial favorite status...');
    const initialStatus = await axios.get(`${BASE_URL}/users/favorites/check/${workId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Initial status: ${initialStatus.data.isFavorite}\n`);

    // 4. Add to favorites
    console.log('4️⃣ Adding work to favorites...');
    const addResponse = await axios.post(`${BASE_URL}/users/favorites`, 
      { workId }, 
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log(`✅ Added to favorites: ${addResponse.data.message}\n`);

    // 5. Check favorite status again
    console.log('5️⃣ Checking favorite status after adding...');
    const statusAfterAdd = await axios.get(`${BASE_URL}/users/favorites/check/${workId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Status after adding: ${statusAfterAdd.data.isFavorite}\n`);

    // 6. Get favorites list
    console.log('6️⃣ Getting favorites list...');
    const favoritesList = await axios.get(`${BASE_URL}/users/favorites`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Favorites count: ${favoritesList.data.count}`);
    console.log(`✅ Favorites: ${favoritesList.data.favorites.map(f => f.nameArabic).join(', ')}\n`);

    // 7. Remove from favorites
    console.log('7️⃣ Removing work from favorites...');
    const removeResponse = await axios.delete(`${BASE_URL}/users/favorites/${workId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Removed from favorites: ${removeResponse.data.message}\n`);

    // 8. Check final favorite status
    console.log('8️⃣ Checking final favorite status...');
    const finalStatus = await axios.get(`${BASE_URL}/users/favorites/check/${workId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Final status: ${finalStatus.data.isFavorite}\n`);

    // 9. Clean up - delete test work
    console.log('9️⃣ Cleaning up - deleting test work...');
    await axios.delete(`${BASE_URL}/works/${workId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Test work deleted\n');

    console.log('🎉 All favorites tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testFavorites();
