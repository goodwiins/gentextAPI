import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { toast } from "react-hot-toast"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/Icons"
import { useAuthContext } from "@/context/auth-context"
import { account } from "@/lib/appwrite"
import { Models } from "appwrite"

interface FormData {
  firstName: string
  lastName: string
  email: string
  avatar: string
}

interface AuthState {
  user: Models.User<Models.Preferences> | null
  prefs: Models.Preferences
}

export default function Setting() {
  const router = useRouter()
  const { authState, logout } = useAuthContext()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    firstName: authState.user?.prefs?.FirstName || '',
    lastName: authState.user?.prefs?.LastName || '',
    email: authState.user?.email || '',
    avatar: authState.user?.prefs?.avatar || ''
  })

  useEffect(() => {
    if (!authState.isLoading && !authState.user) {
      router.push("/login")
    }
  }, [authState, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const updatedPrefs = await account.updatePrefs({
        FirstName: formData.firstName,
        LastName: formData.lastName,
        avatar: formData.avatar
      })

      // Refresh the page to update the user data
      router.reload()
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh_-_theme(spacing.16))] w-full bg-gray-50/50 dark:bg-gray-950/50">
      <main className="container mx-auto py-10 px-4 md:px-6">
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="hidden md:flex"
            >
              <Icons.Moon className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="grid gap-10">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your account settings and profile information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your email address cannot be changed.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar">Profile Picture URL</Label>
                    <Input
                      id="avatar"
                      name="avatar"
                      placeholder="Enter image URL for your profile picture"
                      value={formData.avatar}
                      onChange={handleInputChange}
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Enter a valid image URL to update your profile picture.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && (
                        <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your account security settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Add an extra layer of security to your account.
                    </p>
                  </div>
                  <Button variant="outline" disabled>Coming Soon</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="font-medium text-red-600 dark:text-red-500">Delete Account</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Permanently delete your account and all data.
                    </p>
                  </div>
                  <Button 
                    variant="destructive"
                    onClick={() => toast.error('This feature is not available yet')}
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
