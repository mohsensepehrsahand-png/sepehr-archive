"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function TestAuthPage() {
  const { user, isAdmin, loading } = useAuth();
  const [apiTest, setApiTest] = useState<any>(null);

  useEffect(() => {
    // Test API call
    const testApi = async () => {
      try {
        const response = await fetch('/api/finance/projects');
        const data = await response.json();
        setApiTest({
          status: response.status,
          data: data
        });
      } catch (error) {
        setApiTest({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    testApi();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Authentication Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Auth Context Status:</h2>
        <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not logged in'}</p>
        <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>API Test Results:</h2>
        <pre>{JSON.stringify(apiTest, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Cookies:</h2>
        <p>Check browser developer tools → Application → Cookies to see if auth cookies are set</p>
      </div>

      <div>
        <a href="/login" style={{ color: 'blue', textDecoration: 'underline' }}>
          Go to Login Page
        </a>
      </div>
    </div>
  );
}
