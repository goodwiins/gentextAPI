// utils/auth.ts
export const fetchUserId = async (): Promise<string | null> => {
  const token = sessionStorage.getItem('token');
  console.log('Token:', token);
  if (!token) {
    console.log('Token not found');
    return null;
  }

  try {
    // This URL was incorrect in your code - it should use your API endpoint
    // 'http://localhost:8000/protected' is probably wrong
    const response = await fetch('http://127.0.0.1:8000/api/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('User ID response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('User ID data:', data);
      return data.user_id;
    } else {
      console.log('Failed to fetch user id, status:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user id:', error);
    return null;
  }
};