import { CardTitle, CardDescription, CardHeader, CardContent, CardFooter, Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchUserId } from '../utils/auth';
import axios from "axios";
import { useEffect, useState } from "react";

export default function Details() {
  const [userData, setUserData] = useState({ first_name: '', email: '', last_name: '', id: '' });

  useEffect(() => {
    fetchUserId().then(user_id => {
      if (user_id) {
        // Fetch all user data
        axios
          .get(`http://127.0.0.1:8000/api/user/${user_id}/data`, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem('token')}`
            }
          })
          .then((response) => {
            setUserData(response.data); // Store the user data
            console.log("User data:", response.data);
          })
          .catch((error) => {
            console.error("Error fetching user data:", error);
          });
      }
    });
  }, []);
  const emailUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedData = {
      first_name: formData.get('name') as string,
      email: formData.get('email') as string,
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/user/update', { // Adjust the API endpoint as necessary
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUserData(updatedUser);
      } else {
        console.error('Failed to update user data');
      }
    } catch (error) {
      console.error('An error occurred while updating user data:', error);
    }
  };


  const passwordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newPassword = formData.get('new-password') as string;
    const confirmPassword = formData.get('confirm-password') as string;
  
    if (newPassword !== confirmPassword) {
      console.error('New password and confirm password do not match');
      return;
    }
  
    const updatedData = {
      password: newPassword,
    };
  
    try {
      const response = await fetch('http://127.0.0.1:8000/api/user/update_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedData),
      });
  
      if (response.ok) {
        console.log('Password updated successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to update password:', errorData.error);
      }
    } catch (error) {
      console.error('An error occurred while updating the password:', error);
    }
  };


  return (
    <main className="flex-1 p-6 md:p-0">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-[240px_1fr] gap-8">
          <div className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account information and preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                 <form id = "accountForm" onSubmit={emailUpdate}>
          <div className="space-y-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input defaultValue={userData.first_name} id="name" name="name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input defaultValue={userData.email} id="email" name="email" type="email" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="accountForm">Save Changes</Button>
      </CardFooter>
            </Card>
            <Card>
  <CardHeader>
    <CardTitle>Password</CardTitle>
    <CardDescription>Manage your account password.</CardDescription>
  </CardHeader>
  <CardContent>
    <form  id = "passwordUpdate" onSubmit={passwordUpdate}>
      <div className="space-y-2">
        <div>
          <Label htmlFor="current-password">Current Password</Label>
          <Input id="current-password" name="current-password" type="password" />
        </div>
        <div>
          <Label htmlFor="new-password">New Password</Label>
          <Input id="new-password" name="new-password" type="password" />
        </div>
        <div>
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input id="confirm-password" name="confirm-password" type="password" />
        </div>
      </div>
    </form>
  </CardContent>
  <CardFooter>
    <Button type="submit" form="passwordUpdate">Save Changes</Button>
  </CardFooter>
</Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the appearance of the app.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="dark-mode" />
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="high-contrast" />
                    <Label htmlFor="high-contrast">High Contrast</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="font-size" />
                    <Label htmlFor="font-size">Increase Font Size</Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
  