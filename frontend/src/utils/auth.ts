// utils/auth.ts

export const fetchUserId = async (): Promise<string | null> => {
  const token = sessionStorage.getItem('token'); // Fetch token from sessionStorage
  console.log('Token:', token);
  if (!token) {
    console.log('Token not found');
    return null;
  }

  try {
    const response = await fetch('http://localhost:5000/protected', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.user_id;
    } else {
      console.log('Failed to fetch user id');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user id:', error);
    return null;
  }
};
