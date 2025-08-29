// Test registration with proper validation
const testRegistration = async () => {
  const testData = {
    name: "John Doe",
    email: "testuser" + Date.now() + "@example.com",
    password: "Test@1234"
  };

  try {
    const response = await fetch('http://localhost:3001/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log('Response:', data);
    } else {
      console.log('❌ Registration failed:');
      console.log('Status:', response.status);
      console.log('Error:', data);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Run the test
console.log('Testing registration endpoint...');
console.log('================================');
testRegistration();