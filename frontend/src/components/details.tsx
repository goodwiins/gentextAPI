import { CardTitle, CardDescription, CardHeader, CardContent, CardFooter, Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchUserId } from '../utils/auth';
import axios from "axios";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/Icons';
import { toast } from 'react-hot-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MotionCard = motion(Card);

export default function Details() {
  const [userData, setUserData] = useState({ first_name: '', email: '', last_name: '', id: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    fetchUserId().then(user_id => {
      if (user_id) {
        axios
          .get(`http://127.0.0.1:8000/api/user/${user_id}/data`, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem('token')}`
            }
          })
          .then((response) => {
            setUserData(response.data);
            setIsLoading(false);
          })
          .catch((error) => {
            console.error("Error fetching user data:", error);
            toast.error('Failed to load user data');
            setIsLoading(false);
          });
      }
    });
  }, []);

  const emailUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const updatedData = {
      first_name: formData.get('name') as string,
      email: formData.get('email') as string,
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/user/update', {
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
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('An error occurred while updating user data:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const passwordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPasswordSaving(true);
    const formData = new FormData(event.currentTarget);
    const newPassword = formData.get('new-password') as string;
    const confirmPassword = formData.get('confirm-password') as string;
  
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      setIsPasswordSaving(false);
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
        toast.success('Password updated successfully');
        event.currentTarget.reset();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('An error occurred while updating the password:', error);
      toast.error('Failed to update password');
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleAppearanceUpdate = () => {
    // Implement appearance update logic here
    toast.success('Appearance settings saved');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 md:p-10">
        <div className="grid md:grid-cols-[1fr] gap-10">
          <div className="h-[60px] w-[200px] rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse mb-6"></div>
          <div className="space-y-6">
            <div className="h-[300px] w-full rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
            <div className="h-[300px] w-full rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
            <div className="h-[300px] w-full rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.main 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-8 md:p-10"
    >
      <div className="mb-10 flex flex-col space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Account Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Manage your account preferences and settings
        </p>
      </div>

      <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab} className="mb-12">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-10">
          <TabsTrigger value="account" className="flex items-center gap-2 py-3">
            <Icons.PlusCircle className="h-5 w-5" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 py-3">
            <Icons.Shield className="h-5 w-5" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2 py-3">
            <Icons.Settings className="h-5 w-5" />
            <span>Appearance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-8">
          <MotionCard 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <CardHeader className="space-y-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-b border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Icons.PlusCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Personal Information</CardTitle>
                  <CardDescription className="text-base mt-1">Update your account profile information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 p-8">
              <form id="accountForm" onSubmit={emailUpdate} className="space-y-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name" className="text-base font-medium mb-2 block">Full Name</Label>
                      <Input 
                        defaultValue={userData.first_name} 
                        id="name" 
                        name="name"
                        className="h-12"
                        placeholder="Enter your full name"
                        autoComplete="name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-base font-medium mb-2 block">Email Address</Label>
                      <Input 
                        defaultValue={userData.email} 
                        id="email" 
                        name="email" 
                        type="email"
                        className="h-12"
                        placeholder="Enter your email"
                        autoComplete="email"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end p-6">
              <Button 
                type="submit" 
                form="accountForm"
                disabled={isSaving}
                className="flex items-center gap-2 h-12 px-6"
              >
                {isSaving ? (
                  <>
                    <Icons.Loader className="h-5 w-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Icons.PlusCircle className="h-5 w-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </MotionCard>
        </TabsContent>

        <TabsContent value="security" className="space-y-8">
          <MotionCard 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <CardHeader className="space-y-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-b border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Icons.Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Password</CardTitle>
                  <CardDescription className="text-base mt-1">Update your account password</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 p-8">
              <form id="passwordUpdate" onSubmit={passwordUpdate} className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="current-password" className="text-base font-medium mb-2 block">Current Password</Label>
                    <Input 
                      id="current-password" 
                      name="current-password" 
                      type="password"
                      className="h-12"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="new-password" className="text-base font-medium mb-2 block">New Password</Label>
                      <Input 
                        id="new-password" 
                        name="new-password" 
                        type="password"
                        className="h-12"
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password" className="text-base font-medium mb-2 block">Confirm Password</Label>
                      <Input 
                        id="confirm-password" 
                        name="confirm-password" 
                        type="password"
                        className="h-12"
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800/50 p-5 rounded-lg mt-6">
                    <p className="text-base text-yellow-800 dark:text-yellow-200 flex items-center">
                      <Icons.AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                      Use a strong password that you don't use for other websites
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end p-6">
              <Button 
                type="submit" 
                form="passwordUpdate"
                disabled={isPasswordSaving}
                className="flex items-center gap-2 h-12 px-6"
              >
                {isPasswordSaving ? (
                  <>
                    <Icons.Loader className="h-5 w-5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Icons.Shield className="h-5 w-5" />
                    <span>Update Password</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </MotionCard>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-8">
          <MotionCard 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <CardHeader className="space-y-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-b border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Icons.Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Appearance</CardTitle>
                  <CardDescription className="text-base mt-1">Customize your app experience</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 p-8">
              <div className="space-y-8">
                <div className="grid gap-8">
                  <div className="flex items-center justify-between p-6 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Icons.Moon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">Dark Mode</p>
                        <p className="text-base text-gray-500 dark:text-gray-400 mt-1">Toggle dark mode theme</p>
                      </div>
                    </div>
                    <Checkbox 
                      id="dark-mode" 
                      checked={darkMode}
                      onCheckedChange={(checked) => setDarkMode(checked === true)}
                      className="h-6 w-6"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Icons.Contrast className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">High Contrast</p>
                        <p className="text-base text-gray-500 dark:text-gray-400 mt-1">Increase contrast for better readability</p>
                      </div>
                    </div>
                    <Checkbox 
                      id="high-contrast" 
                      checked={highContrast}
                      onCheckedChange={(checked) => setHighContrast(checked === true)}
                      className="h-6 w-6"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Icons.Type className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">Large Text</p>
                        <p className="text-base text-gray-500 dark:text-gray-400 mt-1">Increase font size for better visibility</p>
                      </div>
                    </div>
                    <Checkbox 
                      id="font-size" 
                      checked={fontSize}
                      onCheckedChange={(checked) => setFontSize(checked === true)}
                      className="h-6 w-6"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end p-6">
              <Button 
                onClick={handleAppearanceUpdate}
                className="flex items-center gap-2 h-12 px-6"
              >
                <Icons.Settings className="h-5 w-5" />
                <span>Save Appearance Settings</span>
              </Button>
            </CardFooter>
          </MotionCard>
        </TabsContent>
      </Tabs>
    </motion.main>
  );
}
  